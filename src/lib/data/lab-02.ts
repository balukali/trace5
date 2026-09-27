import type { Lab } from "@/lib/types";
import digests from "@/lib/data/flag-digests.json";

const D = digests as Record<string, string>;

export const lab02: Lab = {
  id: "lab-02",
  number: 2,
  title: "Not Your Account",
  codename: "IDENTITY",
  tagline: "Broken access control, IDOR/BOLA and the difference between authN and authZ",
  difficulty: 3,
  difficultyLabel: "Medium",
  xpTotal: 1000,
  target: "Northstar Customer Portal API",
  brief:
    "Northstar claims customers can only access their own invoices. You are signed in as a real customer. Verify the claim by changing object identifiers in an API request.",
  story: [
    "Northstar's customer portal exposes invoices through a simple REST endpoint. The product team is confident about one thing: a customer can only ever see their own invoices.",
    "During a routine review you notice the invoice URL is just a number: /api/invoices/1042. You are signed in as Alex, a normal customer with two invoices.",
    "The question for this engagement is narrow and answerable: does the API check who is asking, or only what they asked for?",
    "Everything here is a simulation. No real Northstar API is contacted.",
  ],
  objectives: [
    "Understand what an object identifier represents in an API",
    "Test whether changing the identifier changes the returned object",
    "Distinguish authentication from authorization",
    "Read vulnerable and secure handler logic",
    "Name the missing security property",
  ],
  concepts: [
    { name: "Authorization", klass: "Access Control", coreIdea: "Deciding what an authenticated identity is allowed to do.", defense: "Server-side permission checks on every request" },
    { name: "IDOR / BOLA", klass: "Broken Access Control", coreIdea: "Changing an object reference returns an object you should not see.", defense: "Ownership checks, opaque identifiers, deny by default" },
  ],
  terminals: ["invoices/"],
  terminal: "invoices",
  challenges: [
    {
      id: "L2C1",
      labId: "lab-02",
      index: 1,
      codename: "RECON",
      title: "What is 1042?",
      description:
        "Request the invoice you were shown and inspect the JSON response. Identify what the number in the URL path actually represents.",
      objective: "What does the identifier 1042 refer to?",
      difficulty: "Easy",
      type: "multiple-choice",
      requiresEvidence: ["lab-02:own-invoice"],
      hints: [
        { level: 1, text: "Look at the field name inside the JSON body.", cost: 10 },
        { level: 2, text: "The path segment is a direct reference to a stored object, not a query.", cost: 20 },
        { level: 3, text: "It is the invoice_id - the identifier of one invoice record.", cost: 30 },
      ],
      learning: {
        what: "GET /api/invoices/1042 returns a single invoice object whose invoice_id is 1042.",
        why: "REST designs address individual records by a stable identifier, so the caller can request any record directly if the server allows it.",
        danger: "If the server trusts the identifier without checking ownership, every record in the system becomes reachable by incrementing a number.",
        discovery: "Read the request path and the response body together; the path segment maps to the invoice_id field.",
        prevention: "Authorize every request against the record's owner, and avoid exposing meaningful sequential identifiers publicly.",
        testing: "As user A, request an identifier known to belong to user B and confirm a 403 is returned with no data in the body.",
      },
      code: {
        language: "http",
        vulnerable: "GET /api/invoices/1042 HTTP/1.1\nCookie: session=alex\n\nHTTP/1.1 200 OK\n\n{ \"invoice_id\": 1042, \"customer\": \"alex\", \"amount\": 1299, \"status\": \"paid\" }",
        note: "The session says who you are. Nothing here says whether you may see this record.",
      },
      options: [
        { id: "invoice", label: "The identifier of a specific invoice record", correct: true, rationale: "It maps directly to the invoice_id field in the response." },
        { id: "user", label: "The identifier of the customer who owns it", correct: false, rationale: "The owner is a separate field in the body: customer." },
        { id: "query", label: "A search query that filters a list", correct: false, rationale: "It selects one object, not a filtered collection." },
        { id: "token", label: "A session token", correct: false, rationale: "The session travels in the Cookie header, not the path." },
      ],
      flagDigest: D.L2C1,
      xp: 100,
    },
    {
      id: "L2C2",
      labId: "lab-02",
      index: 2,
      codename: "ENUMERATION",
      title: "Change the identifier",
      description:
        "You are signed in as alex. Request an invoice that belongs to another customer and observe the response. When the simulation confirms you have reached someone else's object, capture the flag it prints.",
      objective: "Reach another customer's invoice and capture the flag.",
      difficulty: "Medium",
      type: "flag",
      requiresEvidence: ["lab-02:foreign-object"],
      hints: [
        { level: 1, text: "Identifiers are sequential. Your own are 1042 and 1043. Try 1044.", cost: 10 },
        { level: 2, text: "When the response shows a different `customer` value, the simulation prints a flag.", cost: 20 },
        { level: 3, text: "Copy the FLAG{...} token that appears in the response panel once a foreign invoice is returned.", cost: 30 },
      ],
      learning: {
        what: "Requesting invoice 1044 as alex returns 200 OK with an invoice whose customer is jordan.",
        why: "The handler performs a lookup by identifier and returns the result without comparing the record's owner to the session identity.",
        danger: "Every customer's financial data is readable by any authenticated user, and the identifiers are trivially guessable.",
        discovery: "Take an identifier you legitimately own, then increment it. Compare the `customer` field in each response against your own session.",
        prevention: "Enforce object-level authorization on every request, scope database queries by owner, and consider opaque identifiers.",
        testing: "For a set of accounts, verify that each can only read its own objects and receives 403 for all others, including adjacent identifiers.",
      },
      code: {
        language: "http",
        vulnerable: "GET /api/invoices/1044 HTTP/1.1\nCookie: session=alex\n\nHTTP/1.1 200 OK\n\n{ \"invoice_id\": 1044, \"customer\": \"jordan\", \"amount\": 8750, \"status\": \"open\" }",
        note: "200 OK for an object the session does not own is the whole finding.",
      },
      options: [],
      flagDigest: D.L2C2,
      xp: 150,
    },
    {
      id: "L2C3",
      labId: "lab-02",
      index: 3,
      codename: "CLASSIFY",
      title: "Authentication or authorization?",
      description:
        "The session cookie is valid, so the server knows exactly who you are. Classify the failure precisely.",
      objective: "Is this an authentication problem or an authorization problem?",
      difficulty: "Medium",
      type: "multiple-choice",
      requiresEvidence: ["lab-02:foreign-object"],
      hints: [
        { level: 1, text: "The server accepted your session. What did it fail to check?", cost: 10 },
        { level: 2, text: "Authentication answers 'who are you'. Authorization answers 'what may you touch'.", cost: 20 },
        { level: 3, text: "It is authorization: the identity was proven correctly, but no permission check was performed on the object.", cost: 30 },
      ],
      learning: {
        what: "This is an authorization failure. Authentication succeeded; the server simply never checked permission.",
        why: "The two questions are separate. A valid session proves identity and says nothing about rights over a specific object.",
        danger: "Teams that fix this by improving login security never fix it, because login was never the problem.",
        discovery: "Ask whether the server identified you correctly, then ask separately whether it decided you were allowed to have this record.",
        prevention: "Perform an explicit, server-side authorization decision for every object access, and default to deny.",
        testing: "Repeat the request as an authenticated user with no rights to the object; expect 403 or 404, never 200 with data.",
      },
      code: {
        language: "text",
        vulnerable: "Authentication: session cookie is valid -> user is alex. ✓\nAuthorization: may alex read invoice 1044?   -> never asked",
        secure: "Authentication: session cookie is valid -> user is alex. ✓\nAuthorization: invoice 1044.ownerId === alex.id? -> no -> 403",
        note: "Two questions. Both need an answer.",
      },
      options: [
        { id: "authz", label: "Authorization - the identity was proven, but permission to access that specific object was never checked.", correct: true, rationale: "The session is valid; the missing decision is about rights." },
        { id: "authn", label: "Authentication - the server cannot reliably identify the user.", correct: false, rationale: "The server identified you correctly as alex." },
        { id: "both", label: "Both - the session is weak and the permissions are missing.", correct: false, rationale: "Nothing in the evidence suggests a session problem." },
        { id: "crypto", label: "Encryption - the response should have been encrypted.", correct: false, rationale: "Encryption in transit does not stop an authorized-session user reading others' data." },
      ],
      flagDigest: D.L2C3,
      xp: 200,
    },
    {
      id: "L2C4",
      labId: "lab-02",
      index: 4,
      codename: "THE FIX",
      title: "Read the handler",
      description:
        "Compare the vulnerable handler with the secure version and decide which control actually closes the finding.",
      objective: "Which change prevents the vulnerability, and why?",
      difficulty: "Hard",
      type: "multiple-choice",
      requiresEvidence: ["lab-02:foreign-object"],
      hints: [
        { level: 1, text: "The vulnerable code fetches then returns. What is missing between those two steps?", cost: 10 },
        { level: 2, text: "A check must compare the record's owner against the current session user.", cost: 20 },
        { level: 3, text: "The fix is an explicit ownership comparison that returns 403 when the owner does not match the session user.", cost: 30 },
      ],
      learning: {
        what: "The secure handler loads the invoice, then compares its ownerId to the session user's id and returns 403 on mismatch.",
        why: "Authorization has to be an explicit decision in code. Nothing about fetching an object grants the right to see it.",
        danger: "Relying on unguessable identifiers is not a fix. Identifiers leak through logs, referrers, exports and support tickets.",
        discovery: "Read the handler top to bottom and look for any comparison between the requested object and the current user.",
        prevention: "Centralize the ownership check, scope the database query by owner where possible, and return 404 where existence is itself sensitive.",
        testing: "Add negative tests per endpoint: own object returns 200, foreign object returns 403 or 404, and the response body never contains foreign data.",
      },
      code: {
        language: "text",
        vulnerable:
          "// Vulnerable: the object is fetched and returned, nothing else\nconst invoice = await getInvoice(request.params.id)\nreturn res.json(invoice)",
        secure:
          "// Secure: fetch, then make the permission decision explicitly\nconst invoice = await getInvoice(request.params.id)\nif (!invoice) return res.status(404).end()\nif (invoice.ownerId !== currentUser.id) return res.status(403).end()\nreturn res.json(invoice)",
        note: "Deny by default. Every object access is a decision, not an accident.",
      },
      options: [
        { id: "ownership", label: "Compare the record's owner to the session user and reject the request when they do not match.", correct: true, rationale: "This is the missing authorization decision." },
        { id: "requireadmin", label: "Restrict the endpoint to administrators only.", correct: false, rationale: "It would work but it breaks the feature and is not the minimal correct fix." },
        { id: "longerid", label: "Use longer, harder-to-guess identifiers.", correct: false, rationale: "Security through obscurity; identifiers still leak." },
        { id: "hidefield", label: "Remove the customer field from the response so nobody can tell whose it is.", correct: false, rationale: "The data is still disclosed; you only removed the label." },
        { id: "totp", label: "Require a second authentication factor for the request.", correct: false, rationale: "MFA strengthens authentication and does not authorize object access." },
      ],
      flagDigest: D.L2C4,
      xp: 250,
    },
    {
      id: "L2F",
      labId: "lab-02",
      index: 5,
      codename: "FINAL",
      title: "Name the missing property",
      description:
        "State the security property Northstar failed to enforce, then submit the final flag released by the assessment panel.",
      objective: "Name the missing security property and capture the final flag.",
      difficulty: "Hard",
      type: "flag",
      requiresEvidence: ["lab-02:own-invoice", "lab-02:foreign-object"],
      hints: [
        { level: 1, text: "It is not authentication. Name the check that should have run on each object.", cost: 10 },
        { level: 2, text: "The check has a name in the OWASP API Top 10: Broken Object Level Authorization.", cost: 20 },
        { level: 3, text: "The final flag is in the assessment panel. Search it for FLAG{ once you have reached a foreign object.", cost: 30 },
      ],
      learning: {
        what: "The missing property is object-level authorization: verify per request that the caller may access that specific object.",
        why: "Authentication is a platform-wide fact about the session; authorization is a per-object decision that must be written explicitly in each handler.",
        danger: "Missing object-level checks are among the most common serious API flaws, and they scale: one missing check exposes an entire collection.",
        discovery: "Enumerate identifiers belonging to other accounts and compare each response with your own.",
        prevention: "Adopt deny-by-default authorization, centralize policy in middleware or a policy layer, and add automated cross-tenant tests.",
        testing: "Run a full cross-tenant matrix for every object endpoint and every role; anything other than deny is a regression.",
      },
      code: {
        language: "text",
        vulnerable:
          "Invariant violated: the response was not conditioned on the caller's rights.\nResult: any authenticated customer can read any invoice.",
        secure:
          "Invariant enforced: for every object access, the caller identity is compared to object ownership before the response is produced.",
        note: "If you cannot state the invariant, you cannot test it.",
      },
      options: [],
      flagDigest: D.L2F,
      xp: 300,
    },
  ],
  writeUp: {
    overview:
      "Northstar's customer API returns any invoice whose identifier you ask for. Signing in works perfectly; the server simply never checks whether the signed-in customer may see the record it just fetched.",
    concept:
      "Broken object-level authorization (IDOR/BOLA) happens when a server trusts the object reference in a request. Authentication answers 'who are you'; authorization answers 'may you have this'. The first was implemented, the second was not.",
    solution:
      "As alex, /api/invoices/1042 returns alex's own invoice. Incrementing to 1044 returns 200 OK with jordan's invoice, because the handler looks the record up and returns it without comparing the record's owner to the session identity.",
    whyItWorks:
      "The authorization decision is implicit rather than explicit. Nothing in the code path asks a permission question, so the answer defaults to yes. Sequential identifiers make the objects trivial to enumerate.",
    remediation:
      "Check ownership on every object access, scope queries by owner in the data layer, use opaque identifiers as defence in depth, and return 403 or 404 consistently without leaking existence. Add automated cross-tenant tests to the pipeline.",
    realWorld:
      "IDOR is consistently among the most exploited API flaws. It needs no special tooling - a browser and a patient increment of a number - which is exactly why it is found so often and exploited so quickly.",
    flag: "FLAG{OBJECTS_NEED_AUTHORIZATION_TOO}",
  },
};


