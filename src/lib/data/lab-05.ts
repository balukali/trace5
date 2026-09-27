import type { Lab } from "@/lib/types";
import digests from "@/lib/data/flag-digests.json";

const D = digests as Record<string, string>;

export const lab05: Lab = {
  id: "lab-05",
  number: 5,
  title: "Northstar Breach",
  codename: "API",
  tagline: "API discovery, excessive data exposure, mass assignment, throttling and vulnerability chaining",
  difficulty: 5,
  difficultyLabel: "Expert",
  xpTotal: 1000,
  target: "Northstar Customer API (incident NS-2026-005)",
  brief:
    "Several low-severity findings sit on the customer API. No single alert looks critical. Your mission is to connect them and explain why the combination is more dangerous than the sum of its parts.",
  story: [
    "Northstar's security operations centre opens incident NS-2026-005 against the customer API. The alert volume is low. Individually, nothing in the logs would have been escalated.",
    "The pattern, however, is machine-like: a hundred requests in ten seconds, identifiers walked in sequence, a profile update carrying a field the interface never sends.",
    "You are the junior analyst assigned to the incident. Five findings are already open against the API. Your job is to establish what each one actually enables, decide what the combination means, and write the report that will drive the remediation plan.",
    "All responses in this lab are predefined training data. No live Northstar service exists and none is contacted.",
  ],
  objectives: [
    "Map the API surface from frontend behaviour",
    "Identify excessive data exposure in a response",
    "Test object-level authorization on order identifiers",
    "Explain mass assignment and over-posting",
    "Evaluate rate limiting as a mitigation, with its limits",
    "Recognise vulnerability chaining and write an incident report",
  ],
  concepts: [
    { name: "API Security", klass: "Architecture", coreIdea: "Assume the client is hostile; enforce every rule on the server.", defense: "Server-side authorization, schema validation, minimal responses" },
    { name: "Data Minimization", klass: "Privacy", coreIdea: "Return only the fields the client actually needs.", defense: "Explicit response DTOs instead of serialising the model" },
    { name: "Mass Assignment", klass: "Secure Development", coreIdea: "Binding every submitted field lets the client set server-side attributes.", defense: "Explicit allowlists of writable fields" },
    { name: "Rate Limiting", klass: "Availability", coreIdea: "Bound how fast one source can act, to raise the cost of automation.", defense: "Per-user quotas, tighter limits on auth, alerting on enumeration" },
  ],
  terminals: ["logs/"],
  terminal: "capi",
  challenges: [
    {
      id: "L5C1",
      labId: "lab-05",
      index: 1,
      codename: "DISCOVERY",
      title: "Map the surface",
      description:
        "Open the network inspector and identify which component actually provides the dashboard's data. Then classify the role of each observed request.",
      objective: "Which component provides the application's data, and what is the API's role?",
      difficulty: "Easy",
      type: "multiple-choice",
      requiresEvidence: ["lab-05:discovery"],
      hints: [
        { level: 1, text: "Look at the three requests the frontend makes on load.", cost: 10 },
        { level: 2, text: "The HTML arrives with no data in it. The JSON arrives separately.", cost: 20 },
        { level: 3, text: "The API is the data source: the frontend is a client that renders whatever the API returns.", cost: 30 },
      ],
      learning: {
        what: "The dashboard is a thin client. All real data comes from the API, so every API response is an attack surface the frontend cannot protect.",
        why: "Modern frontends hold no secrets. Anything the browser can display, an attacker can request directly with a script.",
        danger: "Security decisions made in the UI are not security controls. If the API trusts the client, the client decides the rules.",
        discovery: "Open developer tools, watch the network traffic on page load, and note which requests return JSON and which return the page itself.",
        prevention: "Treat the client as untrusted, enforce all authorization server-side, and never rely on hidden UI fields as protection.",
        testing: "Replay every request the frontend makes with a modified session, and confirm the API independently enforces access rules.",
      },
      code: {
        language: "http",
        vulnerable:
          "GET /  ->  200, HTML with an empty shell, no data\nGET /api/profile -> 200, JSON with the data\nGET /api/orders  -> 200, JSON with the data",
        note: "If the data came with the page, there would be no API to attack. There is one.",
      },
      options: [
        { id: "api", label: "The API is the data source; the frontend is a client that renders whatever the API returns.", correct: true, rationale: "The page shell contains no data - the JSON requests do." },
        { id: "ssr", label: "The server renders everything and the API is only for background jobs.", correct: false, rationale: "The HTML arrives empty; the API supplies all data." },
        { id: "db", label: "The browser queries the database directly through a client-side SDK.", correct: false, rationale: "No credentials for a database would be shipped to a browser." },
        { id: "cdn", label: "The data is served from a CDN cache built at deploy time.", correct: false, rationale: "The responses are per-session and change with the user." },
      ],
      flagDigest: D.L5C1,
      xp: 100,
    },
    {
      id: "L5C2",
      labId: "lab-05",
      index: 2,
      codename: "EXCESSIVE DATA",
      title: "Read the response",
      description:
        "Inspect GET /api/profile. The dashboard renders only a name and an email. Identify every field the API returns that the dashboard has no reason to see.",
      objective: "Which returned fields are unnecessary for a customer dashboard?",
      difficulty: "Easy",
      type: "multiple-answer",
      requiresEvidence: ["lab-05:profile"],
      hints: [
        { level: 1, text: "List every field in the JSON, then ask which ones the UI actually displays.", cost: 10 },
        { level: 2, text: "Three fields describe internal operations rather than the customer's account.", cost: 20 },
        { level: 3, text: "The three are internalRiskScore, supportNote and warehouse. They are internal, not customer-facing.", cost: 30 },
      ],
      learning: {
        what: "The profile response includes internalRiskScore, supportNote and warehouse - fields with no place on a customer dashboard.",
        why: "Serialising a database model straight into a response is the default outcome. Somebody has to decide what leaves the system, and usually nobody does.",
        danger: "Every extra field is potential intelligence: risk scores enable targeting, support notes reveal account state, and internal identifiers enable further enumeration.",
        discovery: "Compare the rendered UI against the raw response and list everything the client receives but does not show.",
        prevention: "Return explicit response objects containing only required fields, keep internal models separate from API schemas, and review responses as part of code review.",
        testing: "Snapshot every endpoint's response and assert the field set; new internal fields must fail the test until deliberately exposed.",
      },
      code: {
        language: "json",
        vulnerable:
          "{\n  \"id\": 1021,\n  \"name\": \"Alex\",\n  \"email\": \"alex@example.test\",\n  \"role\": \"customer\",\n  \"internalRiskScore\": 17,\n  \"supportNote\": \"Prefers email\",\n  \"warehouse\": \"BLR-02\"\n}",
        secure:
          "{\n  \"id\": 1021,\n  \"name\": \"Alex\",\n  \"email\": \"alex@example.test\"\n}",
        note: "Data minimisation is the cheapest control in API security: do not send what you do not need.",
      },
      options: [
        { id: "risk", label: "internalRiskScore", correct: true },
        { id: "note", label: "supportNote", correct: true },
        { id: "warehouse", label: "warehouse", correct: true },
        { id: "name", label: "name", correct: false },
        { id: "email", label: "email", correct: false },
        { id: "id", label: "id", correct: false },
        { id: "role", label: "role", correct: false },
      ],
      flagDigest: D.L5C2,
      xp: 120,
    },
    {
      id: "L5C3",
      labId: "lab-05",
      index: 3,
      codename: "OBJECT ACCESS",
      title: "Walk the identifiers",
      description:
        "Request an order that belongs to another customer and decide which control should have prevented it.",
      objective: "Which control is missing, and what should the API do?",
      difficulty: "Medium",
      type: "multiple-choice",
      requiresEvidence: ["lab-05:foreign-order"],
      hints: [
        { level: 1, text: "The order identifiers are sequential integers. Walk them.", cost: 10 },
        { level: 2, text: "Compare the owner in the response with the owner in your own session.", cost: 20 },
        { level: 3, text: "Object-level authorization is missing; the API must compare the order's owner to the session user and deny otherwise.", cost: 30 },
      ],
      learning: {
        what: "GET /api/orders/1022 as user 1021 returns another customer's order with 200 OK. The missing control is object-level authorization.",
        why: "The list endpoint is scoped to the caller, which creates false confidence - the detail endpoint is not scoped, and the list is what developers test.",
        danger: "Sequential identifiers plus a missing ownership check turns a single account into a complete data export.",
        discovery: "Take an identifier from your own order, increment it, and compare the owner field with your session identity.",
        prevention: "Enforce ownership on every object route, scope queries by owner in the data layer, and use opaque identifiers as defence in depth.",
        testing: "Run a cross-tenant matrix: for each account and each order, expect allow only where owner matches, deny everywhere else.",
      },
      code: {
        language: "http",
        vulnerable:
          "GET /api/orders/1022 HTTP/1.1\nCookie: session=user-1021\n\nHTTP/1.1 200 OK\n\n{ \"id\": 1022, \"owner\": \"priya\", \"total\": 1899.50, \"items\": 5 }",
        secure:
          "GET /api/orders/1022 HTTP/1.1\nCookie: session=user-1021\n\nHTTP/1.1 403 Forbidden\n\n{ \"error\": \"forbidden\" }",
        note: "The list endpoint being safe proves nothing about the detail endpoint.",
      },
      options: [
        { id: "objectauthz", label: "Object-level authorization: the API must verify the order belongs to the requesting user before returning it.", correct: true, rationale: "This is the missing per-object decision." },
        { id: "scope", label: "Field-level scoping: strip fields the caller should not see.", correct: false, rationale: "Scoping fields does not stop the record being read at all." },
        { id: "throttle", label: "Rate limiting on the orders endpoint.", correct: false, rationale: "Throttling slows enumeration; it does not authorize access." },
        { id: "opaque", label: "Opaque identifiers instead of sequential integers.", correct: false, rationale: "Helpful as defence in depth, but not the missing control." },
      ],
      flagDigest: D.L5C3,
      xp: 140,
    },
    {
      id: "L5C4",
      labId: "lab-05",
      index: 4,
      codename: "MASS ASSIGNMENT",
      title: "Send an extra field",
      description:
        "The profile update UI only ever sends name and email. Submit the update with an extra `role` field, observe what the API applies, then explain why accepting arbitrary fields is dangerous.",
      objective: "Explain the mass-assignment risk and identify the correct control.",
      difficulty: "Hard",
      type: "multiple-answer",
      requiresEvidence: ["lab-05:mass-assign"],
      hints: [
        { level: 1, text: "The server has no way to know which fields the interface intended to allow.", cost: 10 },
        { level: 2, text: "Binding every submitted field lets the client choose what the server writes, including server-side attributes.", cost: 20 },
        { level: 3, text: "Correct set: accept an explicit allowlist of writable fields, never bind privilege fields from the request, and do not treat client-side hiding as a control.", cost: 30 },
      ],
      learning: {
        what: "PATCH /api/profile accepted a `role` field the interface never sends and applied it. This is mass assignment, also called over-posting.",
        why: "Binding a request body directly onto a model grants the client whatever fields the model happens to expose. The interface is not the contract.",
        danger: "A single extra field can change privilege, ownership, state or price. Anything modelled but not meant to be writable becomes writable.",
        discovery: "Compare the fields the UI sends with the fields the endpoint accepts, then try adding one the model happens to have.",
        prevention: "Use an explicit allowlist per endpoint, validate types with a schema, and keep privileged fields out of writable models entirely.",
        testing: "For every write endpoint, submit each non-writable field and assert the server rejects it and leaves the record unchanged.",
      },
      code: {
        language: "json",
        vulnerable:
          "// the server binds whatever arrives\nconst patch = req.body\nawait User.update(patch)          // role, id, tenantId all writable\n\n// client sent: { name, email, role }",
        secure:
          "// the server decides what may be written\nconst allowedFields = ['name', 'email']\nconst patch = pick(req.body, allowedFields)\nawait User.update(patch)",
        note: "The allowlist is the security boundary. The UI is a convenience.",
      },
      options: [
        { id: "client", label: "The client is trusted to send only intended fields, because the interface is the only way to reach the endpoint.", correct: true },
        { id: "arbitrary", label: "Arbitrary submitted fields can set server-side attributes the client was never meant to control.", correct: true },
        { id: "allowlist", label: "The server must accept only an explicit allowlist of writable fields per endpoint.", correct: true },
        { id: "harmless", label: "It is harmless because the user is only changing their own profile.", correct: false },
        { id: "schemaonly", label: "Input validation alone is sufficient protection.", correct: false },
        { id: "rate", label: "Rate limiting prevents mass assignment.", correct: false },
      ],
      flagDigest: D.L5C4,
      xp: 160,
    },
    {
      id: "L5C5",
      labId: "lab-05",
      index: 5,
      codename: "THROTTLING",
      title: "Read the traffic",
      description:
        "The access log shows 100 requests in 10 seconds from one source, with no 429 and no lockout. Decide what control would reduce this abuse - and be honest about what it cannot do.",
      objective: "Identify the appropriate control and state its limits.",
      difficulty: "Hard",
      type: "multiple-choice",
      requiresEvidence: ["lab-05:rate-log"],
      hints: [
        { level: 1, text: "The pattern is automated enumeration, not a legitimate user session.", cost: 10 },
        { level: 2, text: "Which control exists specifically to bound how fast one source can act?", cost: 20 },
        { level: 3, text: "Rate limiting is that control - but it raises cost, it does not authorize access, and IP-based limits are easy to evade.", cost: 30 },
      ],
      learning: {
        what: "Rate limiting bounds request volume per user, token or source. It makes enumeration expensive; it is not a substitute for authorization.",
        why: "Automation changes the economics of an attack. Free enumeration will be performed exhaustively; expensive enumeration often is not.",
        danger: "Treating rate limiting as the fix produces false confidence: distributed sources, authenticated accounts and patient low-rate enumeration all defeat it.",
        discovery: "Look for high request rates, sequential identifier access and repeated failures from a single source in the logs.",
        prevention: "Apply per-user and per-token quotas, stricter limits on authentication and password reset, alerting on enumeration patterns, and fix the underlying authorization gap.",
        testing: "Verify limits trigger at the documented threshold, return informative responses such as Retry-After, and raise alerts rather than failing silently.",
      },
      code: {
        language: "text",
        vulnerable:
          "09:41:12.001  100 requests in 10.0s from one source\nno 429 emitted, no lockout, no alert",
        secure:
          "per-user: 60 req/min -> 429 with Retry-After\nauth endpoints: 5 attempts / 15 min -> temporary lockout + alert\nenumeration pattern -> security event",
        note: "Rate limiting is a cost control. It never replaces an authorization check.",
      },
      options: [
        { id: "ratelimit", label: "Rate limiting: per-user quotas with tighter limits on sensitive endpoints, plus alerting on enumeration patterns.", correct: true, rationale: "This is the control designed to bound automated access." },
        { id: "notfix", label: "Rate limiting reduces automated abuse but does not authorize access, and cannot be the only control.", correct: true, rationale: "Correct - and that limitation is the point." },
        { id: "onlyfix", label: "Rate limiting alone fixes the problem, since enumeration is the root cause.", correct: false, rationale: "The root cause is missing authorization; throttling only raises cost." },
        { id: "ip", label: "Blocking by IP address is a complete solution.", correct: false, rationale: "IP controls are trivially evaded with proxies and botnets." },
        { id: "firewall", label: "A web application firewall will block this traffic.", correct: false, rationale: "A WAF may slow the pattern but does not authorize access." },
      ],
      flagDigest: D.L5C5,
      xp: 180,
    },
    {
      id: "L5C6",
      labId: "lab-05",
      index: 6,
      codename: "THE CHAIN",
      title: "Connect the findings",
      description:
        "You have five findings. None is critical alone. Choose the statement that best describes the security problem as a whole.",
      objective: "Which statement best describes the combined security problem?",
      difficulty: "Expert",
      type: "multiple-choice",
      requiresEvidence: ["lab-05:discovery", "lab-05:profile", "lab-05:foreign-order", "lab-05:mass-assign", "lab-05:rate-log"],
      hints: [
        { level: 1, text: "Consider what each weakness enables the next one to do.", cost: 10 },
        { level: 2, text: "Excess data tells you what exists. Predictable identifiers let you ask for it. Missing authorization means you get it. No throttling means you can do it at scale.", cost: 20 },
        { level: 3, text: "The answer is the one describing several individually moderate weaknesses that combine to increase impact.", cost: 30 },
      ],
      learning: {
        what: "The correct reading is that several individually moderate weaknesses combine into a materially worse outcome than any of them alone.",
        why: "Attackers chain weaknesses. Each link removes an obstacle that would otherwise stop the next step, so the combined cost is far lower than the sum of the parts.",
        danger: "Triage that ranks findings in isolation will consistently under-rank chains. That is how moderate findings become incidents.",
        discovery: "Ask of each finding: what does this make easier for someone who already has the previous finding?",
        prevention: "Remediate the enabling controls - authorization, data minimization, allowlists, throttling - and assess systems in chains rather than as isolated tickets.",
        testing: "After remediation, replay the entire chain end to end and confirm it fails at the first missing control.",
      },
      code: {
        language: "text",
        vulnerable:
          "API discovery\n      v\nexcess data discovered\n      v\nobject identifiers predictable\n      v\nauthorization weak\n      v\nunintended fields accepted\n      v\nweak throttling\n      v\nincreased attack surface",
        secure:
          "Break any single link and the chain fails:\nstrong authorization stops the read;\nallowlisted writes stop the change;\nthrottling stops the scale.",
        note: "Chains are why severity ratings are not additive - and why they are not independent either.",
      },
      options: [
        { id: "b", label: "Several individually moderate weaknesses that can combine to increase impact.", correct: true, rationale: "Each weakness enables the next; the chain is the real risk." },
        { id: "a", label: "One isolated vulnerability with a clear single root cause.", correct: false, rationale: "There are five distinct findings across different endpoints." },
        { id: "c", label: "Only a frontend design problem.", correct: false, rationale: "The issues are server-side authorization and data handling." },
        { id: "d", label: "Only a performance problem.", correct: false, rationale: "Request volume is a symptom of automation, not the vulnerability." },
      ],
      flagDigest: D.L5C6,
      xp: 100,
    },
    {
      id: "L5F",
      labId: "lab-05",
      index: 7,
      codename: "INCIDENT REPORT",
      title: "Write the report",
      description:
        "This is the deliverable. Write the incident report as you would for the Northstar security lead: root cause, impact, affected component, and remediation. Each field must name the underlying concepts, not just describe symptoms. On acceptance the platform releases the final flag.",
      objective: "Submit a complete incident report and capture the final flag.",
      difficulty: "Expert",
      type: "report",
      requiresEvidence: [
        "lab-05:discovery",
        "lab-05:profile",
        "lab-05:foreign-order",
        "lab-05:mass-assign",
        "lab-05:rate-log",
      ],
      reportFields: [
        {
          id: "rootCause",
          label: "Root cause",
          placeholder:
            "Example: the API trusts client-supplied fields and identifiers and does not enforce authorization at the object level, so several moderate weaknesses combine.",
          keywords: ["authorization", "object", "ownership", "client", "trust", "server", "chain", "combine", "mass assignment", "validation"],
        },
        {
          id: "impact",
          label: "Impact",
          placeholder:
            "Example: unauthorized customers can read other customers' orders and internal fields, and can modify account attributes they should not control.",
          keywords: ["data", "exposure", "disclosure", "unauthorized", "account", "privilege", "role", "orders", "customer", "enumerable"],
        },
        {
          id: "component",
          label: "Affected component",
          placeholder:
            "Example: the Northstar Customer API - GET /api/profile, GET /api/orders/:id, PATCH /api/profile, and the missing rate limiting layer.",
          keywords: ["api", "profile", "orders", "endpoint", "customer api", "patch", "get", "rate", "middleware", "service"],
        },
        {
          id: "remediation",
          label: "Recommended remediation",
          placeholder:
            "Example: enforce server-side object-level authorization on every request, return only necessary fields, allowlist writable fields, and add rate limiting with monitoring.",
          keywords: ["authorization", "server", "allowlist", "minimiz", "rate limit", "throttl", "monitor", "logging", "audit", "validation"],
        },
      ],
      hints: [
        { level: 1, text: "Each field needs the underlying concept, not a restatement of the symptom. Mention authorization, not 'someone saw data they should not have'.", cost: 10 },
        { level: 2, text: "Root cause should reference trusting client input and missing object-level checks. Impact should name what data was exposed and which attributes could be changed. Remediation should name allowlists, minimization, server-side authorization and rate limiting.", cost: 20 },
        { level: 3, text: "Each field must be at least a full sentence. Include the words authorization, object, data, allowlist and rate limit somewhere across the report.", cost: 30 },
      ],
      learning: {
        what: "A complete incident report ties findings to a root cause, states concrete impact, names the affected component precisely, and recommends controls that remove the class of problem rather than the instance.",
        why: "Engineers who fix the report you write will either address the mechanism or patch the symptom. Precision decides which one happens.",
        danger: "A report that lists symptoms without mechanisms produces a patch that will be bypassed within weeks.",
        discovery: "As you write, ask what each control is actually protecting and which finding it would have prevented.",
        prevention: "Server-side object-level authorization, data minimization with explicit response DTOs, allowlisted writable fields with schema validation, rate limiting and monitoring, plus regression tests for each control.",
        testing: "After remediation, replay the full chain: the enumeration should fail at the first missing control, and monitoring should alert on the attempt.",
      },
      code: {
        language: "text",
        vulnerable:
          "REPORT DRAFT (insufficient)\nRoot cause: the API is not secure enough.\nImpact: bad things happened.",
        secure:
          "REPORT (actionable)\nRoot cause: the API trusts client-supplied identifiers and fields and does not enforce object-level authorization per request.\nImpact: any authenticated customer can read other customers' orders and internal profile fields, and can set attributes not intended to be writable.\nComponent: Northstar Customer API (GET /api/profile, GET /api/orders/:id, PATCH /api/profile).\nRemediation: enforce server-side authorization, minimize responses, allowlist writable fields, add rate limiting and monitoring.",
        note: "Name the mechanism. The remediation follows from it.",
      },
      options: [],
      flagDigest: D.L5F,
      xp: 200,
    },
  ],
  writeUp: {
    overview:
      "The Northstar Customer API did not have one catastrophic bug. It had five moderate ones, and together they let a single authenticated customer read other customers' data, change account attributes they should not control, and do it fast enough to matter.",
    concept:
      "Vulnerability chaining: each weakness removes an obstacle that would have blocked the next step. Excess data tells an attacker what exists, predictable identifiers let them ask for it, missing authorization means they get it, mass assignment lets them change it, and absent throttling lets them do it all at scale.",
    solution:
      "GET /api/profile exposes internalRiskScore, supportNote and warehouse. Order identifiers are sequential and the detail endpoint never checks ownership. PATCH /api/profile accepts a role field the UI never sends. No rate limiting is applied, so 100 requests in 10 seconds succeeded with no 429.",
    whyItWorks:
      "Each finding is individually defensible: the UI does not show that field, the identifiers are internal, the client does not send role. There is no layer where those assumptions are checked against the server's actual authority.",
    remediation:
      "Enforce server-side object-level authorization on every request. Return explicit minimal response objects. Allowlist writable fields per endpoint with schema validation. Apply per-user rate limiting with stricter limits on sensitive endpoints. Add monitoring for enumeration patterns and unusual field usage, then regression tests for each control.",
    realWorld:
      "Chained findings are the normal case in real incidents. The single critical vulnerability written about in a report is often just the last link in a chain that was cheap to build because three earlier links were already missing.",
    flag: "FLAG{SMALL_WEAKNESSES_CAN_COMBINE}",
  },
};

