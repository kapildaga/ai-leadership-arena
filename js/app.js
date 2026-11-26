/* AI Leadership Arena — UI controller. */
window.Arena = window.Arena || {};

(function (A) {
  const C = A.content, E = A.engine, V = A.evaluator, ST = A.store;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const initials = n => (n || "?").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const LETTERS = "ABCDEFGH";

  const S = { meta: null, data: null, view: "profiles", params: {} };

  /* ---------- Utilities ---------- */
  let toastTimer;
  function toast(msg, ms) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), ms || 2400); }
  A.ui = { toast };

  function save() { if (S.data) { ST.saveData(S.data); ST.touchSession(); S.meta = ST.getProfileMeta(S.meta.id) || S.meta; } }

  function modal(html, bind) {
    const root = $("#modal-root");
    root.innerHTML = `<div class="modal-back"><div class="modal">${html}</div></div>`;
    const close = () => { root.innerHTML = ""; };
    root.querySelector(".modal-back").addEventListener("click", e => { if (e.target.classList.contains("modal-back")) close(); });
    bind && bind(root, close);
    const f = root.querySelector("input"); f && f.focus();
  }
  function confirmBox(title, body, okLabel, danger) {
    return new Promise(res => modal(`<h3>${esc(title)}</h3><p class="muted">${esc(body)}</p><div class="row mt" style="justify-content:flex-end"><button class="secondary" data-x="no">Cancel</button><button class="${danger ? "danger" : "primary"}" data-x="ok">${esc(okLabel || "Confirm")}</button></div>`,
      (root, close) => { root.querySelector('[data-x="no"]').onclick = () => { close(); res(false); }; root.querySelector('[data-x="ok"]').onclick = () => { close(); res(true); }; }));
  }
  function pinBox(name) {
    return new Promise(res => modal(`<h3>Welcome back, ${esc(name)}</h3><p class="muted small">Enter your PIN to continue.</p><div class="field"><input type="password" inputmode="numeric" maxlength="8" id="pinIn" placeholder="PIN"></div><div class="row" style="justify-content:flex-end"><button class="secondary" data-x="no">Cancel</button><button class="primary" data-x="ok">Unlock</button></div>`,
      (root, close) => {
        const go = () => { const v = root.querySelector("#pinIn").value; close(); res(v); };
        root.querySelector('[data-x="no"]').onclick = () => { close(); res(null); };
        root.querySelector('[data-x="ok"]').onclick = go;
        root.querySelector("#pinIn").addEventListener("keydown", e => { if (e.key === "Enter") go(); });
      }));
  }
  function download(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function readJsonFile(input) {
    return new Promise((res, rej) => { const f = input.files[0]; if (!f) return rej(new Error("No file selected")); const r = new FileReader(); r.onload = () => { try { res(JSON.parse(r.result)); } catch (e) { rej(new Error("File is not valid JSON")); } }; r.readAsText(f); });
  }

  function ring(score, size) {
    size = size || 92; const r = size / 2 - 7, c = 2 * Math.PI * r, col = score >= 70 ? "#167c80" : score >= 40 ? "#b77a20" : "#c26a59";
    return `<svg class="score-ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#edf0f3" stroke-width="8"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c * score / 100} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="${size / 3.6}" font-weight="800" fill="#14263d">${Math.round(score)}</text></svg>`;
  }

  function radar(mastery, size) {
    size = size || 320; const cx = size / 2, cy = size / 2, R = size / 2 - 34, n = C.tracks.length;
    const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * R * v / 100, cy + Math.sin(a) * R * v / 100]; };
    let g = "";
    [25, 50, 75, 100].forEach(l => { g += `<polygon points="${C.tracks.map((_, i) => pt(i, l).join(",")).join(" ")}" fill="none" stroke="#e3e8ee"/>`; });
    C.tracks.forEach((t, i) => {
      const [x, y] = pt(i, 100); g += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#e3e8ee"/>`;
      const [lx, ly] = pt(i, 122); const anchor = Math.abs(lx - cx) < 8 ? "middle" : lx > cx ? "start" : "end";
      g += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="central" font-size="11" fill="#46566a">${esc(t.short)}</text>`;
      g += `<text x="${lx}" y="${ly + 13}" text-anchor="${anchor}" dominant-baseline="central" font-size="10" font-weight="800" fill="#167c80">${Math.round(mastery[t.id])}</text>`;
    });
    g += `<polygon points="${C.tracks.map((t, i) => pt(i, Math.max(4, mastery[t.id])).join(",")).join(" ")}" fill="rgba(22,124,128,.18)" stroke="#167c80" stroke-width="2"/>`;
    C.tracks.forEach((t, i) => { const [x, y] = pt(i, Math.max(4, mastery[t.id])); g += `<circle cx="${x}" cy="${y}" r="3.5" fill="#167c80"/>`; });
    return `<svg viewBox="-80 -16 ${size + 160} ${size + 44}" width="100%" style="max-width:${size + 160}px;display:block;margin:auto;overflow:visible" role="img" aria-label="Competency radar">${g}</svg>`;
  }

  /** An in-progress attempt worth resuming: unfinished scenario, or a drill/calibration with items left. */
  function resumable(d) {
    const ip = d.inProgress; if (!ip) return false;
    if (ip.mode === "drill") return !ip.drill.finished;
    if (ip.mode === "calibration") return !ip.calib.finished;
    return !(ip.st && ip.st.done);
  }
  const tierTag = t => `<span class="tag t${t}">L${t} · ${C.tierNames[t]}</span>`;
  const avgMastery = d => Math.round(C.tracks.reduce((s, t) => s + d.mastery[t.id], 0) / C.tracks.length);

  /* ---------- Navigation ---------- */
  function go(view, params) { S.view = view; S.params = params || {}; render(); window.scrollTo(0, 0); }

  function render() {
    const loggedIn = !!S.data && !["profiles", "lock"].includes(S.view);
    $("#topbar").classList.toggle("hidden", !loggedIn);
    if (loggedIn) {
      $$("#nav button").forEach(b => b.classList.toggle("active", b.dataset.view === S.view));
      const lv = E.levelFor(S.data.xp);
      $("#userchip").innerHTML = `<div class="avatar">${esc(initials(S.meta.name))}</div><div class="meta"><b>${esc(S.meta.name)}</b><small>${esc(lv.name)} · ${S.data.xp} XP</small></div><button class="ghost-btn" id="switchBtn" title="Sign out / switch profile">Switch</button>`;
      $("#switchBtn").onclick = logout;
    }
    const v = VIEWS[S.view] || VIEWS.home;
    const out = v();
    $("#app").innerHTML = out.html;
    out.bind && out.bind();
  }

  /* ---------- Session ---------- */
  function login(meta) {
    S.meta = meta; S.data = ST.loadData(meta.id);
    ST.startSession(meta.id); save();
    if (!S.data.calibrated) go("calibrate");
    else go("home");
  }
  function logout() { save(); ST.endSession(); S.meta = null; S.data = null; go("profiles"); }

  /* ======================= VIEWS ======================= */
  const VIEWS = {};

  /* ---------- Profiles ---------- */
  VIEWS.profiles = () => {
    const list = ST.listProfiles().sort((a, b) => b.lastActive - a.lastActive);
    const showForm = S.params.create || !list.length;
    return { html: `
      <div class="center-wrap">
        <header class="hero">
          <div class="eyebrow">Applied AI leadership · Practice arena</div>
          <h1>AI Leadership Arena</h1>
          <p>Sharpen the judgement that technical depth alone doesn't give you: strategy, investment calls, stakeholders, influence and people leadership. Practise on realistic situations that get harder as you improve.</p>
          <div class="hero-row"><span class="pill">8 competency tracks</span><span class="pill">4 difficulty tiers</span><span class="pill">Adaptive coaching</span><span class="pill">Progress saved per profile</span></div>
        </header>
        <div class="panel mt">
          ${list.length ? `<div class="spread mb"><h3>Choose your profile</h3><button class="small-btn" id="newProf">+ New profile</button></div>
          <div class="grid">${list.map(p => { const lv = E.levelFor(p.xp || 0); return `<button class="profile-card" data-id="${esc(p.id)}"><span class="avatar">${esc(initials(p.name))}</span><span style="flex:1"><b>${esc(p.name)}</b> ${p.pinHash ? "🔒" : ""}<br><span class="small muted">${esc(p.role || "AI leader")} · ${esc(lv.name)} · ${p.xp || 0} XP</span></span><span class="small muted">Last active ${new Date(p.lastActive).toLocaleDateString()}</span></button>`; }).join("")}</div>` : ""}
          <div id="createForm" class="${showForm ? "" : "hidden"} ${list.length ? "mt" : ""}">
            <h3>${list.length ? "New profile" : "Create your profile"}</h3>
            <p class="muted small">Each cohort member gets their own profile. Progress saves automatically on this device.</p>
            <div class="grid g2 mt-s">
              <div class="field"><label for="pName">Name</label><input id="pName" maxlength="40" placeholder="e.g. Priya Sharma"></div>
              <div class="field"><label for="pRole">Role</label><input id="pRole" maxlength="60" placeholder="e.g. Head of Applied AI"></div>
            </div>
            <div class="field"><label for="pPin">PIN (optional, 4–8 digits)</label><input id="pPin" type="password" inputmode="numeric" maxlength="8" placeholder="Protects your profile on a shared device"></div>
            <button class="primary teal" id="createBtn">Create profile & start calibration</button>
          </div>
          <div class="mt small muted">Moving devices? <label class="link-btn" style="cursor:pointer">Restore a profile from a backup file<input type="file" accept=".json,application/json" id="restoreFile" class="hidden"></label></div>
        </div>
      </div>`,
      bind() {
        $$(".profile-card").forEach(b => b.onclick = async () => {
          const meta = ST.getProfileMeta(b.dataset.id);
          if (meta.pinHash) { const pin = await pinBox(meta.name); if (pin == null) return; if (!(await ST.verifyPin(meta.id, pin))) return toast("Incorrect PIN"); }
          login(meta);
        });
        const nb = $("#newProf"); nb && (nb.onclick = () => { $("#createForm").classList.remove("hidden"); $("#pName").focus(); });
        $("#createBtn").onclick = async () => {
          const name = $("#pName").value.trim(), role = $("#pRole").value.trim(), pin = $("#pPin").value.trim();
          if (name.length < 2) return toast("Please enter your name");
          if (pin && !/^\d{4,8}$/.test(pin)) return toast("PIN must be 4–8 digits");
          if (ST.listProfiles().some(p => p.name.toLowerCase() === name.toLowerCase())) return toast("A profile with that name already exists");
          login(await ST.createProfile({ name, role, pin }));
        };
        $("#restoreFile").onchange = async e => {
          try { const meta = ST.importProfile(await readJsonFile(e.target), "restore"); toast(`Restored ${meta.name}. Set a PIN in Settings.`); login(meta); }
          catch (err) { toast(err.message); }
        };
      } };
  };

  /* ---------- Lock ---------- */
  VIEWS.lock = () => ({ html: `
    <div class="center-wrap" style="max-width:420px"><div class="panel">
      <div class="kicker">Session locked</div><h2>Welcome back, ${esc(S.meta.name)}</h2>
      <p class="muted small">You were idle for more than ${ST.SESSION_TTL_MIN} minutes. Your progress is saved.</p>
      <div class="field"><input type="password" id="lockPin" inputmode="numeric" maxlength="8" placeholder="PIN"></div>
      <div class="row"><button class="primary" id="unlock">Unlock</button><button class="secondary" id="other">Switch profile</button></div>
    </div></div>`,
    bind() {
      const go2 = async () => { if (await ST.verifyPin(S.meta.id, $("#lockPin").value)) { ST.startSession(S.meta.id); login(S.meta); } else toast("Incorrect PIN"); };
      $("#unlock").onclick = go2; $("#lockPin").addEventListener("keydown", e => e.key === "Enter" && go2()); $("#lockPin").focus();
      $("#other").onclick = logout;
    } });

  /* ---------- Calibration intro ---------- */
  VIEWS.calibrate = () => {
    if (S.data.inProgress && S.data.inProgress.mode === "calibration") return VIEWS.play();
    return { html: `
      <div class="player"><div class="panel">
        <div class="kicker">Step 1 · Calibration</div>
        <h2>Let's find your starting level</h2>
        <p class="muted">Eight quick leadership judgement calls, one per competency track. Your answers set your starting tier in each track, so you won't waste time on material you've already mastered and you'll be stretched where it counts.</p>
        <div class="grid g4 mt">${C.tracks.map(t => `<div class="stat"><span>${t.icon}</span><strong style="font-size:14px">${esc(t.short)}</strong></div>`).join("")}</div>
        <div class="row mt"><button class="primary teal" id="startCal">Start calibration · about 4 minutes</button><button class="secondary" id="skipCal">Skip, start everything at Foundation</button></div>
      </div></div>`,
      bind() {
        $("#startCal").onclick = () => { S.data.inProgress = { mode: "calibration", calib: { idx: 0, results: {} }, scenarioId: C.calibration[0].id, st: {} }; save(); render(); };
        $("#skipCal").onclick = () => { S.data.calibrated = true; save(); go("home"); };
      } };
  };

  /* ---------- Dashboard ---------- */
  VIEWS.home = () => {
    const d = S.data, lv = E.levelFor(d.xp), rec = E.recommend(d), dueCount = E.dueReviews(d).length;
    const ip = resumable(d) ? d.inProgress : null;
    const ipS = ip && C.byId[ip.scenarioId];
    const drillDone = d.lastDrillDay === ST.today();
    const recent = d.history.slice(-5).reverse();
    const firstName = esc(S.meta.name.split(" ")[0]);
    return { html: `
      <header class="hero">
        <div class="eyebrow">${esc(S.meta.role || "AI leader")} · ${esc(lv.name)}</div>
        <h1>${d.attempts ? `Welcome back, ${firstName}` : `Let's begin, ${firstName}`}</h1>
        <p>${lv.nextName ? `${lv.toNext} XP to <b>${esc(lv.nextName)}</b>.` : "You've reached the top title. Keep your edge sharp."} Average mastery across tracks: <b>${avgMastery(d)}</b>/100.</p>
        <div class="bar gold mt" style="max-width:420px;background:#ffffff26"><div style="width:${Math.round(lv.progress * 100)}%"></div></div>
      </header>

      <div class="grid g4 mt">
        <div class="stat"><strong>${d.xp}</strong><span>Experience points</span></div>
        <div class="stat"><strong>${d.streak.count} 🔥</strong><span>Day streak · best ${d.streak.best || 0}</span></div>
        <div class="stat"><strong>${d.attempts}</strong><span>Scenarios completed</span></div>
        <div class="stat"><strong>${dueCount}</strong><span>Spaced reviews due</span></div>
      </div>

      <div class="grid main-side mt">
        <div class="grid" style="align-content:start">
          ${ipS ? `<div class="panel" style="border-color:#f0d9b5;background:#fffaf2"><div class="spread"><div><div class="kicker" style="color:var(--gold)">Resume where you left off</div><h3 class="mt-s">${esc(ipS.title)}</h3><span class="small muted">${ip.mode === "drill" ? `Daily Drill · item ${ip.drill.idx + 1} of ${ip.drill.items.length}` : ip.mode === "calibration" ? "Calibration" : esc(C.track(ipS.track).short)}</span></div><div class="row"><button class="primary gold" id="resume">Resume</button><button class="small-btn" id="discard">Discard</button></div></div></div>` : ""}
          <div class="reco">
            <div class="spread"><span class="kicker">Next best practice</span>${tierTag(rec.scenario.tier)}</div>
            <h3>${esc(rec.scenario.title)}</h3>
            <div class="small muted">${esc(C.track(rec.scenario.track).name)} · ${esc(rec.scenario.industry)} · ${esc(C.tierFormats[rec.scenario.tier])}</div>
            <p class="small" style="margin:10px 0 14px">🧭 ${esc(rec.reason)}</p>
            <button class="primary teal" id="startRec">Start scenario</button>
          </div>
          <div class="panel">
            <div class="spread"><div><div class="kicker">Daily Drill</div><h3 class="mt-s">5 scenarios, built for you</h3></div>${drillDone ? '<span class="tag">Done today ✓</span>' : '<span class="tag t3">+30 XP bonus</span>'}</div>
            <p class="small muted">Three of your weakest areas at your current tier, one spaced review, and one stretch scenario a tier above your strongest area.</p>
            <button class="${drillDone ? "secondary" : "primary"}" id="startDrill">${drillDone ? "Run an extra drill" : "Start today's drill"}</button>
          </div>
          <div class="panel">
            <h3>Recent activity</h3>
            ${recent.length ? `<table><tbody>${recent.map(h => { const s = C.byId[h.scenarioId]; return `<tr><td>${esc(s ? s.title : h.scenarioId)}<div class="small muted">${esc(C.track(h.track).short)}</div></td><td>${tierTag(h.tier)}</td><td><b>${h.score}</b></td><td class="small muted">+${h.xp} XP</td></tr>`; }).join("")}</tbody></table>` : `<p class="muted small">No scenarios yet. Start with your next best practice above.</p>`}
          </div>
        </div>
        <div class="grid" style="align-content:start">
          <div class="panel"><h3>Competency radar</h3><p class="small muted">Mastery 0–100 per track. It adapts to every answer.</p>${radar(d.mastery)}</div>
          <div class="panel"><h3>Badges</h3><div class="row mt-s">${d.badges.length ? d.badges.map(b => `<span title="${esc(E.BADGES[b].desc)}" style="font-size:24px">${E.BADGES[b].icon}</span>`).join("") : '<span class="small muted">Your first badge is one scenario away.</span>'}</div></div>
        </div>
      </div>
      <div class="footer">Learn the expression, understand the judgement behind it, then make it your own.</div>`,
      bind() {
        $("#startRec").onclick = () => startSingle(rec.scenario.id);
        $("#startDrill").onclick = startDrill;
        const r = $("#resume"); r && (r.onclick = () => go("play"));
        const x = $("#discard"); x && (x.onclick = async () => { if (await confirmBox("Discard this attempt?", "Your in-progress answer will be lost. Nothing is scored.", "Discard", true)) { S.data.inProgress = null; save(); render(); } });
      } };
  };

  /* ---------- Tracks ---------- */
  VIEWS.tracks = () => {
    const d = S.data;
    return { html: `
      <div class="kicker">Competency tracks</div><h2>Your tier ladder</h2>
      <p class="muted">Score 70+ twice in a row at your current tier to move up. Two results below 40 step you back a tier to rebuild the fundamentals, without losing what you've unlocked. You can replay any unlocked tier.</p>
      <div class="grid g2 mt">${C.tracks.map(t => { const tr = d.tracks[t.id]; return `
        <div class="track-card">
          <div class="track-head"><span class="track-icon">${t.icon}</span><div style="flex:1"><h4>${esc(t.name)}</h4><div class="small muted">${esc(t.intro)}</div></div></div>
          <div class="spread small"><span>Mastery <b>${Math.round(d.mastery[t.id])}</b>/100</span><span class="muted">${tr.wins ? `${tr.wins}/2 strong results toward promotion` : ""}</span></div>
          <div class="bar"><div style="width:${d.mastery[t.id]}%"></div></div>
          <div class="ladder">${[1, 2, 3, 4].map(n => { const cls = n === tr.currentTier ? "current" : n <= tr.maxTier ? "unlocked" : "locked"; return `<div class="rung ${cls}"><button data-track="${t.id}" data-tier="${n}" ${n > tr.maxTier ? 'data-locked="1"' : ""}><b>L${n}</b>${C.tierNames[n]}${n > tr.maxTier ? " 🔒" : ""}</button></div>`; }).join("")}</div>
          <div class="row"><button class="primary" data-practice="${t.id}">Practise at ${C.tierNames[tr.currentTier]}</button><button class="small-btn" data-lib="${t.id}">Study expressions</button></div>
        </div>`; }).join("")}</div>`,
      bind() {
        $$(".rung button").forEach(b => b.onclick = () => {
          if (b.dataset.locked) return toast(`Unlock by scoring 70+ twice at the tier below`);
          startSingle(E.pickScenario(S.data, b.dataset.track, +b.dataset.tier).id);
        });
        $$("[data-practice]").forEach(b => b.onclick = () => { const t = b.dataset.practice; startSingle(E.pickScenario(S.data, t, S.data.tracks[t].currentTier).id); });
        $$("[data-lib]").forEach(b => b.onclick = () => go("library", { track: b.dataset.lib }));
      } };
  };

  /* ---------- Expression library ---------- */
  VIEWS.library = () => {
    const filter = S.params.track || "all";
    const list = () => {
      const q = ($("#libSearch") ? $("#libSearch").value : "").toLowerCase();
      return C.tracks.filter(t => filter === "all" || t.id === filter).map(t => t.expressions.map((e, i) => ({ t, e, i }))).flat()
        .filter(x => !q || x.e.join(" ").toLowerCase().includes(q))
        .map(({ t, e, i }) => { const key = `${t.id}:${i}`, done = S.data.explored.includes(key); return `
          <div class="expr-card"><div class="spread"><span class="tag">${esc(t.short)}</span>${done ? '<span class="tag gray">Studied ✓</span>' : ""}</div>
          <h4>“${esc(e[0])}”</h4><div><span class="label">Meaning</span><p>${esc(e[1])}</p></div>
          <div><span class="label">In an executive conversation</span><p class="example">${esc(e[2])}</p></div>
          <div class="row" style="margin-top:auto"><button class="small-btn" data-study="${key}" ${done ? "disabled" : ""}>${done ? "Studied" : "Mark studied · +2 XP"}</button><button class="small-btn" data-copy="${key}">Copy</button><button class="small-btn" data-prac="${t.id}">Practise this track</button></div></div>`; }).join("") || '<p class="muted">No expressions match.</p>';
    };
    return { html: `
      <div class="kicker">Expression library</div><h2>Executive language, with the judgement behind it</h2>
      <p class="muted">${C.tracks.reduce((s, t) => s + t.expressions.length, 0)} expressions across ${C.tracks.length} tracks. Use them naturally in written challenges; the evaluator recognises them.</p>
      <input class="search mt" id="libSearch" placeholder="Search expressions, meanings, examples…">
      <div class="chips mt-s"><button class="chip ${filter === "all" ? "active" : ""}" data-f="all">All tracks</button>${C.tracks.map(t => `<button class="chip ${filter === t.id ? "active" : ""}" data-f="${t.id}">${esc(t.short)}</button>`).join("")}</div>
      <div class="grid g2 mt" id="libList"></div>`,
      bind() {
        const draw = () => {
          $("#libList").innerHTML = list();
          $$("[data-study]").forEach(b => b.onclick = () => { if (!S.data.explored.includes(b.dataset.study)) { S.data.explored.push(b.dataset.study); S.data.xp += 2; const ev = []; E.checkGlobalBadges(S.data, ev); save(); ev.forEach(e => toast(e.text)); render(); } });
          $$("[data-copy]").forEach(b => b.onclick = () => { const [tid, i] = b.dataset.copy.split(":"); const txt = C.track(tid).expressions[+i][0]; (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast("Copied")).catch(() => toast("Copy isn't available in this browser")); });
          $$("[data-prac]").forEach(b => b.onclick = () => { const t = b.dataset.prac; startSingle(E.pickScenario(S.data, t, S.data.tracks[t].currentTier).id); });
        };
        draw();
        $("#libSearch").addEventListener("input", draw);
        $$("[data-f]").forEach(b => b.onclick = () => go("library", { track: b.dataset.f }));
      } };
  };

  /* ---------- Progress ---------- */
  VIEWS.progress = () => {
    const d = S.data;
    const stats = C.tracks.map(t => { const h = d.history.filter(x => x.track === t.id); return { t, n: h.length, avg: h.length ? Math.round(h.reduce((s, x) => s + x.score, 0) / h.length) : null }; });
    return { html: `
      <div class="kicker">My progress</div><h2>${esc(S.meta.name)} · ${esc(E.levelFor(d.xp).name)}</h2>
      <div class="grid main-side mt">
        <div class="panel"><h3>Competency by track</h3>
          <table><thead><tr><th>Track</th><th>Mastery</th><th>Current tier</th><th>Attempts</th><th>Avg score</th></tr></thead><tbody>
          ${stats.map(({ t, n, avg }) => `<tr><td>${t.icon} ${esc(t.short)}</td><td style="min-width:110px"><div class="bar"><div style="width:${d.mastery[t.id]}%"></div></div><span class="small muted">${Math.round(d.mastery[t.id])}</span></td><td>${tierTag(d.tracks[t.id].currentTier)}</td><td>${n}</td><td>${avg == null ? "–" : avg}</td></tr>`).join("")}
          </tbody></table>
        </div>
        <div class="panel">${radar(d.mastery)}</div>
      </div>
      <div class="panel mt"><h3>Badges</h3><div class="grid g4 mt-s">${Object.entries(E.BADGES).map(([id, b]) => `<div class="badge ${d.badges.includes(id) ? "" : "off"}"><div class="ic">${b.icon}</div><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`).join("")}</div></div>
      <div class="grid g2 mt">
        <div class="panel"><h3>History</h3>${d.history.length ? `<table><thead><tr><th>Date</th><th>Scenario</th><th>Tier</th><th>Score</th></tr></thead><tbody>${d.history.slice(-25).reverse().map(h => { const s = C.byId[h.scenarioId]; return `<tr><td class="small muted">${new Date(h.ts).toLocaleDateString()}</td><td>${esc(s ? s.title : h.scenarioId)}</td><td>${tierTag(h.tier)}</td><td><b>${h.score}</b></td></tr>`; }).join("")}</tbody></table>` : '<p class="muted small">No history yet.</p>'}</div>
        <div class="panel"><h3>Milestones & review queue</h3>
          ${(d.events || []).slice(-8).reverse().map(e => `<div class="event ${e.kind}">${e.kind === "promoted" ? "⬆️" : "↩️"} ${esc(e.text)} <span class="small muted" style="margin-left:auto">${new Date(e.ts).toLocaleDateString()}</span></div>`).join("") || '<p class="muted small">Promotions and step-backs will appear here.</p>'}
          <h4 class="mt">Spaced reviews (${d.reviewQueue.length})</h4>
          ${d.reviewQueue.map(r => { const s = C.byId[r.scenarioId]; return s ? `<div class="spread small" style="padding:6px 0;border-bottom:1px solid #f0f3f6"><span>${esc(s.title)}</span><span class="muted">${r.dueAt <= d.attempts ? "<b style='color:var(--gold)'>Due now</b>" : `in ${r.dueAt - d.attempts} rounds`}</span></div>` : ""; }).join("") || '<p class="muted small">Nothing queued. Weaker results are scheduled for review automatically.</p>'}
        </div>
      </div>` };
  };

  /* ---------- Cohort ---------- */
  VIEWS.cohort = () => {
    const rows = ST.listProfiles().map(p => { const d = ST.loadData(p.id); return { name: p.name, role: p.role, xp: d.xp, mastery: d.mastery, badges: d.badges.length, attempts: d.attempts, me: p.id === S.meta.id, src: "This device" }; })
      .concat(ST.getCohort().map(c => ({ name: c.name, role: c.role, xp: c.xp, mastery: c.mastery, badges: c.badges, attempts: c.attempts, src: "Imported " + new Date(c.importedAt).toLocaleDateString(), sourceId: c.sourceId })))
      .sort((a, b) => b.xp - a.xp);
    const strongest = m => { const t = C.tracks.slice().sort((a, b) => (m[b.id] || 0) - (m[a.id] || 0))[0]; return t.short; };
    const avg = m => Math.round(C.tracks.reduce((s, t) => s + (m[t.id] || 0), 0) / C.tracks.length);
    return { html: `
      <div class="kicker">Cohort</div><h2>Leaderboard</h2>
      <p class="muted">Profiles on this device appear automatically. To include teammates on other devices, each exports their profile and the cohort lead imports the files here.</p>
      <div class="panel mt"><table><thead><tr><th>#</th><th>Leader</th><th>Title</th><th>XP</th><th>Avg mastery</th><th>Strongest track</th><th>Scenarios</th><th>Badges</th><th></th></tr></thead><tbody>
        ${rows.map((r, i) => `<tr class="${r.me ? "me" : ""}"><td>${i + 1}</td><td>${esc(r.name)}<div class="small muted">${esc(r.role || "")} · ${esc(r.src)}</div></td><td class="small">${esc(E.levelFor(r.xp).name)}</td><td><b>${r.xp}</b></td><td>${avg(r.mastery)}</td><td class="small">${esc(strongest(r.mastery))}</td><td>${r.attempts || 0}</td><td>${r.badges}</td><td>${r.sourceId ? `<button class="small-btn" data-rm="${esc(r.sourceId)}">Remove</button>` : ""}</td></tr>`).join("")}
      </tbody></table></div>
      <div class="grid g2 mt">
        <div class="panel"><h3>Share my progress</h3><p class="small muted">Downloads a JSON file with your progress (no PIN or API key) to send to your cohort lead.</p><button class="primary" id="exp">Export my profile</button></div>
        <div class="panel"><h3>Import a teammate</h3><p class="small muted">Adds a read-only row to this leaderboard. Re-importing the same person updates their row.</p><label class="secondary" style="display:inline-block;cursor:pointer">Choose file…<input type="file" accept=".json,application/json" id="imp" class="hidden"></label></div>
      </div>`,
      bind() {
        $("#exp").onclick = exportMe;
        $("#imp").onchange = async e => { try { ST.importProfile(await readJsonFile(e.target), "cohort"); toast("Teammate added to the leaderboard"); render(); } catch (err) { toast(err.message); } };
        $$("[data-rm]").forEach(b => b.onclick = () => { ST.saveCohort(ST.getCohort().filter(c => c.sourceId !== b.dataset.rm)); render(); });
      } };
  };
  function exportMe() { download(ST.exportProfile(S.meta.id), `leadership-arena-${S.meta.name.replace(/\W+/g, "-").toLowerCase()}-${ST.today()}.json`); toast("Profile exported"); }

  /* ---------- Settings ---------- */
  VIEWS.settings = () => {
    const s = ST.getSettings();
    return { html: `
      <div class="kicker">Settings</div><h2>Profile, security & AI coach</h2>
      <div class="grid g2 mt">
        <div class="panel"><h3>Profile</h3>
          <div class="field mt-s"><label>Name</label><input id="sName" value="${esc(S.meta.name)}" maxlength="40"></div>
          <div class="field"><label>Role</label><input id="sRole" value="${esc(S.meta.role)}" maxlength="60"></div>
          <button class="primary" id="saveProf">Save profile</button>
          <h3 class="mt">PIN</h3><p class="small muted">${S.meta.pinHash ? "Your profile is PIN-protected. It locks after " + ST.SESSION_TTL_MIN + " idle minutes." : "No PIN set. Anyone using this browser can open your profile."}</p>
          <div class="row"><input id="newPin" type="password" inputmode="numeric" maxlength="8" placeholder="New PIN (4–8 digits)" style="padding:10px 12px;border:1px solid #d5dde5;border-radius:10px"><button class="secondary" id="setPin">${S.meta.pinHash ? "Change PIN" : "Set PIN"}</button>${S.meta.pinHash ? '<button class="small-btn" id="rmPin">Remove</button>' : ""}</div>
        </div>
        <div class="panel"><h3>AI coach (optional)</h3>
          <p class="small muted">The built-in evaluator works offline. Add your own OpenAI or Anthropic API key for deeper AI feedback on written Boardroom challenges, a rewritten version of your answer, and a personalised curveball aimed at your weakest point.</p>
          <div class="grid g2 mt-s">
            <div class="field"><label for="provider">Provider</label><select id="provider">${Object.entries(A.ai.PROVIDERS).map(([k, p]) => `<option value="${k}" ${s.provider === k ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></div>
            <div class="field"><label for="model">Model (any model ID from your provider)</label><input id="model" list="modelList" value="${esc(s.model)}" autocomplete="off"><datalist id="modelList"></datalist></div>
          </div>
          <div class="field"><label for="apiKey" id="keyLabel">API key</label><input id="apiKey" type="password" autocomplete="off"></div>
          <label class="row small"><input type="checkbox" id="aiOn" ${s.aiEnabled ? "checked" : ""}> Use the AI coach for written challenges</label>
          <div class="row mt-s"><button class="primary" id="saveAi">Save</button><button class="secondary" id="testAi">Test connection</button><span id="aiStatus" class="small muted"></span></div>
          <p class="note warn mt-s">Keys are stored only in this browser (one per provider), are shared by every profile on this device, and are never included in exports. Your written answers are sent to the provider you choose, and API usage is billed to your account.</p>
        </div>
        <div class="panel"><h3>Backup & restore</h3>
          <p class="small muted">Progress is saved in this browser automatically after every action. Export a backup regularly, or to move to another device.</p>
          <div class="row"><button class="primary" id="exp2">Export backup</button><label class="secondary" style="cursor:pointer">Restore from file…<input type="file" id="rest2" accept=".json,application/json" class="hidden"></label></div>
        </div>
        <div class="panel"><h3>Reset</h3>
          <div class="row"><button class="danger" id="resetMe">Reset my progress</button><button class="danger" id="delMe">Delete my profile</button></div>
          <p class="small muted mt-s">Both actions are permanent unless you've exported a backup first.</p>
        </div>
      </div>`,
      bind() {
        $("#saveProf").onclick = () => { const list = ST.listProfiles(); const m = list.find(p => p.id === S.meta.id); const n = $("#sName").value.trim(); if (n.length < 2) return toast("Name is too short"); m.name = n; m.role = $("#sRole").value.trim(); ST.saveProfiles(list); S.meta = m; toast("Profile saved"); render(); };
        $("#setPin").onclick = async () => { const p = $("#newPin").value.trim(); if (!/^\d{4,8}$/.test(p)) return toast("PIN must be 4–8 digits"); await ST.setPin(S.meta.id, p); S.meta = ST.getProfileMeta(S.meta.id); toast("PIN saved"); render(); };
        const rp = $("#rmPin"); rp && (rp.onclick = async () => { await ST.setPin(S.meta.id, null); S.meta = ST.getProfileMeta(S.meta.id); toast("PIN removed"); render(); });
        // Keys are kept per provider; switching provider swaps the key field and model suggestions.
        const keys = Object.assign({}, s.apiKeys);
        let shown = s.provider;
        const syncProvider = (resetModel) => {
          const p = A.ai.PROVIDERS[$("#provider").value];
          $("#modelList").innerHTML = p.suggestions.map(m => `<option value="${esc(m)}">`).join("");
          $("#keyLabel").textContent = `${p.name} API key`;
          $("#apiKey").placeholder = p.keyHint;
          $("#apiKey").value = keys[$("#provider").value] || "";
          if (resetModel) $("#model").value = p.defaultModel;
        };
        syncProvider(false);
        $("#provider").onchange = () => { keys[shown] = $("#apiKey").value.trim(); shown = $("#provider").value; syncProvider(true); $("#aiStatus").textContent = ""; };
        const saveAi = () => {
          keys[$("#provider").value] = $("#apiKey").value.trim();
          const provider = $("#provider").value;
          ST.saveSettings({ provider, model: $("#model").value.trim() || A.ai.PROVIDERS[provider].defaultModel, apiKeys: keys, aiEnabled: $("#aiOn").checked });
        };
        $("#saveAi").onclick = () => { saveAi(); toast(`AI coach saved: ${A.ai.label()}`); };
        $("#testAi").onclick = async () => { saveAi(); const st = $("#aiStatus"); if (!A.ai.settings().apiKey) return toast("Enter an API key first"); st.innerHTML = '<span class="spinner"></span> Testing…'; try { await A.ai.test(); st.textContent = `✓ Connected to ${A.ai.label()}`; } catch (e) { st.textContent = "✗ " + e.message; } };
        $("#exp2").onclick = exportMe;
        $("#rest2").onchange = async e => { try { const m = ST.importProfile(await readJsonFile(e.target), "restore"); toast(`Restored as a new profile: ${m.name}`); } catch (err) { toast(err.message); } };
        $("#resetMe").onclick = async () => { if (await confirmBox("Reset all progress?", "XP, mastery, badges and history for this profile will be erased. This can't be undone.", "Reset progress", true)) { const fresh = ST.loadData("__none__"); Object.assign(fresh, { id: S.meta.id }); S.data = fresh; save(); go("calibrate"); } };
        $("#delMe").onclick = async () => { if (await confirmBox("Delete this profile?", `${S.meta.name}'s profile and all progress will be permanently deleted from this device.`, "Delete profile", true)) { ST.deleteProfile(S.meta.id); S.meta = null; S.data = null; go("profiles"); } };
      } };
  };

  /* ======================= SCENARIO PLAYER ======================= */
  function startSingle(id) { S.data.inProgress = { mode: "single", scenarioId: id, st: {} }; save(); go("play"); }
  function startDrill() {
    const items = E.buildDrill(S.data);
    S.data.inProgress = { mode: "drill", drill: { items, idx: 0, results: [] }, scenarioId: items[0].id, st: {} }; save(); go("play");
  }

  VIEWS.play = () => {
    const ip = S.data.inProgress;
    if (!ip) return VIEWS.home();
    if (ip.mode === "drill" && ip.drill.finished) return drillSummary(ip);
    if (ip.mode === "calibration" && ip.calib.finished) return calibrationSummary(ip);
    const s = C.byId[ip.scenarioId], st = ip.st, t = C.track(s.track);
    let ctx = "";
    if (ip.mode === "drill") ctx = `<div class="spread mb"><span class="kicker">Daily Drill · ${ip.drill.idx + 1} of ${ip.drill.items.length}</span><span class="small muted">${esc(ip.drill.items[ip.drill.idx].why)}</span></div><div class="steps mb">${ip.drill.items.map((_, i) => `<i class="${i < ip.drill.idx ? "done" : i === ip.drill.idx ? "now" : ""}"></i>`).join("")}</div>`;
    if (ip.mode === "calibration") ctx = `<div class="spread mb"><span class="kicker">Calibration · ${ip.calib.idx + 1} of ${C.calibration.length}</span><span class="small muted">${esc(t.name)}</span></div><div class="steps mb">${C.calibration.map((_, i) => `<i class="${i < ip.calib.idx ? "done" : i === ip.calib.idx ? "now" : ""}"></i>`).join("")}</div>`;
    const R = { mcq: playMcq, bestworst: playBW, branch: playBranch, freetext: playFree }[s.type];
    const body = R(s, st, ip);
    return { html: `<div class="player">${ctx}<div class="panel">
      <div class="scenario-head"><span class="small muted">${t.icon} ${esc(t.name)}</span><span class="row" style="gap:6px"><span class="tag gray">${esc(s.industry)}</span>${tierTag(s.tier)}</span></div>
      <h2>${esc(s.title)}</h2>
      <div class="situation">${esc(s.situation)}${s.cast ? `<div class="cast">${s.cast.map(c => `<span>${esc(c)}</span>`).join("")}</div>` : ""}</div>
      ${body.html}
      ${st.done ? resultBlock(s, st, ip) : ""}
      ${!st.done && ip.mode !== "calibration" ? `<div class="mt small"><button class="link-btn" id="leave">Save & exit (you can resume later)</button></div>` : ""}
    </div></div>`,
      bind() {
        body.bind && body.bind();
        const l = $("#leave"); l && (l.onclick = () => go("home"));
        bindResult(s, st, ip);
      } };
  };

  /* ----- Tier 1: MCQ ----- */
  function playMcq(s, st) {
    const answered = st.choice != null;
    const best = s.options.reduce((b, x, i) => x.score > s.options[b].score ? i : b, 0);
    return { html: `<div class="question">${esc(s.question)}</div><div class="options">${s.options.map((o, i) => {
        let cls = "", marker = "";
        if (answered) { if (i === best) { cls = "correct"; marker = '<span class="marker" style="color:#2f7a52">Strongest</span>'; } else if (i === st.choice) { cls = "wrong"; marker = '<span class="marker" style="color:#b04a37">Your pick</span>'; } }
        return `<button class="option ${cls}" data-opt="${i}" ${answered ? "disabled" : ""}><span class="letter">${LETTERS[i]}</span><span>${esc(o.text)}${answered ? `<span class="fb">${esc(o.feedback)}</span>` : ""}</span>${marker}</button>`;
      }).join("")}</div>`,
      bind() { if (!answered) $$("[data-opt]").forEach(b => b.onclick = () => { st.choice = +b.dataset.opt; finish(s, V.scoreMcq(s, st.choice).score, {}); }); } };
  }

  /* ----- Tier 2: Best & worst ----- */
  function playBW(s, st) {
    const done = !!st.submitted;
    const stage = st.best == null ? "best" : st.worst == null ? "worst" : "ready";
    const prompt = done ? "" : stage === "best" ? "Step 1: select the <b>BEST</b> action." : stage === "worst" ? "Step 2: now select the <b>WORST</b> action." : "Both selected. Submit, or click a choice to change it.";
    return { html: `<div class="question">${esc(s.question)}</div>
      ${done ? "" : `<div class="bw-legend"><span>${prompt}</span></div>`}
      <div class="options">${s.options.map((o, i) => {
        let cls = "", marker = "";
        if (!done) { if (st.best === i) { cls = "sel-best"; marker = '<span class="marker" style="color:var(--teal)">Best</span>'; } if (st.worst === i) { cls = "sel-worst"; marker = '<span class="marker" style="color:#b04a37">Worst</span>'; } }
        else {
          if (o.rank === "best") cls = "correct"; if (o.rank === "worst") cls = "wrong";
          const mine = [st.best === i ? "your best" : "", st.worst === i ? "your worst" : ""].filter(Boolean).join(", ");
          marker = `<span class="marker" style="color:${o.rank === "best" ? "#2f7a52" : o.rank === "worst" ? "#b04a37" : "#647286"}">${o.rank === "mid" ? "Partial" : o.rank}${mine ? ` · ${mine}` : ""}</span>`;
        }
        return `<button class="option ${cls}" data-opt="${i}" ${done ? "disabled" : ""}><span class="letter">${LETTERS[i]}</span><span>${esc(o.text)}${done ? `<span class="fb">${esc(o.feedback)}</span>` : ""}</span>${marker}</button>`;
      }).join("")}</div>
      ${done ? "" : `<div class="row mt"><button class="primary" id="bwSubmit" ${stage === "ready" ? "" : "disabled"}>Submit judgement</button>${st.best != null || st.worst != null ? '<button class="small-btn" id="bwClear">Clear</button>' : ""}</div>`}`,
      bind() {
        if (done) return;
        $$("[data-opt]").forEach(b => b.onclick = () => {
          const i = +b.dataset.opt;
          if (st.best === i) st.best = null; else if (st.worst === i) st.worst = null;
          else if (st.best == null) st.best = i; else if (st.worst == null) st.worst = i; else st.worst = i;
          save(); render();
        });
        const c = $("#bwClear"); c && (c.onclick = () => { st.best = st.worst = null; save(); render(); });
        $("#bwSubmit").onclick = () => { st.submitted = true; finish(s, V.scoreBestWorst(s, st.best, st.worst).score, {}); };
      } };
  }

  /* ----- Tier 3: Branching simulation ----- */
  function playBranch(s, st) {
    st.choices = st.choices || [];
    const n = st.choices.length, total = s.steps.length;
    const m = V.meters(s, st.choices), prev = V.meters(s, st.choices.slice(0, Math.max(0, n - (st.showing ? 1 : 0))));
    const meterNames = { trust: "Stakeholder trust", value: "Business value", control: "Risk control", momentum: "Momentum" };
    const metersHtml = `<div class="meters">${Object.keys(m).map(k => { const dlt = st.showing ? m[k] - prev[k] : 0; return `<div class="meter"><div class="spread"><span>${meterNames[k]}</span>${dlt ? `<span class="delta ${dlt > 0 ? "up" : "down"}">${dlt > 0 ? "+" : ""}${dlt}</span>` : `<span class="muted">${m[k]}</span>`}</div><div class="bar ${k === "control" ? "gold" : ""}"><div style="width:${m[k]}%"></div></div></div>`; }).join("")}</div>`;
    const history = st.choices.slice(0, st.showing ? n - 1 : n).map((c, i) => `<div class="small" style="padding:6px 0;border-bottom:1px dashed #e3e8ee"><b>Decision ${i + 1}:</b> ${esc(s.steps[i].options[c].text)} <span class="muted">→ ${esc(s.steps[i].options[c].consequence)}</span></div>`).join("");
    let main = "";
    if (st.showing) {
      const o = s.steps[n - 1].options[st.choices[n - 1]];
      main = `<div class="consequence"><span class="label">Decision ${n} · what happened</span><b>${esc(o.text)}</b><p style="margin:6px 0 0">${esc(o.consequence)}</p></div>
        ${st.done ? "" : `<button class="primary" id="brNext">${n < total ? "Next decision →" : "See the outcome"}</button>`}`;
    } else if (n < total) {
      const step = s.steps[n];
      main = `<div class="question">Decision ${n + 1} of ${total}: ${esc(step.prompt)}</div><div class="options">${step.options.map((o, i) => `<button class="option" data-opt="${i}"><span class="letter">${LETTERS[i]}</span><span>${esc(o.text)}</span></button>`).join("")}</div>`;
    }
    return { html: `<div class="steps">${s.steps.map((_, i) => `<i class="${i < n ? "done" : i === n ? "now" : ""}"></i>`).join("")}</div>${metersHtml}${history}${main}`,
      bind() {
        $$("[data-opt]").forEach(b => b.onclick = () => { st.choices.push(+b.dataset.opt); st.showing = true; save(); render(); });
        const nx = $("#brNext"); nx && (nx.onclick = () => {
          if (st.choices.length < total) { st.showing = false; save(); render(); }
          else { const r = V.scoreBranch(s, st.choices); st.meters = V.meters(s, st.choices); finish(s, r.score, { perfect: r.perfect }); }
        });
      } };
  }

  /* ----- Tier 4: Written response + curveball ----- */
  function playFree(s, st) {
    st.phase = st.phase || "write";
    if (st.phase === "evaluating") st.phase = st.eval1 ? "curveball" : "write"; // recovered after reload
    const brief = `<div class="brief"><span class="label">Your mission</span><p style="margin:0 0 8px">${esc(s.mission)}</p><span class="label">Success criteria</span><p style="margin:0">${esc(s.criteria)}</p></div>`;
    const wc = t => (t || "").trim().split(/\s+/).filter(Boolean).length;
    if (st.phase === "write") {
      return { html: `${brief}
        <label class="label" for="resp">Your executive response · aim for 4–6 sentences</label>
        <textarea id="resp" placeholder="Frame the outcome, make your recommendation, name the trade-off, and acknowledge the stakeholders…">${esc(st.text || "")}</textarea>
        <div class="spread mt-s"><span class="wordcount" id="wc">${wc(st.text)} words · autosaved</span><span class="small muted">${A.ai.enabled() ? `🤖 AI coach: ${esc(A.ai.label())}` : "Built-in evaluator"}</span></div>
        <div class="row mt"><button class="primary" id="sub1">Submit response</button><button class="secondary" id="hint">Coaching hint</button><button class="secondary" id="exprs">Show track expressions</button></div>
        <div id="hintBox"></div>`,
        bind() {
          let tmr; const ta = $("#resp");
          ta.addEventListener("input", () => { st.text = ta.value; $("#wc").textContent = wc(ta.value) + " words · saving…"; clearTimeout(tmr); tmr = setTimeout(() => { save(); const el = $("#wc"); if (el) el.textContent = wc(ta.value) + " words · autosaved"; }, 500); });
          $("#hint").onclick = () => { $("#hintBox").innerHTML = `<div class="note mt-s">💡 ${esc(s.hint)}</div>`; };
          $("#exprs").onclick = () => { $("#hintBox").innerHTML = `<div class="note mt-s">${C.track(s.track).expressions.map(e => `• ${esc(e[0])}`).join("<br>")}</div>`; };
          $("#sub1").onclick = async () => {
            st.text = ta.value; if (wc(st.text) < 25) return toast("Write at least a few full sentences (25+ words) before submitting");
            st.phase = "evaluating"; save();
            $("#sub1").disabled = true; $("#sub1").innerHTML = '<span class="spinner"></span> Evaluating…';
            st.eval1 = await A.ai.evaluateWithFallback(s, st.text);
            if (st.eval1.aiError) toast("AI coach unavailable, so the built-in evaluator was used");
            st.curveQ = st.eval1.aiCurveball || s.curveball.text;
            st.phase = "curveball"; save(); render();
          };
        } };
    }
    if (st.phase === "curveball") {
      return { html: `${brief}
        <div class="spread"><span class="label">Your first response scored</span></div>
        <div class="result-top">${ring(st.eval1.overall, 70)}<div class="small" style="flex:1">${dimBars(st.eval1.dims, true)}</div></div>
        <div class="curveball"><div class="who">⚡ Curveball · ${esc(s.curveball.who)}</div><q>${esc(st.curveQ)}</q></div>
        <label class="label" for="resp2">Your reply · 2–4 sentences</label>
        <textarea id="resp2" style="min-height:110px" placeholder="Stay composed. Acknowledge, hold your position where it matters, offer something concrete.">${esc(st.text2 || "")}</textarea>
        <div class="row mt"><button class="primary" id="sub2">Submit reply</button><button class="secondary" id="skip">Skip curveball (−10%)</button></div>`,
        bind() {
          let tmr; const ta = $("#resp2");
          ta.addEventListener("input", () => { st.text2 = ta.value; clearTimeout(tmr); tmr = setTimeout(save, 500); });
          $("#skip").onclick = () => { st.skipped = true; complete(); };
          $("#sub2").onclick = async () => {
            st.text2 = ta.value; if (wc(st.text2) < 12) return toast("Give the stakeholder at least a couple of sentences");
            st.phase = "evaluating"; save(); $("#sub2").disabled = true; $("#sub2").innerHTML = '<span class="spinner"></span> Evaluating…';
            st.eval2 = await A.ai.evaluateWithFallback(s, st.text2, { curveball: true, firstAnswer: st.text, who: s.curveball.who, question: st.curveQ });
            complete();
          };
          function complete() {
            st.phase = "done";
            const score = st.skipped ? Math.round(st.eval1.overall * 0.9) : Math.round(st.eval1.overall * 0.65 + st.eval2.overall * 0.35);
            finish(s, score, { dims: st.eval1.dims });
          }
        } };
    }
    return { html: brief }; // done: result block renders details
  }

  function dimBars(dims, compact) {
    return `<div class="dims" ${compact ? 'style="margin:0"' : ""}>${Object.keys(V.DIMS).map(k => `<div class="dim"><span>${V.DIMS[k].name}</span><div class="bar ${dims[k] < 50 ? "gold" : ""}"><div style="width:${dims[k]}%"></div></div><b>${dims[k]}</b></div>`).join("")}</div>`;
  }

  /* ----- Finish & results ----- */
  function finish(s, score, extra) {
    const ip = S.data.inProgress, st = ip.st;
    st.done = true; st.score = score;
    if (ip.mode === "calibration") { ip.calib.results[s.track] = score; }
    else {
      st.summary = E.record(S.data, s, score, extra);
      if (ip.mode === "drill") ip.drill.results.push({ id: s.id, score, xp: st.summary.xp });
    }
    save(); render();
    setTimeout(() => { const r = $("#result"); r && r.scrollIntoView({ behavior: "smooth", block: "start" }); }, 50);
  }

  function resultBlock(s, st, ip) {
    if (ip.mode === "calibration") {
      const last = ip.calib.idx >= C.calibration.length - 1;
      return `<div class="result" id="result"><div class="row"><b>${st.score >= 100 ? "Strong call. You'll start this track at the Applied tier." : st.score >= 40 ? "Reasonable, but not the strongest call. You'll start at Foundation with a head start." : "Not quite. You'll start this track at Foundation."}</b></div><div class="row mt"><button class="primary teal" id="calNext">${last ? "See my starting profile" : "Next question →"}</button></div></div>`;
    }
    const sm = st.summary, md = sm.masteryAfter - sm.masteryBefore;
    const verdict = st.score >= 85 ? "Boardroom-ready judgement." : st.score >= 70 ? "Strong executive judgement." : st.score >= 40 ? "Solid instincts, with room to sharpen." : "This one is worth revisiting.";
    let detail = "";
    if (s.type === "branch") detail = `<div class="consequence"><span class="label">Debrief</span>${esc(s.debrief)}</div>`;
    if (s.type === "freetext") {
      const e1 = st.eval1, e2 = st.eval2;
      detail = `
        <h3 class="mt">Your written response ${e1.source === "ai" ? '<span class="tag">AI coach + rubric</span>' : '<span class="tag gray">Built-in rubric</span>'}</h3>
        ${dimBars(e1.dims)}
        <div class="grid g2"><div><span class="label">What worked</span><ul class="fb-list">${e1.strengths.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div><div><span class="label">Sharpen next time</span><ul class="fb-list">${e1.fixes.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
        ${e1.expressions.length ? `<div class="mt-s"><span class="label">Executive expressions detected</span>${e1.expressions.map(x => `<span class="expr-hit">“${esc(x.text)}”</span>`).join("")}</div>` : ""}
        <div class="compare mt"><div><span class="label">You wrote</span><blockquote>${esc(st.text)}</blockquote></div><div><span class="label">${e1.rewrite ? "AI coach's stronger version of your answer" : "A model answer"}</span><blockquote>${esc(e1.rewrite || s.modelAnswer)}</blockquote></div></div>
        <h3 class="mt">Curveball</h3>
        ${st.skipped ? '<p class="small muted">Skipped (score × 0.9). Under pressure, the follow-up is where executive presence shows. Try it next time.</p>' : `
          <div class="result-top">${ring(e2.overall, 64)}<div style="flex:1"><span class="label">Composure under challenge</span><ul class="fb-list small">${e2.strengths.slice(0, 1).concat(e2.fixes.slice(0, 1)).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
          <div class="compare mt-s"><div><span class="label">You replied</span><blockquote>${esc(st.text2)}</blockquote></div><div><span class="label">${e2.rewrite ? "AI coach's stronger reply" : "One strong reply"}</span><blockquote>${esc(e2.rewrite || s.curveball.modelAnswer)}</blockquote></div></div>`}`;
    }
    const isDrill = ip.mode === "drill", lastDrill = isDrill && ip.drill.idx >= ip.drill.items.length - 1;
    return `<div class="result" id="result">
      <div class="result-top">${ring(st.score)}
        <div style="flex:1"><h3>${verdict}</h3>
          <div class="row small mt-s"><span class="tag t3">+${sm.xp} XP</span><span>${esc(C.track(s.track).short)} mastery <b>${Math.round(sm.masteryBefore)} → ${Math.round(sm.masteryAfter)}</b> <span class="delta ${md >= 0 ? "up" : "down"}">(${md >= 0 ? "+" : ""}${md.toFixed(1)})</span></span></div>
        </div></div>
      ${sm.events.map(e => `<div class="event ${e.kind}">${esc(e.text)}</div>`).join("")}
      ${detail}
      ${s.expr != null ? `<div class="note mt"><span class="label">Expression to own</span>“${esc(C.track(s.track).expressions[s.expr][0])}”<br><span class="small">${esc(C.track(s.track).expressions[s.expr][1])}</span></div>` : ""}
      <div class="row mt">${isDrill ? `<button class="primary teal" id="nextItem">${lastDrill ? "Finish drill" : "Next drill item →"}</button>` : `<button class="primary teal" id="nextRec">Next recommended scenario</button><button class="secondary" id="toDash">Back to dashboard</button>`}</div>
    </div>`;
  }

  function bindResult(s, st, ip) {
    const cal = $("#calNext");
    cal && (cal.onclick = () => {
      if (ip.calib.idx < C.calibration.length - 1) { ip.calib.idx += 1; ip.scenarioId = C.calibration[ip.calib.idx].id; ip.st = {}; }
      else { E.applyCalibration(S.data, ip.calib.results); ip.calib.finished = true; }
      save(); render(); window.scrollTo(0, 0);
    });
    const nx = $("#nextItem");
    nx && (nx.onclick = () => {
      if (ip.drill.idx < ip.drill.items.length - 1) { ip.drill.idx += 1; ip.scenarioId = ip.drill.items[ip.drill.idx].id; ip.st = {}; }
      else {
        ip.drill.finished = true; S.data.xp += 30; S.data.drillsCompleted += 1; S.data.lastDrillDay = ST.today();
        const ev = []; E.checkGlobalBadges(S.data, ev); ip.drill.events = ev;
      }
      save(); render(); window.scrollTo(0, 0);
    });
    const nr = $("#nextRec"); nr && (nr.onclick = () => startSingle(E.recommend(S.data).scenario.id));
    const td = $("#toDash"); td && (td.onclick = () => { S.data.inProgress = null; save(); go("home"); });
  }

  function drillSummary(ip) {
    const r = ip.drill.results, avg = r.length ? Math.round(r.reduce((a, x) => a + x.score, 0) / r.length) : 0;
    return { html: `<div class="player"><div class="panel">
      <div class="kicker">Daily Drill complete</div><h2>${avg >= 70 ? "Excellent session." : avg >= 45 ? "Good work. The weak spots are getting stronger." : "A tough set, and exactly the right kind of practice."}</h2>
      <div class="result-top mt">${ring(avg)}<div><span class="tag t3">+${r.reduce((a, x) => a + x.xp, 0) + 30} XP including the 30 XP drill bonus</span><p class="small muted">Drills completed: ${S.data.drillsCompleted} · Streak: ${S.data.streak.count} day(s)</p></div></div>
      <table class="mt"><tbody>${r.map(x => { const s = C.byId[x.id]; return `<tr><td>${esc(s.title)}<div class="small muted">${esc(C.track(s.track).short)}</div></td><td>${tierTag(s.tier)}</td><td><b>${x.score}</b></td></tr>`; }).join("")}</tbody></table>
      ${(ip.drill.events || []).map(e => `<div class="event badge">${esc(e.text)}</div>`).join("")}
      <div class="row mt"><button class="primary" id="dDone">Back to dashboard</button></div>
    </div></div>`, bind() { $("#dDone").onclick = () => { S.data.inProgress = null; save(); go("home"); }; } };
  }

  function calibrationSummary() {
    const d = S.data;
    return { html: `<div class="player"><div class="panel">
      <div class="kicker">Calibration complete · +40 XP</div><h2>Your starting profile</h2>
      <p class="muted">Each track starts at the tier your judgement suggests. From here the Arena adapts with every answer: harder when you're strong, a step back with targeted review when something isn't landing.</p>
      <div class="grid g2 mt"><div>${radar(d.mastery, 300)}</div><div><table><tbody>${C.tracks.map(t => `<tr><td>${t.icon} ${esc(t.short)}</td><td>${tierTag(d.tracks[t.id].currentTier)}</td></tr>`).join("")}</tbody></table></div></div>
      <div class="row mt"><button class="primary teal" id="calDone">Go to my dashboard</button></div>
    </div></div>`, bind() { $("#calDone").onclick = () => { S.data.inProgress = null; save(); go("home"); }; } };
  }

  /* ======================= BOOT ======================= */
  function boot() {
    if (!ST.available()) { $("#app").innerHTML = `<div class="center-wrap panel"><h2>Storage unavailable</h2><p>This browser is blocking local storage, so progress can't be saved. Disable private mode or allow site data for local files, then reload.</p></div>`; return; }
    $$("#nav button").forEach(b => b.onclick = () => go(b.dataset.view));
    // Activity keeps the session alive; check for idle lock every minute
    let lastTouch = 0;
    ["click", "keydown"].forEach(ev => document.addEventListener(ev, () => { if (S.data && Date.now() - lastTouch > 30000) { lastTouch = Date.now(); ST.touchSession(); } }, true));
    setInterval(() => { if (S.meta && S.meta.pinHash && S.view !== "lock" && ST.sessionState() === "locked") { save(); S.view = "lock"; render(); } }, 60000);
    window.addEventListener("beforeunload", () => { if (S.data) ST.saveData(S.data); });

    const state = ST.sessionState(), sess = ST.getSession();
    if (state === "active") { const meta = ST.getProfileMeta(sess.profileId); S.meta = meta; S.data = ST.loadData(meta.id); ST.touchSession(); go(S.data.calibrated ? "home" : "calibrate"); if (S.data.calibrated && resumable(S.data)) toast("Welcome back. Your in-progress scenario is ready to resume."); }
    else if (state === "locked") { S.meta = ST.getProfileMeta(sess.profileId); S.data = ST.loadData(S.meta.id); go("lock"); }
    else go("profiles");
  }
  boot();
})(window.Arena);
