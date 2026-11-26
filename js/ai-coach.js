/* AI Leadership Arena — optional AI coach (OpenAI or Anthropic, any model).
 * Runs only when the user saves their own API key in Settings (stored in this browser only).
 * Uses direct browser calls (no build step / SDK in a file:// app).
 * Strategy: try structured JSON output first; if the chosen model rejects those parameters,
 * retry once with a plain request and parse JSON from the text.
 * Any failure falls back silently to the built-in rubric evaluator. */
window.Arena = window.Arena || {};

(function (A) {
  const PROVIDERS = {
    openai: {
      name: "OpenAI",
      endpoint: "https://api.openai.com/v1/chat/completions",
      defaultModel: "gpt-4o-mini",
      suggestions: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1", "gpt-5-mini", "gpt-5"],
      keyHint: "sk-…"
    },
    anthropic: {
      name: "Anthropic (Claude)",
      endpoint: "https://api.anthropic.com/v1/messages",
      defaultModel: "claude-opus-5-5",
      suggestions: ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5", "claude-fable-5-2"],
      keyHint: "sk-ant-…"
    }
  };

  const SCHEMA = {
    type: "object",
    additionalProperties: false,
    required: ["scores", "overall", "strengths", "fixes", "rewrite", "curveball"],
    properties: {
      scores: { type: "object", additionalProperties: false, required: ["outcome", "recommendation", "tradeoff", "stakeholder", "economy"],
        properties: { outcome: { type: "integer" }, recommendation: { type: "integer" }, tradeoff: { type: "integer" }, stakeholder: { type: "integer" }, economy: { type: "integer" } } },
      overall: { type: "integer" },
      strengths: { type: "array", items: { type: "string" } },
      fixes: { type: "array", items: { type: "string" } },
      rewrite: { type: "string" },
      curveball: { type: "string" }
    }
  };

  const SYSTEM = `You are an exacting but supportive executive coach for senior AI leaders (Heads of AI, CDAOs, AI practice leads).
You assess written responses to realistic leadership scenarios. Score each dimension 0-100:
- outcome: anchors in the business outcome/decision, not technology
- recommendation: one clear, specific recommendation (numbers, owners, dates)
- tradeoff: makes trade-offs, risks and change-of-course conditions visible
- stakeholder: acknowledges the other party's interests and concerns
- economy: concise, no hedging or jargon, sounds like a confident executive
Calibrate: 50 = competent manager, 70 = solid executive, 85+ = boardroom-ready. Do not inflate.
strengths: exactly 2 short, specific observations quoting the response where useful.
fixes: exactly 2 short, actionable improvements.
rewrite: a stronger version of THEIR response in 4-6 sentences, keeping their intent and voice.
curveball: one tough, realistic follow-up challenge the most sceptical stakeholder would now raise, targeting the weakest part of their answer (1-2 sentences, in that stakeholder's voice).
Respond ONLY with a JSON object with exactly these keys: {"scores":{"outcome":int,"recommendation":int,"tradeoff":int,"stakeholder":int,"economy":int},"overall":int,"strengths":[string,string],"fixes":[string,string],"rewrite":string,"curveball":string}`;

  /* ---------- Settings helpers ---------- */
  function settings() {
    const s = A.store.getSettings();
    const provider = PROVIDERS[s.provider] ? s.provider : "openai";
    return { provider, model: (s.model || "").trim() || PROVIDERS[provider].defaultModel, apiKey: (s.apiKeys || {})[provider] || "", aiEnabled: !!s.aiEnabled };
  }
  function enabled() { const s = settings(); return s.aiEnabled && !!s.apiKey; }

  /** Pull a JSON object out of model text (handles code fences and leading prose). */
  function parseJson(text) {
    const t = String(text || "").replace(/```(json)?/gi, "").trim();
    try { return JSON.parse(t); } catch (e) { /* fall through */ }
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
    throw new Error("The AI response was not valid JSON");
  }

  async function post(url, headers, body) {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const text = await res.text();
    if (!res.ok) { const err = new Error(`${res.status}: ${text.slice(0, 220)}`); err.status = res.status; throw err; }
    return JSON.parse(text);
  }

  /* ---------- OpenAI (Chat Completions) ---------- */
  async function callOpenAI(s, system, user, maxTokens, structured) {
    const headers = { "content-type": "application/json", "authorization": "Bearer " + s.apiKey };
    const base = { model: s.model, max_completion_tokens: maxTokens, messages: [{ role: "system", content: system }, { role: "user", content: user }] };
    let msg;
    if (structured) {
      try {
        msg = await post(PROVIDERS.openai.endpoint, headers, Object.assign({}, base, { response_format: { type: "json_schema", json_schema: { name: "coach_feedback", strict: true, schema: SCHEMA } } }));
      } catch (e) {
        if (e.status !== 400) throw e; // model doesn't support json_schema → plain retry below
      }
    }
    if (!msg) msg = await post(PROVIDERS.openai.endpoint, headers, base);
    const choice = (msg.choices || [])[0];
    if (!choice) throw new Error("Empty response from OpenAI");
    if (choice.message && choice.message.refusal) throw new Error("The model declined this request.");
    if (choice.finish_reason === "length") throw new Error("The AI response was cut off.");
    return choice.message.content || "";
  }

  /* ---------- Anthropic (Messages API) ---------- */
  async function callAnthropic(s, system, user, maxTokens, structured) {
    const headers = { "content-type": "application/json", "x-api-key": s.apiKey, "anthropic-version": "2026-10-21", "anthropic-dangerous-direct-browser-access": "true" };
    const base = { model: s.model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] };
    let msg;
    if (structured) {
      // Current models: structured output + server-side refusal fallback. Older models may reject these → plain retry.
      try {
        msg = await post(PROVIDERS.anthropic.endpoint, Object.assign({ "anthropic-beta": "server-side-fallback-2026-07-01" }, headers),
          Object.assign({}, base, { output_config: { format: { type: "json_schema", schema: SCHEMA } }, fallbacks: "default" }));
      } catch (e) {
        if (e.status !== 400) throw e;
      }
    }
    if (!msg) msg = await post(PROVIDERS.anthropic.endpoint, headers, base);
    if (msg.stop_reason === "refusal") throw new Error("The model declined this request.");
    if (msg.stop_reason === "max_tokens") throw new Error("The AI response was cut off.");
    const block = (msg.content || []).find(b => b.type === "text");
    if (!block) throw new Error("No text in AI response");
    return block.text;
  }

  function call(system, user, maxTokens, structured) {
    const s = settings();
    return s.provider === "anthropic" ? callAnthropic(s, system, user, maxTokens, structured) : callOpenAI(s, system, user, maxTokens, structured);
  }

  /** Returns an evaluation in the same shape as the rubric evaluator, or throws. */
  async function evaluate(scenario, response, opts) {
    opts = opts || {};
    const track = A.content.track(scenario.track);
    const prompt = [
      `Track: ${track.name}`,
      `Scenario: ${scenario.title}\n${scenario.situation}`,
      `Mission: ${scenario.mission}`,
      `Success criteria: ${scenario.criteria}`,
      opts.curveball ? `The leader first answered:\n"""${opts.firstAnswer}"""\nThen ${opts.who} challenged: "${opts.question}"\nThe leader's reply to the challenge (assess THIS reply, weighting stakeholder handling and composure):` : "The leader's response:",
      `"""${response}"""`,
      `Reference executive expressions for this track (use is a plus only if natural): ${track.expressions.map(e => e[0]).join(" | ")}`
    ].join("\n\n");
    const r = parseJson(await call(SYSTEM, prompt, 4000, true));
    if (!r.scores) throw new Error("AI response missing scores");
    const clamp = v => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    const dims = {}; Object.keys(A.evaluator.DIMS).forEach(k => dims[k] = clamp(r.scores[k]));
    return { overall: clamp(r.overall), dims, strengths: (r.strengths || []).slice(0, 2), fixes: (r.fixes || []).slice(0, 3),
      rewrite: r.rewrite, aiCurveball: r.curveball, expressions: A.evaluator.expressionsUsed(response, scenario.track), source: "ai" };
  }

  /** Blend: AI judgement weighted 70%, rubric 30% for stability. */
  async function evaluateWithFallback(scenario, response, opts) {
    const rubric = A.evaluator.evaluateText(response, scenario, opts);
    if (!enabled()) return rubric;
    try {
      const ai = await evaluate(scenario, response, opts);
      const dims = {}; Object.keys(rubric.dims).forEach(k => dims[k] = Math.round(ai.dims[k] * 0.7 + rubric.dims[k] * 0.3));
      return Object.assign({}, ai, { dims, overall: Math.round(ai.overall * 0.7 + rubric.overall * 0.3), rubric });
    } catch (e) {
      console.warn("AI coach unavailable, using rubric:", e.message);
      return Object.assign(rubric, { aiError: e.message });
    }
  }

  async function test() {
    const text = await call("You are a connection test.", "Reply with the single word: ready", 1000, false);
    return text.trim();
  }

  function label() { const s = settings(); return `${PROVIDERS[s.provider].name} · ${s.model}`; }

  A.ai = { PROVIDERS, enabled, evaluateWithFallback, test, settings, label };
})(window.Arena);
