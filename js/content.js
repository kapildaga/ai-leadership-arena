/* AI Leadership Arena — content bank.
 * 8 competency tracks × 4 difficulty tiers.
 *  Tier 1 Foundation  : mcq       – pick the strongest response
 *  Tier 2 Applied     : bestworst – pick the best AND the worst action
 *  Tier 3 Complex     : branch    – 3 decision points moving stakeholder meters
 *  Tier 4 Boardroom   : freetext  – written response + curveball follow-up
 * Option tuples: mcq [text, score 0-100, feedback]; bestworst [text, "best"|"worst"|"mid", feedback];
 * branch [text, quality 0-1, {trust,value,control,momentum}, consequence]. */
window.Arena = window.Arena || {};

(function (A) {
  const mcq = (id, title, situation, question, options, expr) => ({ id, tier: 1, type: "mcq", title, situation, question, expr,
    options: options.map(([text, score, feedback]) => ({ text, score, feedback })) });
  const bw = (id, title, situation, question, options, expr) => ({ id, tier: 2, type: "bestworst", title, situation, question, expr,
    options: options.map(([text, rank, feedback]) => ({ text, rank, feedback })) });
  const branch = (id, title, situation, cast, steps, debrief) => ({ id, tier: 3, type: "branch", title, situation, cast, debrief,
    steps: steps.map(s => ({ prompt: s.prompt, options: s.options.map(([text, quality, fx, consequence]) => ({ text, quality, fx, consequence })) })) });
  const free = (id, o) => Object.assign({ id, tier: 4, type: "freetext" }, o);

  const tracks = [
  /* ========================= 1. STRATEGY ========================= */
  { id: "strategy", name: "Strategic thinking & decision-making", short: "Strategy", icon: "◆",
    intro: "Move conversations from technology choices to the decisions, trade-offs and outcomes that matter.",
    expressions: [
      ["Let's start with the decision we want to improve, not the technology we want to deploy.", "Anchor the discussion in a business decision rather than a preferred tool.", "Before we shortlist GenAI platforms, let's start with the decision we want to improve in demand planning."],
      ["Let's make the uncertainty explicit before we make the commitment.", "Name assumptions and unknowns before locking in investment or delivery commitments.", "The early results are encouraging, but let's make the uncertainty explicit before we commit to a production rollout."],
      ["What evidence would change our mind?", "Invite objective challenge and clarify what would overturn the current view.", "We seem aligned on the architecture. What evidence would change our mind before we finalise it?"],
      ["Let's make the trade-offs visible.", "State what is gained, what is sacrificed and who is affected.", "Accelerating the agent roadmap may delay data modernisation. Let's make the trade-offs visible before we reprioritise."],
      ["Let's align on the destination before we debate the route.", "Agree the outcome before arguing about implementation.", "The business wants faster decisions and engineering wants a shared platform. Let's align on the destination before we debate the route."]
    ],
    scenarios: [
      mcq("str-1a", "The platform-first sponsor", "The Chief Merchandising Officer of a 900-store retailer opens the meeting by asking which GenAI platform you'll standardise on. Nobody has yet agreed whether the goal is better assortment decisions, faster promotions or lower markdowns.", "What is your strongest opening?", [
        ["We should select the market-leading platform quickly so we don't fall behind.", 10, "Speed without a defined problem leads to technology-led solutioning and shelfware."],
        ["Let's start with the decision we want to improve, not the technology we want to deploy.", 100, "Redirects the room to business value without dismissing the sponsor's urgency."],
        ["Let's run a bake-off of three platforms over the next quarter.", 45, "Better than picking blindly, but a bake-off still has no success criteria without a defined decision to improve."],
        ["We can discuss the business problem after the pilot.", 0, "Reverses the logic: the pilot can't prove anything if the problem is undefined."]
      ], 0),
      mcq("str-1b", "Pilot euphoria", "A predictive-maintenance pilot on two production lines cut unplanned downtime by 30% over three weeks. The COO wants to commit to a 12-plant global rollout at next week's board meeting.", "Which response best protects both momentum and credibility?", [
        ["Great, let's announce it. The numbers speak for themselves.", 5, "Three weeks on two lines rarely represents other equipment types, older plants, sensor quality or seasonal load."],
        ["Let's make the uncertainty explicit before we make the commitment: here's what we know, and what a staged rollout would prove next.", 100, "Keeps the win visible while making the open questions explicit and turning them into a plan."],
        ["We need another six months of piloting before saying anything to the board.", 25, "Over-corrects. It kills momentum, and the COO will route around you."],
        ["Let the board decide; it's their call.", 15, "Abdicates your advisory role exactly when your judgement matters most."]
      ], 1),
      bw("str-2a", "Three asks, capacity for one", "At a consumer-goods company, the executive committee wants three AI initiatives launched this quarter: demand forecasting for supply chain, GenAI marketing content, and an HR employee-service copilot. Your specialist team can deliver one at enterprise quality. Each sponsor says theirs is the most urgent.", "Choose the BEST and the WORST move.", [
        ["Run all three at reduced scope so every sponsor gets something.", "mid", "It keeps the peace, but it spreads thin expertise across three mediocre outcomes. That's a hidden trade-off, not a decision."],
        ["Propose explicit decision criteria (value, feasibility, risk, strategic fit) and score the three with the sponsors in one session.", "best", "It turns a political contest into a transparent decision and makes the trade-offs visible."],
        ["Back the initiative whose sponsor is most senior.", "worst", "Teaches the organisation that seniority, not value, sets AI priorities, and erodes your credibility."],
        ["Tell the committee you'll start once you have three more data scientists.", "mid", "Capacity matters, but making headcount a precondition sidesteps the prioritisation decision they need from you."]
      ], 3),
      bw("str-2b", "The architecture stand-off", "At a telecom operator, customer-experience leaders want a quick, embedded GenAI agent-assist tool in the contact centre within 8 weeks. Enterprise architecture insists everything go through a shared platform that will be ready in 6 months.", "Choose the BEST and the WORST move.", [
        ["Escalate to the CEO and ask them to choose.", "worst", "Escalating before framing the trade-off gives away your role and makes one side lose publicly."],
        ["Let's align on the destination before we debate the route: agree the 12-month target state, then design a bridge solution that will migrate onto it.", "best", "Separates the shared goal from the sequencing argument and gives both sides a legitimate path."],
        ["Let the business build its own solution; architecture can catch up later.", "mid", "Fast, but it creates integration and control debt that someone will pay for in year two."],
        ["Pause the business request until the platform is ready.", "mid", "Protects architecture but ignores real business urgency and pushes the business towards shadow AI."]
      ], 4),
      branch("str-3", "The GenAI mandate", "At the town hall, the CEO announced 'GenAI in every function by year-end'. You have 9 months, a team of 25 and no defined use cases. Functions are already calling vendors directly.",
        ["CEO: wants visible momentum", "COO: worried about operational risk", "CIO: worried about vendor sprawl"], [
        { prompt: "Monday morning. Your first move?", options: [
          ["Meet the CEO to translate the mandate into 3–4 measurable business outcomes and decision criteria.", 1, { trust: 10, value: 15, control: 5, momentum: 5 }, "The CEO appreciates the framing and agrees to 'measurable impact in 3 functions + safe enablement for all'."],
          ["Launch an open call for ideas across all functions.", 0.5, { trust: 5, value: -5, control: -5, momentum: 15 }, "You receive 140 ideas in a week. Energy is high, but you have no way to choose between them."],
          ["Issue a freeze on vendor contracts until a strategy exists.", 0.3, { trust: -10, value: 0, control: 15, momentum: -15 }, "The CIO is relieved, but functions see you as a blocker and the CEO hears complaints."]
        ]},
        { prompt: "Functions are pushing their favourite ideas. The COO asks how you'll avoid 'a hundred risky experiments'. You say:", options: [
          ["Every use case will be scored on value, feasibility and risk. Low-risk productivity tools get a fast lane, and customer-facing decisions go through a full review.", 1, { trust: 10, value: 10, control: 15, momentum: 5 }, "The COO becomes an ally. A tiered approach lets you say yes quickly without being reckless."],
          ["We'll trust each function to manage its own risk.", 0.2, { trust: 0, value: 0, control: -20, momentum: 10 }, "The COO escalates to the CEO. Two functions deploy customer-facing chatbots without review."],
          ["Nothing goes live without my team's sign-off.", 0.4, { trust: -5, value: 0, control: 15, momentum: -15 }, "Safe, but you become the bottleneck and queue times grow to 10 weeks."]
        ]},
        { prompt: "Month 4. One flagship use case is behind; a quick-win productivity tool is ahead. Your board update leads with:", options: [
          ["The outcome scorecard: what's delivered, what's slipping and why, the trade-off you recommend, and what evidence will trigger scaling.", 1, { trust: 15, value: 10, control: 10, momentum: 5 }, "The board trusts a leader who shows the slip alongside the plan. Funding for phase 2 is approved."],
          ["The quick-win metrics only; the flagship delay can wait for next quarter.", 0.2, { trust: -20, value: 0, control: 0, momentum: 5 }, "A board member asks directly about the flagship. Your credibility takes a hit you'll spend months repairing."],
          ["A request to reset the year-end target.", 0.5, { trust: -5, value: 0, control: 5, momentum: -10 }, "Honest, but without a recommendation it reads as retreat rather than leadership."]
        ]}
      ], "Strong strategic leaders translate a slogan into measurable outcomes, put risk into tiers rather than treating it as one thing, and report slips with a recommendation."),
      free("str-4", { title: "The competing priorities", situation: "The executive committee wants three AI initiatives launched this quarter, but your specialist teams can realistically deliver only one at enterprise quality. Each business sponsor claims theirs is the most urgent.",
        mission: "Deliver a short recommendation that clarifies the decision criteria, makes the trade-offs visible and brings the group towards a decision.",
        criteria: "Strategic focus, acknowledged uncertainty, and no personal preferences driving the discussion.",
        hint: "Open with the business outcome you're optimising for, then the criteria, the trade-off and the evidence that would change the call.",
        keywords: ["criteria", "priorit", "sequence", "quarter", "one initiative", "value", "feasib"],
        modelAnswer: "Our objective this quarter is one AI capability that measurably moves a business KPI, not three that don't. I recommend we score the three initiatives on value at stake, data readiness and delivery risk, and fund the top one at full strength. The trade-off is real: two sponsors wait about 90 days, so we'll start data readiness work for them now so they launch faster next quarter. Let's make the uncertainty explicit: if the leading case can't show a baseline within four weeks, we switch. Can we agree the criteria today and decide by Friday?",
        curveball: { who: "Sponsor (Chief Marketing Officer)", text: "My GenAI content engine has the CEO's personal attention. If you deprioritise it, you're making a political mistake. Why should I accept this?",
          modelAnswer: "I understand the CEO's interest, and that's exactly why I don't want to deliver it at half strength. If the criteria show your case wins, it goes first. If not, I'll brief the CEO with you, so the decision is shared and data readiness for your case starts now, not next quarter." } })
    ]},

  /* ========================= 2. VALUE ========================= */
  { id: "value", name: "Business value & investment discipline", short: "Value & investment", icon: "▲",
    intro: "Connect AI investment to realised outcomes. Separate promising activity from measurable value.",
    expressions: [
      ["The value case needs an owner, not just a number.", "A projected benefit needs a business owner accountable for realising it.", "The automation case estimates ₹15 crore in savings. The value case needs an owner, not just a number."],
      ["Let's distinguish between value creation and value capture.", "A solution can create potential value; the organisation must still convert it into results.", "The churn model finds at-risk customers, but let's distinguish value creation from value capture by tracking revenue actually retained."],
      ["We should let the evidence determine the pace of investment.", "Increase investment as results, reliability and adoption become clearer.", "The pilot is promising; we should let the evidence determine the pace of investment."],
      ["The cost of delay deserves a place in the business case.", "Count the value lost by waiting, not just the cost of moving.", "We have deferred the inventory-optimisation initiative twice. The cost of delay deserves a place in the business case."],
      ["Capacity is a strategic choice, not merely a resource constraint.", "How people and money are allocated reveals real priorities.", "We cannot pursue every opportunity. Capacity is a strategic choice, not merely a resource constraint."]
    ],
    scenarios: [
      mcq("val-1a", "The ownerless savings", "A warehouse-automation business case at a logistics company projects $4M in annual savings from AI-driven picking and slotting. When you ask who will deliver the savings, the room goes quiet; the warehouse operations director says they 'support' it.", "What do you say?", [
        ["The value case needs an owner, not just a number.", 100, "Without an accountable owner, the savings are a forecast nobody is obliged to realise."],
        ["Let's approve it and assign ownership in the next phase.", 10, "Ownership deferred is usually ownership avoided. Benefits quietly evaporate."],
        ["Let's re-check the model's accuracy to firm up the number.", 30, "Accuracy matters, but a precise number with no owner is still an unowned number."],
        ["My team will own the savings.", 20, "Well-intentioned, but the AI team rarely controls the headcount, process or budget that turns automation into savings."]
      ], 0),
      mcq("val-1b", "Deferred twice", "An AI markdown-optimisation initiative at a fashion retailer has been deferred for two budget cycles because 'other priorities were more urgent'. Excess markdowns and end-of-season write-offs are estimated at $600K a month.", "Which framing best reopens the decision?", [
        ["We should push harder; it's a good idea.", 10, "Enthusiasm isn't an argument a CFO can act on."],
        ["The cost of delay deserves a place in the business case: two deferrals have already cost us roughly $14M.", 100, "Converts inaction into a visible cost and changes the comparison from 'spend vs. no spend'."],
        ["Let's wait for next year's planning cycle.", 0, "Accepts the default that delay is free."],
        ["We could do a cheaper, smaller version.", 45, "Might help later, but it doesn't address why the decision keeps slipping."]
      ], 3),
      bw("val-2a", "Three pilots, one with proof", "At an e-commerce business, three AI pilots show strong technical results: dynamic pricing, a customer-churn model and a product-description generator. Only one (dynamic pricing) has demonstrated measurable margin improvement. The CFO wants ROI proof. All three sponsors want scale-up funding.", "Choose the BEST and the WORST move.", [
        ["Fund all three at scale; technical success suggests business value will follow.", "worst", "It conflates technical feasibility with value capture, which is exactly what CFOs distrust."],
        ["Scale pricing now; give the other two a 60-day gate with a named owner, a baseline and a value metric before further funding.", "best", "Lets the evidence set the pace of investment and makes ownership explicit."],
        ["Stop the two unproven pilots to show discipline.", "mid", "Disciplined, but it may kill options that only lack measurement, not value."],
        ["Ask the CFO to define the ROI metrics for each pilot.", "mid", "Collaborative, but ownership of the value case belongs with the business sponsors, not finance."]
      ], 2),
      bw("val-2b", "The vendor's productivity claim", "A vendor deck claims its HR and finance shared-services copilot delivers '40% productivity uplift'. The CFO asks for your view before signing a 3-year, $2.5M contract.", "Choose the BEST and the WORST move.", [
        ["Endorse the claim; the vendor has strong references.", "worst", "You inherit accountability for a number you haven't tested in your context."],
        ["Recommend a 90-day paid pilot with our own baseline, defining how saved time will be captured (capacity redeployed, backlog cleared or hiring avoided).", "best", "Separates value creation (time saved) from value capture (financial result) and sets an evidence gate."],
        ["Reject it; vendor claims are always inflated.", "mid", "Healthy scepticism, but a blanket rejection may forgo real value and makes you look reflexively negative."],
        ["Negotiate a 30% discount and then sign.", "mid", "Lowers the cost but doesn't validate the value."]
      ], 1),
      branch("val-3", "The mid-year budget cut", "In July, the CFO announces a 30% cut to the AI budget for the rest of the year. You run 7 initiatives at different maturity levels. The CEO still expects 'AI progress' at the year-end investor day.",
        ["CFO: needs savings without surprises", "CEO: needs an investor story", "Sponsors: each defending their project"], [
        { prompt: "Your first response to the CFO:", options: [
          ["Understood. Within 10 days I'll bring a reprioritised portfolio showing value at stake, what we stop and the cost of each delay.", 1, { trust: 15, value: 10, control: 10, momentum: 0 }, "The CFO appreciates a partner rather than a protester and gives you room to propose."],
          ["A cut of this size will severely damage our AI capability; I'd ask you to reconsider.", 0.3, { trust: -10, value: 0, control: 0, momentum: -5 }, "The CFO hears resistance without an alternative and starts making the cuts for you."],
          ["Apply a 30% cut to every initiative equally.", 0.4, { trust: 5, value: -15, control: 0, momentum: -10 }, "Looks fair, but every initiative is now underpowered."]
        ]},
        { prompt: "Your portfolio analysis shows 2 initiatives drive 70% of the value. Sponsors of the other 5 are lobbying. You:", options: [
          ["Concentrate on the top 2, pause 3 with documented restart criteria, and merge 2 into one shared capability.", 1, { trust: 5, value: 20, control: 10, momentum: 5 }, "Hard conversations follow, but the restart criteria give paused sponsors a dignified path back."],
          ["Keep all 7 alive on minimal funding to preserve relationships.", 0.2, { trust: 5, value: -15, control: -5, momentum: -10 }, "Seven initiatives on life support; none will show results by investor day."],
          ["Let the sponsors negotiate among themselves.", 0.3, { trust: -5, value: -5, control: -10, momentum: 0 }, "The loudest sponsor wins, not the highest value."]
        ]},
        { prompt: "The CEO asks what to tell investors. You recommend:", options: [
          ["Two concrete value stories with measured results, plus a disciplined portfolio narrative: 'we invest where evidence is strongest'.", 1, { trust: 15, value: 10, control: 5, momentum: 10 }, "Investors respond well to discipline plus proof. The CFO quietly restores 10% for Q4."],
          ["A broad vision of AI transforming every function.", 0.3, { trust: -5, value: -5, control: 0, momentum: 5 }, "Analysts ask for numbers. The story sounds like everyone else's."],
          ["Avoid AI on investor day until results are stronger.", 0.4, { trust: 0, value: 0, control: 5, momentum: -15 }, "Safe, but the CEO feels you've left them without a story."]
        ]}
      ], "Cuts are an opportunity to show investment discipline: concentrate on proven value, pause with criteria rather than kill, and give leaders an evidence-based story."),
      free("val-4", { title: "The ROI conversation", situation: "At a consumer-goods company, three AI pilots show strong technical results: trade-promotion pricing, a supplier-risk early-warning model and an HR talent-matching tool. Only the pricing pilot has demonstrated measurable business benefit. The CFO wants proof of ROI, while business sponsors are asking for funding for all three.",
        mission: "Recommend how to sequence the investments, clarify accountability for benefits and explain what evidence is needed before scaling.",
        criteria: "Commercial judgement, investment discipline and ownership of value realisation.",
        hint: "Separate technical feasibility, value created and value captured. Name who owns each benefit and the gate for further funding.",
        keywords: ["owner", "baseline", "roi", "gate", "evidence", "scale", "capture", "fund"],
        modelAnswer: "Technical success isn't the same as business value, so I recommend we fund in sequence. We scale the pricing pilot now; it has a measured margin gain and the revenue-management director owns the benefit. The other two get a 60-day gate: a named business owner, a baseline and one value metric, and further funding is released only if they hit it. The trade-off is slower momentum for two sponsors, but we protect credibility with the board. We should let the evidence determine the pace of investment.",
        curveball: { who: "CFO", text: "If you can't give me a single ROI number with a confidence range, I'm cutting the two unproven pilots now.",
          modelAnswer: "That's fair. For pricing I can give you 2.1–2.8 margin points at 80% confidence. For the other two I'd rather not invent a number; I'm asking for 60 days and less than 10% of the budget to get one. If they miss the gate, I'll recommend stopping them myself." } })
    ]},

  /* ========================= 3. RIGOR ========================= */
  { id: "rigor", name: "Scientific rigour & responsible AI", short: "Rigour & responsible AI", icon: "●",
    intro: "Question evidence, test beyond ideal conditions and define the boundaries of safe deployment.",
    expressions: [
      ["A result is only as credible as the comparison behind it.", "Performance claims need a fair baseline and comparable populations.", "The new forecast model improves accuracy by 8%. A result is only as credible as the comparison behind it."],
      ["Let's test the boundary conditions, not just the happy path.", "Evaluate edge cases and operational constraints, not just ideal scenarios.", "The service bot handles routine queries well. Let's test the boundary conditions, not just the happy path."],
      ["Let's define the conditions under which we would not deploy this solution.", "Agree failure criteria and risk thresholds before launch.", "Before approving the agent, let's define the conditions under which we would not deploy it."],
      ["Let's separate what we know, what we believe, and what we need to validate.", "Distinguish verified facts from assumptions and open questions.", "Early feedback is promising, but let's separate what we know, believe and need to validate."],
      ["We need a decision threshold, not just a better prediction.", "Connect model outputs to an explicit action rule and consequence.", "The fraud model ranks transactions well; we now need a threshold that tells analysts when to block a payment."]
    ],
    scenarios: [
      mcq("rig-1a", "Standard cases only", "A demand-forecasting model for a grocery chain performs well on regular, steady-selling products. It hasn't been tested on promotions, new launches or weather-sensitive lines, which are 8% of products but 35% of revenue.", "Best next step?", [
        ["Deploy now and monitor average forecast accuracy.", 5, "Average accuracy will hide failures concentrated in the highest-revenue products, where stock-outs hurt most."],
        ["Let's test the boundary conditions, not just the happy path, starting with the 8% of products that carry 35% of revenue.", 100, "Targets evaluation where the business consequence is concentrated."],
        ["Assume the pilot results will generalise.", 0, "Hope is not a validation strategy."],
        ["Exclude promotional and new products from the model permanently.", 45, "A reasonable interim guardrail, but 'permanently' gives up value without testing."]
      ], 1),
      mcq("rig-1b", "The 8% uplift", "At a telecom operator, your team reports that the new subscriber-churn model is '8% more accurate' than the old one. You learn it was tested on the last 3 months; the old model's figure comes from a 2-year-old report.", "What do you say?", [
        ["Excellent, let's present it to the board.", 0, "You'd be presenting an apples-to-oranges comparison as a result."],
        ["A result is only as credible as the comparison behind it. Let's re-score both models on the same recent holdout.", 100, "A fair baseline is what turns a claim into evidence."],
        ["Accuracy is the wrong metric anyway.", 40, "Possibly true, but it dodges the immediate flaw: the comparison itself."],
        ["Let's ask the vendor to validate.", 20, "Outsources a basic scientific check you should own."]
      ], 0),
      bw("rig-2a", "The explainability revolt", "Hiring managers refuse to use an AI candidate-matching model, saying 'we can't defend a ranking we don't understand' to candidates and HR business partners. Usage is at 12% after 2 months.", "Choose the BEST and the WORST move.", [
        ["Mandate usage through recruiting KPIs.", "worst", "Forced adoption of a tool people don't trust leads to gaming and quiet workarounds, and the fairness risk stays unmanaged."],
        ["Co-design match explanations with senior recruiters, show the top 3 skills driving each match, and define when hiring managers should override, with overrides fed back into model evaluation.", "best", "Treats explainability as a product requirement and turns sceptics into co-owners."],
        ["Replace the model with a simpler, fully transparent scorecard.", "mid", "May be right in some contexts, but it trades away accuracy before testing whether better explanation is enough."],
        ["Run a training programme on how ML models work.", "mid", "Helpful, but hiring managers need defensible reasons for candidates, not a lecture on embeddings."]
      ], 3),
      bw("rig-2b", "Drift before the release", "Two weeks before an expanded release, monitoring shows a payments company's card-fraud model precision dropped from 0.82 to 0.68 over 6 weeks. The sponsor wants to proceed on schedule.", "Choose the BEST and the WORST move.", [
        ["Proceed; 0.68 is still better than the manual process.", "mid", "Possibly true, but releasing without understanding the cause risks compounding the problem at larger scale."],
        ["Diagnose the drift root cause this week against pre-agreed no-go conditions; release on schedule only if precision recovers above the threshold, otherwise run a staged release.", "best", "Uses the agreed deployment conditions to make a principled, time-boxed decision."],
        ["Quietly retrain on recent data and release without telling the sponsor.", "worst", "Fixing it silently hides risk from the accountable owner and destroys trust once discovered."],
        ["Cancel the release indefinitely.", "mid", "Over-correction without diagnosis."]
      ], 2),
      branch("rig-3", "The bias flag", "Five days before launch of an AI candidate-screening model for 4,000 annual engineering hires, the people-analytics team flags that women pass the screen at a rate 14 points lower than men with similar qualifications. The Head of Talent Acquisition says the model 'just reflects who succeeded here'.",
        ["Head of Talent: wants launch on time", "Chief People Officer & Legal: want assurance", "Regulators: AI hiring is classed as high-risk"], [
        { prompt: "First move:", options: [
          ["Convene talent acquisition, legal and people analytics today. Let's separate what we know, what we believe and what we need to validate, and agree a 72-hour analysis plan.", 1, { trust: 15, value: 5, control: 15, momentum: 5 }, "Everyone gets a voice and a timeline. The sponsor accepts the plan, though grudgingly."],
          ["Side with the sponsor: the model is statistically sound.", 0.1, { trust: -10, value: 5, control: -25, momentum: 10 }, "The Chief People Officer escalates to the CEO. You're now seen as part of the problem."],
          ["Cancel the launch immediately.", 0.4, { trust: -10, value: -10, control: 15, momentum: -20 }, "Prudent, but unilateral. The sponsor feels ambushed and you have no diagnosis yet."]
        ]},
        { prompt: "The analysis finds a feature (career gaps) acting partly as a gender proxy. Removing it costs 1.5 points of predictive lift. You recommend:", options: [
          ["Remove or constrain the proxy, accept the lift trade-off, and document the fairness test and rationale for audit.", 1, { trust: 15, value: -5, control: 20, momentum: 5 }, "The model is slightly less predictive, but defensible. Legal and the CPO sign off."],
          ["Keep the feature but manually adjust pass rates for affected groups.", 0.5, { trust: 5, value: 0, control: 5, momentum: 5 }, "A patch, not a fix. It works short term but is hard to defend if challenged."],
          ["Keep the feature; the lift matters more.", 0.1, { trust: -15, value: 10, control: -20, momentum: 5 }, "You've chosen accuracy over fairness in a decision about people's livelihoods."]
        ]},
        { prompt: "Launch is now 2 weeks late. To prevent a repeat, you propose:", options: [
          ["Fairness testing as a standard gate early in model development, with clear thresholds and named owners.", 1, { trust: 10, value: 10, control: 15, momentum: 10 }, "The next model passes the fairness gate in week 3 instead of the final week. The process becomes a speed advantage."],
          ["A rule that legal reviews every model before launch.", 0.5, { trust: 0, value: 0, control: 10, momentum: -10 }, "Still too late in the process; legal becomes a bottleneck."],
          ["Nothing formal; this was a one-off.", 0.1, { trust: -10, value: 0, control: -15, momentum: 0 }, "It wasn't a one-off; it was a missing control."]
        ]}
      ], "Responsible AI under pressure means slowing down fast: a time-boxed diagnosis, explicit trade-offs, documented rationale, and moving controls earlier so they speed up future work."),
      free("rig-4", { title: "The impressive pilot", situation: "A GenAI customer-service agent for a bank's retail customers reduced average handling time by 25% in a pilot. Testing focused on routine queries (balances, card replacements), and frontline staff are concerned about wrong answers on complaints and vulnerable customers. The Chief Customer Officer wants a broad rollout next month.",
        mission: "Respond with a recommendation that preserves momentum while setting out the evidence, safeguards and deployment conditions still required.",
        criteria: "Balance scientific discipline with commercial pragmatism. Avoid both uncritical approval and unnecessary delay.",
        hint: "Acknowledge what the pilot proved, name the untested conditions, and propose criteria for a controlled rollout.",
        keywords: ["edge", "boundary", "explain", "controlled", "staged", "condition", "threshold", "monitor"],
        modelAnswer: "The pilot has proved real value on routine queries: 25% faster handling is worth scaling. What it hasn't proved is performance on complaints and vulnerable customers, or whether frontline staff trust the output. I recommend a staged rollout next month for routine queries in two regions, with complaints and vulnerability cues routed to humans while we test those boundary conditions. Let's define now the conditions under which we would pause: wrong-answer rate above 3% or escalation rate above 40%. That keeps momentum without putting customer trust at risk.",
        curveball: { who: "Sponsor (Chief Customer Officer)", text: "Every week of delay costs us about $400K in contact-centre cost. Give me a date for full rollout, not more conditions.",
          modelAnswer: "Fair challenge. Routine queries go live in 4 weeks, which captures about 70% of the saving. Complex cases follow 8 weeks later if boundary testing passes. That's the date. The conditions exist so we never have to roll back, which would cost far more than $400K a week." } })
    ]},

  /* ========================= 4. ENTERPRISE ========================= */
  { id: "enterprise", name: "Enterprise AI & architecture thinking", short: "Enterprise AI", icon: "■",
    intro: "Move beyond isolated pilots. Speak about context, architecture, adoption and scale.",
    expressions: [
      ["The differentiator is not access to models, but the ability to operationalise intelligence at scale.", "Models are accessible; durable advantage comes from enterprise integration.", "Many firms access the same LLMs. The differentiator is operationalising intelligence at scale."],
      ["Context is the bridge between data and understanding.", "Business context turns raw information and model capability into useful interpretation.", "Our retrieval returns documents, but context is the bridge between data and understanding."],
      ["Adoption is not an afterthought; it is part of the solution architecture.", "Design for user behaviour, trust and workflow integration from the beginning.", "Let's involve store managers in design. Adoption is part of the solution architecture."],
      ["Consistency in principles matters more than uniformity in implementation.", "Shared standards and governance, with room for solutions to fit different needs.", "Supply chain and marketing need different architectures. Consistency in principles matters more than uniformity."],
      ["A portfolio of successful pilots is not the same as enterprise transformation.", "Experiments don't automatically change operating models.", "We have six promising pilots, but pilots are not transformation; we need integration and adoption."]
    ],
    scenarios: [
      mcq("ent-1a", "One standard to rule them all?", "Business units have different AI workflows (supply-chain planning agents, marketing content generation, HR employee self-service) but the CTO wants one mandated implementation for all.", "Most useful principle to propose?", [
        ["Every unit must use exactly the same implementation.", 15, "Uniformity simplifies support but forces poor fits and drives teams to shadow AI."],
        ["Consistency in principles matters more than uniformity in implementation.", 100, "Common guardrails (security, evaluation, observability) with fit-for-purpose solutions."],
        ["Let each unit define its own standards.", 10, "Fragmentation: duplicated cost and uneven risk control."],
        ["Pick the best unit's approach and copy it everywhere.", 35, "Better than nothing, but still uniformity by another name."]
      ], 3),
      mcq("ent-1b", "Six pilots, no change", "At an industrial manufacturer, you have six successful AI pilots (quality inspection, procurement, field service and more), all celebrated in internal newsletters. Two years in, operating margin and order-to-delivery times haven't changed.", "What message do you bring to the executive team?", [
        ["Let's run six more pilots to find bigger wins.", 5, "More pilots compound the problem: activity without integration."],
        ["A portfolio of successful pilots is not the same as enterprise transformation. We need to industrialise two of them into core workflows.", 100, "Names the gap honestly and points to the integration work that creates value."],
        ["The pilots were successful; the KPIs will move eventually.", 10, "Wishful thinking. Pilots rarely scale themselves."],
        ["We need a bigger AI team.", 30, "Capacity may be part of it, but the gap is integration and adoption, not headcount."]
      ], 4),
      bw("ent-2a", "Agent sprawl", "An audit finds 40+ AI agents built by sales, marketing and operations teams over 9 months, with no central inventory, inconsistent logging and three that can update customer records in the CRM.", "Choose the BEST and the WORST move.", [
        ["Shut down all business-built agents until IT rebuilds them.", "worst", "It destroys trust and value, and teams will rebuild in the shadows."],
        ["Create a registry within 30 days, put agents into risk tiers, apply mandatory controls to the ones with write access first, and offer a paved-road platform for new builds.", "best", "Proportionate governance with an easier path to compliance."],
        ["Send a policy memo requiring compliance by year-end.", "mid", "Leaves the riskiest agents unmanaged for months."],
        ["Accept it as the cost of innovation.", "mid", "Ignores real operational and regulatory risk from agents that change customer data."]
      ], 3),
      bw("ent-2b", "Right documents, wrong answers", "A global company's HR assistant retrieves the correct HR policy documents but gives employees wrong answers about their own leave, benefits and relocation entitlements about 20% of the time.", "Choose the BEST and the WORST move.", [
        ["Switch to a larger, more expensive LLM.", "mid", "Might help marginally, but the failure is missing context, not missing intelligence."],
        ["Enrich the context: add the employee's country, grade, contract type and local policy variants to retrieval, and build an evaluation set of real employee questions.", "best", "Context is the bridge between data and understanding, and evaluation makes progress measurable."],
        ["Add a disclaimer and launch.", "worst", "A disclaimer doesn't reduce harm from wrong answers about people's pay and benefits."],
        ["Fine-tune the model on all HR policy documents.", "mid", "Costly and slow, and it still lacks the employee-specific context at query time."]
      ], 1),
      branch("ent-3", "From pilots to platform", "At a pharmaceutical company, four functions (R&D, manufacturing, commercial and HR) run successful AI pilots on different tools. The CTO wants a single platform; BU heads fear losing speed and control. Your CEO asks you to 'sort it out' in 90 days.",
        ["CTO: wants standardisation", "BU heads: want autonomy and speed", "CISO: wants visibility"], [
        { prompt: "Your opening framing in the joint workshop:", options: [
          ["Let's agree what must be common (identity, security, observability, evaluation) and what can vary by workflow.", 1, { trust: 15, value: 5, control: 15, momentum: 5 }, "Both sides relax: the CTO gets non-negotiables, and the BUs keep fit-for-purpose choices."],
          ["The CTO's platform is the strategic direction; BUs will migrate.", 0.3, { trust: -15, value: 0, control: 10, momentum: -5 }, "BU heads disengage, and one starts quietly renewing their vendor."],
          ["Each BU keeps its tools; we'll integrate later.", 0.3, { trust: 5, value: -5, control: -15, momentum: 5 }, "Popular, but the CISO escalates, and 'later' never arrives."]
        ]},
        { prompt: "The workshop agrees principles. Now a BU wants an exception for a vendor that lacks logging. You:", options: [
          ["Grant a time-boxed exception with compensating controls and a migration date.", 1, { trust: 10, value: 5, control: 10, momentum: 10 }, "The principles hold, but pragmatically. The BU feels heard."],
          ["Refuse; no exceptions.", 0.4, { trust: -10, value: 0, control: 10, momentum: -10 }, "Principled, but rigid. The BU head escalates to the CEO."],
          ["Approve without conditions to keep goodwill.", 0.2, { trust: 10, value: 0, control: -15, momentum: 5 }, "Every other BU now expects the same."]
        ]},
        { prompt: "Day 90 readout to the CEO:", options: [
          ["Principles adopted, paved-road platform live, 2 pilots migrated with adoption metrics, and an exception register with dates.", 1, { trust: 15, value: 10, control: 10, momentum: 10 }, "The CEO sees a transformation path, not a turf war."],
          ["A 40-page target architecture document.", 0.3, { trust: 0, value: -5, control: 5, momentum: -10 }, "Thorough, but no visible change."],
          ["A plan to hire a platform team next year.", 0.3, { trust: -5, value: -5, control: 0, momentum: -10 }, "The CEO wanted progress, not a hiring plan."]
        ]}
      ], "Enterprise architecture leadership separates non-negotiables from choice, governs exceptions with dates, and reports adoption, not documents."),
      free("ent-4", { title: "From pilots to platform", situation: "At a global retailer, supply chain, marketing and customer service each have successful AI pilots, but each uses different tools, data patterns and controls. The CTO wants a single standard architecture; business leaders fear losing flexibility.",
        mission: "Propose an architectural direction that establishes enterprise guardrails while preserving fit-for-purpose implementation and business ownership.",
        criteria: "Systems thinking, the role of shared principles, and a credible path from pilot to scale.",
        hint: "Distinguish what must be common (security, observability, evaluation, identity) from what can vary by workflow.",
        keywords: ["principle", "guardrail", "common", "platform", "observab", "secur", "evaluat", "scale", "workflow"],
        modelAnswer: "Our goal is AI that scales safely across the business without slowing the units that create value. I recommend a paved-road platform with four non-negotiables (identity, security, observability and evaluation) while models, prompts and workflow design stay with each business unit. Consistency in principles matters more than uniformity in implementation. The trade-off is some short-term migration effort, so we'll move two pilots in 90 days and measure adoption and incidents before scaling. Exceptions will be time-boxed with compensating controls.",
        curveball: { who: "Chief Marketing Officer", text: "Your guardrails will slow us down by months. My pilot works today. Why should I migrate?",
          modelAnswer: "Your pilot working today is exactly why I want to protect it. Today, if it fails, nobody can see why. Migration takes about 3 weeks with our team doing the heavy lifting, and after that you get monitoring and security approvals for free on every future use case. If it takes longer than 3 weeks, I'll fund the gap." } })
    ]},

  /* ========================= 5. INFLUENCE ========================= */
  { id: "influence", name: "Executive influence & client advisory", short: "Executive influence", icon: "★",
    intro: "Influence senior stakeholders without becoming dogmatic. Challenge respectfully and guide the room.",
    expressions: [
      ["We should be opinionated about the outcome, but open-minded about the approach.", "Be clear on the result that matters, flexible on how to get there.", "Our goal is 20% faster turnaround. We should be opinionated about the outcome, open-minded about the approach."],
      ["Let's bring the discussion back to first principles.", "Return to the fundamental problem, economics and constraints.", "Before build vs buy, let's go back to first principles: which capabilities truly differentiate us?"],
      ["There is a difference between consensus and conviction.", "Agreement isn't enough; stakeholders must genuinely support the decision.", "We have agreement on the roadmap, but there's a difference between consensus and conviction."],
      ["Let's separate the urgency of the problem from the urgency of the proposed solution.", "A pressing problem doesn't make the first fix the right one.", "I understand the pressure to deploy GenAI quickly. Let's separate the urgency of the problem from the solution."],
      ["I would rather have an uncomfortable conversation now than an expensive surprise later.", "Raise risks early, while there is still time to act.", "The data readiness gap is significant. I'd rather have an uncomfortable conversation now."]
    ],
    scenarios: [
      mcq("inf-1a", "The insistent stakeholder", "The Head of Procurement insists on a specific agentic framework for supplier negotiations before anyone has agreed whether the goal is lower unit cost, faster cycle time or reduced supplier risk.", "Strongest response?", [
        ["We should be opinionated about the outcome, but open-minded about the approach.", 100, "Keeps conviction on what matters while keeping implementation evidence-led."],
        ["The CTO should decide; technology is their domain.", 10, "Abdicates and leaves the outcome undefined."],
        ["Let's select the framework and define value later.", 0, "Technology-first: value is an afterthought."],
        ["Frankly, that framework is a poor choice.", 25, "May be true, but you've made it personal and lost the room."]
      ], 0),
      mcq("inf-1b", "The panic request", "After a rival airline's press release about its 'AI travel concierge', your CEO asks for 'a customer-facing GenAI chatbot live in 6 weeks'.", "Best response?", [
        ["Yes, we'll make it happen.", 15, "Responsive, but you may ship something risky to customers to answer a press release."],
        ["Let's separate the urgency of the problem from the urgency of the proposed solution. What customer outcome are we responding to?", 100, "Respects the urgency while testing whether a chatbot is the right answer."],
        ["Six weeks is impossible.", 10, "A flat 'no' without an alternative undermines your influence."],
        ["Let's wait to see if the competitor's launch succeeds.", 30, "Measured, but sounds passive to an anxious CEO."]
      ], 3),
      bw("inf-2a", "The client CTO's favourite", "You're advising a hospital network. The client CTO is strongly advocating a specific LLM platform for clinical documentation and patient scheduling. Business leaders are unsure about ROI and complexity. The meeting is turning into a vendor debate.", "Choose the BEST and the WORST move.", [
        ["Agree with the CTO; they're the client's technology authority.", "worst", "Sycophancy. You lose your independence and the business leaders' trust."],
        ["Acknowledge the platform may well be viable, then reframe: agree the business outcomes and evaluation criteria first, and test the CTO's choice against them.", "best", "Respectful, independent and evidence-led. The CTO's option gets a fair test."],
        ["Present a comparison of five alternative platforms.", "mid", "Thorough, but it deepens the vendor debate instead of resolving it."],
        ["Take the CTO aside afterwards to express concerns.", "mid", "Private dialogue helps, but the room still has no shared frame."]
      ], 0),
      bw("inf-2b", "Bad news tomorrow", "You've discovered that poor product and customer master data will push the flagship marketing-personalisation go-live back by 3 months. The steering committee meets tomorrow and expects a 'green' update.", "Choose the BEST and the WORST move.", [
        ["Report amber and explain the details next month once you have a plan.", "mid", "Partially honest, but it delays the decision they could make now."],
        ["Brief the sponsor tonight, then present the gap tomorrow with options and a recommendation.", "best", "No surprises for the sponsor, an early warning for the committee, and a path forward."],
        ["Report green and try to recover the time quietly.", "worst", "When it comes out, your credibility will not recover."],
        ["Blame the data team in the update.", "mid", "Might be factually true, but it damages relationships and doesn't solve anything."]
      ], 4),
      branch("inf-3", "The steering committee ambush", "At a utilities company, in a steering committee with the CEO present, the Chief Operating Officer unexpectedly says: 'Frankly, the AI programme has delivered nothing my field operations teams can use.'",
        ["COO: frustrated, publicly critical", "CEO: watching how you respond", "Your team: watching how you respond"], [
        { prompt: "Your immediate response in the room:", options: [
          ["Thank you for saying it directly. I want to understand the gap: can you give one example where your teams expected value and didn't get it?", 1, { trust: 15, value: 5, control: 5, momentum: 5 }, "The temperature drops. The COO names one concrete pain: the AI work-scheduling tool doesn't fit how field technicians actually plan their day."],
          ["Defend the programme with delivery statistics.", 0.3, { trust: -15, value: 0, control: 0, momentum: -5 }, "You win the argument and lose the relationship. The CEO notes the defensiveness."],
          ["Say you'll discuss it offline.", 0.5, { trust: -5, value: 0, control: 5, momentum: -5 }, "Avoids escalation, but looks evasive in front of the CEO."]
        ]},
        { prompt: "After the meeting, you meet the COO one-to-one. You:", options: [
          ["Ask what success would look like for operations, and offer to embed one of your leads with a field crew for 2 weeks.", 1, { trust: 15, value: 10, control: 0, momentum: 10 }, "The COO is surprised and agrees. Your lead finds three workflow fixes."],
          ["Explain why the programme's priorities were set the way they were.", 0.3, { trust: -5, value: 0, control: 0, momentum: 0 }, "The COO hears justification, not partnership."],
          ["Raise your concern about being criticised publicly.", 0.4, { trust: -5, value: 0, control: 0, momentum: -5 }, "Fair in principle, but premature. You haven't earned that conversation yet."]
        ]},
        { prompt: "Next steering committee. You:", options: [
          ["Present jointly with the COO: what was wrong, what changed, and the first adoption metrics.", 1, { trust: 20, value: 10, control: 5, momentum: 10 }, "The critic is now a co-owner. The CEO sees mature leadership."],
          ["Present the fixes yourself and thank the COO for the feedback.", 0.6, { trust: 5, value: 10, control: 5, momentum: 5 }, "Good, but a missed opportunity for shared ownership."],
          ["Report the original delivery statistics again.", 0.1, { trust: -15, value: 0, control: 0, momentum: -10 }, "The room concludes you haven't listened."]
        ]}
      ], "Public criticism is an influence opportunity: get curious in the room, partner one-to-one, and turn the critic into a co-presenter."),
      free("inf-4", { title: "The technology advocate", situation: "You're advising a third-party logistics client. Their CTO is strongly advocating a specific LLM platform for shipment exception handling. Business leaders are unsure about ROI and operational complexity. The discussion is becoming a debate about vendors.",
        mission: "Reframe the conversation around business outcomes, acknowledge the CTO's perspective and establish a sensible way to evaluate options.",
        criteria: "Be respectful but independent. Show conviction about outcomes without becoming attached to one solution.",
        hint: "Acknowledge the platform may be viable, then return to the business decision, success measures and conditions for scale.",
        keywords: ["outcome", "criteria", "evaluat", "acknowledg", "viable", "test", "measure", "business"],
        modelAnswer: "The platform may well be the right choice, and the CTO knows this landscape better than anyone. Before we decide, let's agree what we're optimising for: on-time delivery and cost to resolve each shipment exception. I recommend we set three evaluation criteria (business impact, total cost to operate and integration risk) and run a 6-week proof of value on one workflow. We should be opinionated about the outcome, but open-minded about the approach. If the CTO's platform wins on those criteria, we'll have conviction, not just consensus.",
        curveball: { who: "Client CTO", text: "We've already signed a letter of intent with this vendor. Are you saying I made a mistake?",
          modelAnswer: "Not at all. An LOI tells me you saw something real, and I'd like to make it succeed. The proof of value gives you evidence to take to the board and leverage in the final contract. If it performs as you expect, you'll go into signing stronger." } })
    ]},

  /* ========================= 6. EXECUTION ========================= */
  { id: "execution", name: "Execution & operating discipline", short: "Execution", icon: "▶",
    intro: "Turn strategic intent into coordinated delivery. Expose dependencies and remove friction.",
    expressions: [
      ["We need to manage dependencies, not just milestones.", "Track the prerequisites and hand-offs that determine real progress.", "The build is on schedule but data access is unresolved. We need to manage dependencies, not just milestones."],
      ["Let's address the source of friction rather than add another layer of coordination.", "Fix the bottleneck instead of adding meetings.", "Reviews take three weeks because decision rights are unclear. Let's fix the source of friction."],
      ["Let's distinguish between a temporary workaround and a sustainable operating model.", "Use short-term fixes consciously so they don't become permanent by default.", "Manual validation bridges the gap for now, but let's not confuse it with an operating model."],
      ["Speed without direction only accelerates waste.", "Fast execution only helps when teams are aligned on the right objective.", "Before another sprint, let's confirm acceptance criteria. Speed without direction only accelerates waste."],
      ["Let's make progress measurable, ownership explicit, and accountability collective.", "Visible outcomes, named owners and shared responsibility.", "For the next release, let's make progress measurable, ownership explicit and accountability collective."]
    ],
    scenarios: [
      mcq("exe-1a", "Green milestones, red reality", "Your AI route-optimisation project for a delivery fleet has hit every development milestone, but it still can't access live telematics data and has no security approval. Go-live is in 5 weeks.", "What do you emphasise to the sponsor?", [
        ["The project is on track; milestones are green.", 0, "Green milestones hide red dependencies, and this will surprise everyone in week 5."],
        ["We need to manage dependencies, not just milestones. Here are the two that will decide go-live, and who owns each.", 100, "Shifts attention to what actually decides delivery, with owners."],
        ["Add a daily status meeting.", 10, "More coordination, same blockers."],
        ["Push go-live by a month to be safe.", 35, "Maybe needed, but without acting on the dependencies, the new date will slip too."]
      ], 0),
      mcq("exe-1b", "Three-week reviews", "Every architecture review takes about 3 weeks because nobody is sure who can approve what. The PMO proposes a weekly cross-team sync.", "Your response?", [
        ["Good idea, let's add the sync.", 15, "Adds coordination cost and leaves the root cause untouched."],
        ["Let's address the source of friction rather than add another layer of coordination: clarify decision rights by risk tier.", 100, "Fixes the underlying problem: unclear authority."],
        ["Escalate every review to the CTO.", 5, "Creates a bigger bottleneck."],
        ["Skip reviews for low-risk changes.", 55, "Part of the right answer, but it needs to be formalised as decision rights, not ad hoc skipping."]
      ], 1),
      bw("exe-2a", "The workaround that stayed", "Six months ago, your e-commerce team added manual review of AI-generated product descriptions and marketing copy as a 'temporary' fix. It now consumes 4 FTEs and nobody has a plan to remove it.", "Choose the BEST and the WORST move.", [
        ["Keep it; it's working and reduces risk.", "worst", "A temporary workaround has become an unplanned operating model with a growing cost."],
        ["Define exit criteria (error rate, confidence thresholds), move to sampling-based validation, and set a date to review the remaining manual scope.", "best", "Separates the workaround from the sustainable model, with measurable criteria for the change."],
        ["Remove manual validation immediately to save cost.", "mid", "Saves cost, but drops a control without evidence that it's no longer needed."],
        ["Automate the manual validation with another AI model.", "mid", "Possibly useful, but it adds complexity before asking whether full validation is still needed."]
      ], 2),
      bw("exe-2b", "One more sprint", "Your team asks for 'one more sprint' for the fourth time on a finance accounts-payable agent that extracts and matches supplier invoices. Acceptance criteria were never written down.", "Choose the BEST and the WORST move.", [
        ["Approve the sprint; they know the work best.", "mid", "Trusting, but without criteria, there's no finish line."],
        ["Pause for one day to agree acceptance criteria and a definition of done with the business owner, then plan the sprint against it.", "best", "Speed without direction only accelerates waste. One day of clarity saves weeks."],
        ["Replace the tech lead.", "worst", "Blames a person for a process gap you own."],
        ["Set a hard deadline and ship whatever is ready.", "mid", "Creates urgency, but may ship something that fails the business need."]
      ], 3),
      branch("exe-3", "Go-live slipping", "Six weeks to go-live of an AI demand-planning system ahead of peak season. Security approval is stuck, the ERP data feed is unstable, and two teams blame each other. The sponsor wants a recovery plan by Friday.",
        ["Sponsor: wants certainty", "Security lead: overloaded", "Data and app teams: blaming each other"], [
        { prompt: "Your first action:", options: [
          ["Run a 90-minute dependency mapping session with all teams: the critical path, the blockers and one named owner each.", 1, { trust: 10, value: 5, control: 15, momentum: 10 }, "Blame drops when everyone sees the same map. The two real blockers become obvious."],
          ["Ask each team for a written status report.", 0.3, { trust: -5, value: 0, control: 5, momentum: -5 }, "You get two reports that contradict each other."],
          ["Escalate the security delay to the CISO.", 0.5, { trust: -5, value: 0, control: 5, momentum: 5 }, "Might unblock it, but the security lead feels bypassed."]
        ]},
        { prompt: "Security says the review needs 4 weeks because the solution design is incomplete. You:", options: [
          ["Agree a staged review: approve the low-risk read-only components now, and complete the write-access design review in parallel.", 1, { trust: 10, value: 5, control: 10, momentum: 15 }, "Security appreciates the risk-based split. Two weeks are recovered."],
          ["Ask security to approve with conditions to hit the date.", 0.4, { trust: -10, value: 0, control: -10, momentum: 10 }, "Security feels pressured, and the conditions are vague."],
          ["Accept 4 weeks and move go-live.", 0.5, { trust: 5, value: -5, control: 5, momentum: -10 }, "Safe, but you didn't challenge the review's structure."]
        ]},
        { prompt: "Friday recovery plan to the sponsor:", options: [
          ["A revised date with confidence level, two critical dependencies with owners, a weekly measurable checkpoint, and a no-go condition.", 1, { trust: 15, value: 5, control: 10, momentum: 10 }, "The sponsor trusts the plan because it shows its own risks."],
          ["The original date, with assurances the team is working hard.", 0.1, { trust: -15, value: 0, control: -10, momentum: 0 }, "Hope presented as a plan."],
          ["A new date with buffer and no further detail.", 0.4, { trust: 0, value: 0, control: 0, momentum: 0 }, "Acceptable, but opaque; the sponsor can't help unblock anything."]
        ]}
      ], "Execution recovery is about making dependencies visible, splitting risk so work can proceed in parallel, and giving sponsors plans with confidence levels, not hope."),
      free("exe-4", { title: "The delivery bottleneck", situation: "An AI transformation across procurement, finance and HR operations is behind schedule. Teams are adding status meetings, but security approvals, unclear decision rights and data dependencies remain unresolved. The executive sponsor expects a recovery plan.",
        mission: "Deliver a concise intervention that identifies the real bottlenecks, clarifies ownership and proposes a more effective execution rhythm.",
        criteria: "Focus on root causes, dependencies and decisions, not more reporting.",
        hint: "Name one structural bottleneck, the decision needed to remove it and how progress will be measured.",
        keywords: ["dependenc", "decision right", "owner", "bottleneck", "measur", "security", "root cause", "rhythm"],
        modelAnswer: "We're not slow because people aren't working hard; we're slow because three structural blockers have no clear owner. I recommend we cancel two of the four status meetings and use that time on decisions: security approvals by risk tier within 5 days, a single owner for the data feed, and decision rights for architecture changes delegated to the platform lead. We need to manage dependencies, not just milestones. We'll track 3 measures weekly (open blockers, days to approval, critical-path slip) and I'll own the overall recovery.",
        curveball: { who: "Executive sponsor", text: "I don't want a new operating model. I want a date. When will it be live?",
          modelAnswer: "Understood. My answer is 10 weeks at 80% confidence, assuming security approves by risk tier this month. If that decision slips, so does the date, so I'm asking you to back it at Tuesday's leadership meeting. I'll report the date and its confidence every Friday." } })
    ]},

  /* ========================= 7. PEOPLE ========================= */
  { id: "people", name: "People leadership & capability building", short: "People leadership", icon: "♦",
    intro: "Build leaders, not just strong individual contributors. Empower judgement and institutionalise excellence.",
    expressions: [
      ["Delegate the decision, not just the task.", "Give people authority to exercise judgement, not just responsibility for execution.", "I want architecture leads to own design choices within guardrails. Delegate the decision, not just the task."],
      ["I want to develop judgement, not just expertise.", "Build the ability to make sound decisions, including when not to use a technique.", "Our data scientists need to know when a model is inappropriate. I want to develop judgement, not just expertise."],
      ["Make it safe to surface problems early.", "Create an environment where risks and mistakes are raised before they become expensive.", "I'd rather hear about model drift during validation than after deployment."],
      ["We should convert individual successes into institutional capabilities.", "Turn project learning into reusable methods, assets and knowledge.", "The first two engagements went well. Let's convert them into shared patterns and playbooks."],
      ["Our standards should be institutional, not dependent on individual heroes.", "Repeatable quality rather than reliance on a few exceptional people.", "Quality shouldn't depend on which architect is assigned. Our standards should be institutional."]
    ],
    scenarios: [
      mcq("ppl-1a", "Overloaded architects", "Your three senior architects are overloaded because every design decision escalates to them. Mid-level engineers wait days for answers.", "Best leadership response?", [
        ["Ask the architects to work longer hours this quarter.", 0, "Burns out your most critical people and fixes nothing."],
        ["Delegate the decision, not just the task: define which decisions mid-levels own within guardrails.", 100, "Builds capability and removes the bottleneck at the same time."],
        ["Create another approval layer to filter escalations.", 10, "Adds bureaucracy to a capacity problem."],
        ["Hire two more senior architects.", 40, "Adds capacity, but preserves the dependency on a few heroes."]
      ], 0),
      mcq("ppl-1b", "The hidden failing test", "You discover a data scientist on your marketing-analytics team knew for two weeks that the customer-segmentation model was failing its evaluation, but didn't raise it, fearing blame before the CMO's demo.", "What's your most important response?", [
        ["Issue a formal warning to set an example.", 10, "Guarantees the next problem will also be hidden."],
        ["Fix the issue, then make it safe to surface problems early: thank people who raise risks and review this as a process gap.", 100, "Addresses the cause: fear. Problems surface sooner next time."],
        ["Say nothing; it was a one-off.", 15, "Misses a culture signal."],
        ["Require daily reporting of all evaluation results.", 35, "Adds visibility, but not safety. People can still report selectively."]
      ], 2),
      bw("ppl-2a", "The hero who won't let go", "Your best principal architect reviews every design personally and rewrites others' work. Quality is high, but the team isn't growing and two mid-levels have resigned.", "Choose the BEST and the WORST move.", [
        ["Leave it; quality matters most.", "worst", "Short-term quality, long-term fragility. You're losing the next generation."],
        ["Reposition the architect as a coach: co-create design standards, hand them ownership of the review process, and measure their success by the team's decisions, not their own.", "best", "Converts individual excellence into institutional capability and gives the hero a bigger role."],
        ["Remove their review authority entirely.", "mid", "Solves the bottleneck abruptly, but alienates a key person and loses their expertise."],
        ["Send them on a leadership course.", "mid", "Helpful support, but it doesn't change the role or the incentives."]
      ], 4),
      bw("ppl-2b", "Brilliant technician, struggling lead", "You promoted a brilliant ML engineer to lead the supply-chain AI team 6 months ago. Their team's engagement scores dropped sharply; they still code most of the critical work themselves.", "Choose the BEST and the WORST move.", [
        ["Have a candid conversation: name the pattern, agree 2–3 leadership behaviours to practise, pair them with a mentor, and review in 60 days, with a dignified option to return to a principal IC track.", "best", "Honest, supportive and with a clear path either way."],
        ["Wait for the annual review.", "worst", "Six more months of team damage, and an unfair surprise for the lead."],
        ["Quietly move their best people to other teams.", "mid", "Protects people, but avoids the conversation the lead deserves."],
        ["Tell them to stop coding entirely.", "mid", "Right direction, but a blunt instruction without support rarely changes behaviour."]
      ], 1),
      branch("ppl-3", "The burnout signal", "Your strongest delivery team has been in crunch for 4 months on a flagship client. The lead hints they're 'weighing options'. The client just requested additional scope with the same deadline.",
        ["Team lead: exhausted, possibly leaving", "Client: wants more for the same date", "Your MD: wants client satisfaction"], [
        { prompt: "First conversation, with the team lead:", options: [
          ["Acknowledge the strain directly, ask what would make the next 8 weeks sustainable, and commit to act on it.", 1, { trust: 20, value: 0, control: 5, momentum: 5 }, "The lead is candid: the issue is unclear scope and weekend escalations, not the workload alone."],
          ["Offer a retention bonus.", 0.4, { trust: 5, value: 0, control: 0, momentum: 0 }, "Appreciated, but money doesn't fix the conditions causing the burnout."],
          ["Remind them of the career upside of this flagship.", 0.2, { trust: -15, value: 0, control: 0, momentum: 0 }, "Feels transactional. The lead updates their CV that night."]
        ]},
        { prompt: "With the client, about the new scope:", options: [
          ["Make the trade-offs visible: here's what fits by the deadline and what moves to phase 2, and I'd rather discuss it now than surprise you later.", 1, { trust: 10, value: 10, control: 10, momentum: 5 }, "The client pushes back but accepts a phased plan. They value the honesty."],
          ["Accept the scope; the team will find a way.", 0.1, { trust: -15, value: 5, control: -15, momentum: 5 }, "Your team hears that their wellbeing comes second to the client's convenience."],
          ["Refuse the additional scope outright.", 0.4, { trust: -5, value: -5, control: 10, momentum: -5 }, "Protects the team, but without options it strains the client relationship."]
        ]},
        { prompt: "To prevent a repeat across the practice, you:", options: [
          ["Institutionalise scope governance and a sustainable-pace check in delivery reviews, and build a bench so no team depends on one lead.", 1, { trust: 15, value: 10, control: 10, momentum: 5 }, "The practice becomes more resilient, and your MD sees the margin benefit."],
          ["Promise the team a long holiday after go-live.", 0.4, { trust: 5, value: 0, control: 0, momentum: 0 }, "Kind, but the system that caused it remains."],
          ["Nothing; crunches come with consulting.", 0.1, { trust: -20, value: 0, control: -5, momentum: -5 }, "Your best people will leave for leaders who think differently."]
        ]}
      ], "People leadership under pressure: listen first, protect the team through transparent trade-offs with clients, and fix the system, not just the symptom."),
      free("ppl-4", { title: "Building the next layer of leaders", situation: "Your 30-person Applied AI practice relies on a few senior architects for every major decision. Mid-level engineers are capable but hesitant, and project knowledge isn't being reused.",
        mission: "Address your leadership team with a plan to distribute decision-making, build judgement and make delivery quality repeatable.",
        criteria: "Show how you will empower people while preserving accountability and standards.",
        hint: "Describe the decisions you'll delegate, the guardrails you'll keep and how learning will be captured for reuse.",
        keywords: ["delegat", "guardrail", "judg", "playbook", "standard", "coach", "mid-level", "reuse", "decision"],
        modelAnswer: "Our quality today depends on three people, and that's a risk to clients and a ceiling on our growth. I recommend we delegate the decision, not just the task: from next month, mid-level leads own design decisions within a written set of guardrails, and seniors move from approving to coaching. We'll capture every engagement in a reusable playbook and run monthly design reviews to build judgement. The trade-off is a few weeks of slower decisions while people learn, so we'll track rework and client satisfaction to make sure standards hold.",
        curveball: { who: "Senior Architect", text: "If mid-levels make these calls, quality will drop and I'll be the one cleaning it up.",
          modelAnswer: "That concern is fair, and I need your expertise to prevent it. You'll write the guardrails and coach the first ten decisions, and you'll have a veto on anything high-risk. If rework rises above today's level, we adjust. Your impact multiplies through ten people instead of resting on you alone." } })
    ]},

  /* ========================= 8. STAKEHOLDERS ========================= */
  { id: "stakeholder", name: "Stakeholder & organisational navigation", short: "Stakeholders & politics", icon: "✦",
    intro: "Navigate politics, influence without authority, manage up and resolve cross-functional conflict.",
    expressions: [
      ["Let's pre-wire the decision before we present it.", "Socialise a proposal one-to-one with key stakeholders before the formal forum.", "Before the steering committee, let's pre-wire the decision with Finance and Risk."],
      ["I'd like to understand what success looks like from your side.", "Start from the other party's goals and constraints to find common ground.", "Before we discuss my proposal, I'd like to understand what success looks like from your side."],
      ["Who else needs to be comfortable with this before it can move?", "Map the hidden veto holders early.", "Legal and procurement have stopped projects late before. Who else needs to be comfortable with this?"],
      ["Let's disagree in the room and align outside it.", "Debate openly, then present a united front once decided.", "We can push hard on this today, but let's disagree in the room and align outside it."],
      ["Let's make it easy for them to say yes.", "Reduce the effort, risk and political cost of agreement for the other side.", "The COO is overloaded. Let's make it easy for them to say yes: a one-page brief and a 30-day trial."]
    ],
    scenarios: [
      mcq("stk-1a", "The steering committee vote", "You need approval for a $3M customer-data and AI platform investment at Thursday's steering committee. Finance and Risk haven't seen the proposal yet.", "Best preparation?", [
        ["Present it on Thursday and let the quality of the case speak.", 20, "Surprising Finance and Risk in a public forum invites defensive objections."],
        ["Let's pre-wire the decision before we present it: walk Finance and Risk through it one-to-one this week and fold in their concerns.", 100, "Turns potential objectors into co-authors before the formal decision."],
        ["Ask the CEO to back it in the meeting.", 35, "Sponsor support helps, but using it to override peers creates resentment."],
        ["Email the deck to everyone the night before.", 30, "Information isn't engagement; most won't read it."]
      ], 0),
      mcq("stk-1b", "The late veto", "Three weeks before launch, Legal blocks your hotel group's customer-facing AI booking assistant over guest data-retention concerns nobody had raised.", "What's the leadership lesson for next time?", [
        ["Legal is always a blocker; escalate faster.", 5, "Blames the function and guarantees future friction."],
        ["Ask 'who else needs to be comfortable with this before it can move?' at kickoff, and engage Legal, Privacy and Procurement from week one.", 100, "Maps hidden veto holders early, when their input is cheap."],
        ["Build more buffer into launch dates.", 30, "Treats the symptom, not the cause."],
        ["Have the business sponsor overrule Legal.", 0, "Creates real regulatory risk and a lasting enemy."]
      ], 2),
      bw("stk-2a", "The peer competing for your budget", "The Chief Data Officer, your peer, is pitching to the CFO that GenAI should sit under data, which would move half your budget. You hear it second-hand.", "Choose the BEST and the WORST move.", [
        ["Go to the CFO first to discredit the proposal.", "worst", "Turns a peer into an adversary and makes you look territorial."],
        ["Meet the CDO directly: understand what they're trying to solve, find the overlap, and co-propose a model with clear decision rights.", "best", "Starts from their interests and turns a turf war into a joint proposal the CFO can approve easily."],
        ["Ignore it; your results speak for themselves.", "mid", "Results matter, but you're leaving the narrative to someone else."],
        ["Ask your boss to protect your budget.", "mid", "May work, but escalating a peer issue before talking to the peer weakens you."]
      ], 1),
      bw("stk-2b", "Your boss over-commits", "In a board meeting, your CEO commits that 'AI-driven marketing personalisation will be live in all markets by Q2'. Your realistic plan says Q4.", "Choose the BEST and the WORST move.", [
        ["Correct the CEO in front of the board.", "worst", "Publicly undermines your boss; it's damaging even when you're right."],
        ["Speak with the CEO privately the same day: what's achievable by Q2, the options to accelerate, and how to reframe with the board.", "best", "Manages up candidly but loyally, with options rather than objections."],
        ["Say nothing and try to hit Q2.", "mid", "Avoids conflict, but an expensive surprise is coming."],
        ["Email the CEO your project plan showing Q4.", "mid", "Factual, but cold and easy to misread. This needs a conversation."]
      ], 3),
      branch("stk-3", "The turf war", "The Head of Data claims GenAI should sit under data, IT Security wants veto rights on every use case, and the business is frustrated that nothing is moving. The CEO asks you to 'fix the operating model' in 6 weeks, but none of these people report to you.",
        ["Head of Data: wants ownership", "IT Security: wants control", "Business heads: want speed"], [
        { prompt: "Week 1. Your first move:", options: [
          ["Meet each party one-to-one: 'I'd like to understand what success looks like from your side.' Then map the interests, fears and overlaps.", 1, { trust: 15, value: 5, control: 5, momentum: 5 }, "You learn that Security's real fear is customer data in prompts, and Data's is losing relevance."],
          ["Draft an operating model and circulate it for comments.", 0.4, { trust: -5, value: 5, control: 5, momentum: 5 }, "Comments arrive as positions. Everyone defends their territory on paper."],
          ["Ask the CEO to announce that you own GenAI.", 0.2, { trust: -15, value: 0, control: 10, momentum: 5 }, "You win the mandate and lose the cooperation you need to deliver."]
        ]},
        { prompt: "Week 3. You've designed a proposal. Before the decision forum you:", options: [
          ["Pre-wire it: give Data ownership of the data products and evaluation, give Security a tiered review (fast lane for low risk), give the business a 2-week intake SLA, and refine it with each party.", 1, { trust: 15, value: 10, control: 10, momentum: 10 }, "Each party sees their concern addressed. Nobody will be surprised in the forum."],
          ["Present it fresh at the forum to get honest reactions.", 0.3, { trust: -10, value: 0, control: 0, momentum: -5 }, "The 'honest reactions' turn into a two-hour debate with no decision."],
          ["Pre-wire only with the business, who are your allies.", 0.5, { trust: 0, value: 5, control: -5, momentum: 5 }, "The business is behind you, but Data and Security feel outflanked."]
        ]},
        { prompt: "In the forum, Security pushes hard on one point. You:", options: [
          ["Welcome the debate, adjust the threshold with Security, and agree to disagree in the room and align outside it, with a joint announcement.", 1, { trust: 15, value: 5, control: 10, momentum: 10 }, "A united announcement. The CEO sees the conflict resolved, not just managed."],
          ["Hold your ground; the proposal is balanced.", 0.4, { trust: -5, value: 5, control: 0, momentum: 0 }, "It passes, but Security complies minimally."],
          ["Concede fully to avoid conflict.", 0.3, { trust: 5, value: -10, control: 10, momentum: -10 }, "Harmony now; the 6-week review queue returns."]
        ]}
      ], "Influence without authority: understand interests before positions, pre-wire so nobody is surprised, and show unity once decided."),
      free("stk-4", { title: "Influence without authority", situation: "Your AI agent-assist solution needs the contact-centre team under the VP of Customer Operations to change how they handle calls and chats. They don't report to you. The VP is sceptical after previous 'transformation' programmes failed, and agents fear AI will be used to monitor and measure them.",
        mission: "Write your opening message to the VP of Customer Operations in your first one-to-one: build trust, address the fears and propose a low-risk path to adoption.",
        criteria: "Start from their interests, make it easy to say yes, and be credible about risks and what you'll own.",
        hint: "Ask what success looks like for them, name the fear honestly, and offer a small, reversible first step with their team in control.",
        keywords: ["success", "your team", "agent", "pilot", "trial", "fear", "measure", "control", "revers", "own"],
        modelAnswer: "I'd like to start by understanding what success looks like from your side this year. I suspect it's first-contact resolution, customer satisfaction and agent workload, not AI. I know your team has seen transformations fail, and I know agents worry this will be used to monitor them. I'll commit in writing that it won't be. I recommend a 30-day trial with one team of your choosing, your team lead deciding what's working, and the option to stop at any point. My team will do the setup work. If resolution rates don't improve, we stop, and I'll own that outcome.",
        curveball: { who: "VP, Customer Operations", text: "My team has seen three 'transformations' fail. Why should this one be different?",
          modelAnswer: "Fair question. I won't ask you to trust the promise, only the design. It's 30 days, one team, your lead decides, and you can stop it anytime. The previous programmes were done to your team; this one is done with them, and I'll measure success by the metrics you choose." } })
    ]}
  ];

  /* ---------- Industry / function context shown on each scenario ---------- */
  const INDUSTRY = {
    "str-1a": "Retail", "str-1b": "Manufacturing", "str-2a": "Consumer goods", "str-2b": "Telecom · Customer experience", "str-3": "Cross-industry", "str-4": "Consumer goods · Marketing",
    "val-1a": "Logistics · Supply chain", "val-1b": "Retail · Fashion", "val-2a": "E-commerce", "val-2b": "Shared services · HR & Finance", "val-3": "Cross-industry", "val-4": "Consumer goods",
    "rig-1a": "Grocery · Supply chain", "rig-1b": "Telecom", "rig-2a": "HR · Talent acquisition", "rig-2b": "Payments · Financial services", "rig-3": "HR · Hiring", "rig-4": "Banking · Customer experience",
    "ent-1a": "Cross-functional", "ent-1b": "Industrial manufacturing", "ent-2a": "Sales & marketing", "ent-2b": "HR · Employee experience", "ent-3": "Pharma", "ent-4": "Retail",
    "inf-1a": "Procurement", "inf-1b": "Airlines · Customer experience", "inf-2a": "Healthcare · Advisory", "inf-2b": "Marketing", "inf-3": "Utilities · Field operations", "inf-4": "Logistics · Advisory",
    "exe-1a": "Logistics · Fleet", "exe-1b": "Cross-industry", "exe-2a": "E-commerce · Marketing", "exe-2b": "Finance operations", "exe-3": "Supply chain", "exe-4": "Procurement, Finance & HR",
    "ppl-1a": "AI practice", "ppl-1b": "Marketing analytics", "ppl-2a": "AI practice", "ppl-2b": "Supply chain AI", "ppl-3": "Consulting", "ppl-4": "AI practice",
    "stk-1a": "Customer data", "stk-1b": "Hospitality · Customer experience", "stk-2a": "Data & AI leadership", "stk-2b": "Marketing", "stk-3": "Cross-functional", "stk-4": "Contact centre · Customer experience"
  };

  /* ---------- Flatten for lookup ---------- */
  const byId = {};
  tracks.forEach(t => t.scenarios.forEach(s => { s.track = t.id; s.industry = INDUSTRY[s.id] || "Cross-industry"; byId[s.id] = s; }));

  /* Calibration uses each track's second Foundation item. */
  const calibration = tracks.map(t => t.scenarios.find(s => s.tier === 1 && s.id.endsWith("1b")));

  const tierNames = { 1: "Foundation", 2: "Applied", 3: "Complex", 4: "Boardroom" };
  const tierFormats = { 1: "Pick the strongest response", 2: "Best & worst action", 3: "Multi-stakeholder simulation", 4: "Written response + curveball" };

  A.content = { tracks, byId, calibration, tierNames, tierFormats,
    track: id => tracks.find(t => t.id === id),
    scenariosFor: (trackId, tier) => tracks.find(t => t.id === trackId).scenarios.filter(s => s.tier === tier) };
})(window.Arena);
