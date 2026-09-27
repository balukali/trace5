import type { Lab } from "@/lib/types";
import digests from "@/lib/data/flag-digests.json";

const D = digests as Record<string, string>;

export const lab03: Lab = {
  id: "lab-03",
  number: 3,
  title: "Echo Chamber",
  codename: "REFLECTION",
  tagline: "Reflected and stored XSS, output encoding and rendering context",
  difficulty: 3,
  difficultyLabel: "Medium",
  xpTotal: 1000,
  target: "Northstar Feedback Portal",
  brief:
    "The security team noticed that search results appear to reflect user input. Determine whether that reflection is dangerous, and explain what a browser would do with it.",
  story: [
    "Northstar's feedback portal has a product search. The results banner reads 'Search results for: <your term>', which looked harmless in every screenshot the team had seen.",
    "A security engineer noticed the term is reflected straight into the page and asked whether it is treated as data or as markup. Nobody on the team could answer, so the question came to you.",
    "Your task: establish where the input ends up, determine whether a browser would interpret it, and explain the principle that prevents the whole class of bug.",
    "Important: this is a laboratory. TRACE//5 analyses your payload and describes what a vulnerable browser would do. It never executes JavaScript you write - not in this app, not anywhere.",
  ],
  objectives: [
    "Locate where the search term appears in the response",
    "Distinguish plain text from markup in an output context",
    "Name the vulnerability class and its execution context",
    "Compare reflected and stored XSS",
    "State the defensive principle precisely",
  ],
  concepts: [
    { name: "Cross-Site Scripting", klass: "Injection", coreIdea: "Attacker input is parsed as markup or script in another user's browser.", defense: "Context-sensitive output encoding plus a strict CSP" },
    { name: "Output Encoding", klass: "Secure Development", coreIdea: "Encode untrusted values for the exact context they are rendered in.", defense: "Escape HTML, attributes, URLs, and JS contexts separately" },
    { name: "Content Security Policy", klass: "Browser Defence", coreIdea: "Restrict which script sources a page may execute.", defense: "Strict CSP with nonces, avoiding unsafe-inline" },
  ],
  terminals: ["reviews/"],
  terminal: "feedback",
  challenges: [
    {
      id: "L3C1",
      labId: "lab-03",
      index: 1,
      codename: "REFLECTION",
      title: "Find the echo",
      description:
        "Search for a normal product term and locate exactly where your input reappears in the response.",
      objective: "Where does the search term appear?",
      difficulty: "Easy",
      type: "multiple-choice",
      requiresEvidence: ["lab-03:plain-search"],
      hints: [
        { level: 1, text: "Compare the search box with the results page, word for word.", cost: 10 },
        { level: 2, text: "The term appears twice: once in the URL you sent, and once in the page you got back.", cost: 20 },
        { level: 3, text: "It is reflected into the results banner in the HTML body of the response.", cost: 30 },
      ],
      learning: {
        what: "The submitted term is echoed into the results banner in the response body, so the same value appears in the request and the response.",
        why: "Echoing user input is extremely common because it feels helpful - it confirms what you searched for.",
        danger: "Echoing is not dangerous by itself. It becomes dangerous the moment the output context treats the value as markup rather than text.",
        discovery: "Search for a distinctive string and use the request/response panels to confirm it appears in both.",
        prevention: "Encode for the output context, and treat any reflected value as untrusted until it has been encoded.",
        testing: "Submit a value containing angle brackets and confirm the response contains the encoded form, not raw markup.",
      },
      code: {
        language: "http",
        vulnerable:
          "GET /search?q=laptop HTTP/1.1\n\nHTTP/1.1 200 OK\n\n<h2>Search results for: laptop</h2>",
        note: "Reflection alone is fine. Reflection plus unencoded rendering is the bug.",
      },
      options: [
        { id: "body", label: "In the results banner inside the HTML body of the response", correct: true, rationale: "The page echoes the term back in its heading." },
        { id: "cookie", label: "In a cookie set by the server", correct: false, rationale: "No cookie carries the search term." },
        { id: "header", label: "In a response header only", correct: false, rationale: "The echo is in the body, not just a header." },
        { id: "log", label: "Only in the server log", correct: false, rationale: "The term is visible to the client, not only logged." },
      ],
      flagDigest: D.L3C1,
      xp: 100,
    },
    {
      id: "L3C2",
      labId: "lab-03",
      index: 2,
      codename: "MARKUP",
      title: "Send markup",
      description:
        "Submit HTML-like training input such as <b>test</b> and examine the render analysis. When the simulation confirms the value was interpreted as markup, capture the flag it prints.",
      objective: "Demonstrate markup interpretation and capture the flag.",
      difficulty: "Easy",
      type: "flag",
      requiresEvidence: ["lab-03:markup"],
      hints: [
        { level: 1, text: "Type a tag around a word, for example <b>test</b>, and submit.", cost: 10 },
        { level: 2, text: "The analysis panel flags the value as markup and prints a flag.", cost: 20 },
        { level: 3, text: "Copy the FLAG{...} token from the render analysis panel.", cost: 30 },
      ],
      learning: {
        what: "A value containing <b>test</b> is classified as markup: a vulnerable renderer would create a real element and the visible output would change from the literal text to formatted text.",
        why: "HTML has no out-of-band way to say 'this is text'. If a value is placed in a document without encoding, the parser treats < as the start of an element.",
        danger: "The same parser that gives you bold text will run a script tag, because markup and script share one grammar.",
        discovery: "Submit angle brackets around a word and compare the visible result with the literal text you typed.",
        prevention: "Encode the value for the HTML text context before it reaches the document, or use a templating engine that escapes by default.",
        testing: "Submit <b>, <script>, and an onerror attribute; all must appear as visible text in the response, not as structure.",
      },
      code: {
        language: "text",
        vulnerable: "banner.innerHTML = 'Search results for: ' + term\n// the parser sees <b> and builds an element",
        secure: "banner.textContent = 'Search results for: ' + term\n// the parser sees only characters; < has no special meaning",
        note: "textContent and innerHTML differ in exactly the way that matters here.",
      },
      options: [],
      flagDigest: D.L3C2,
      xp: 125,
    },
    {
      id: "L3C3",
      labId: "lab-03",
      index: 3,
      codename: "CLASSIFY",
      title: "Name the vulnerability",
      description:
        "Identify the class of vulnerability the simulation has demonstrated and the condition that makes it exploitable.",
      objective: "Which vulnerability class is this, and what makes it exploitable?",
      difficulty: "Medium",
      type: "multiple-choice",
      requiresEvidence: ["lab-03:markup"],
      hints: [
        { level: 1, text: "Think about what the browser does with the value, not about what the server does.", cost: 10 },
        { level: 2, text: "The payload runs in another user's session, in their browser, without going through the server's validation.", cost: 20 },
        { level: 3, text: "It is cross-site scripting, and it is exploitable because untrusted input reaches an HTML rendering context unencoded.", cost: 30 },
      ],
      learning: {
        what: "This is cross-site scripting. It is exploitable because attacker-controlled data reaches an HTML rendering context without being encoded for that context.",
        why: "The browser cannot tell your markup from the application's markup. Same parser, same document, same trust.",
        danger: "Script running in another user's origin can read their page, act as them, and exfiltrate data - with no server-side bug at all.",
        discovery: "Look for any place where input is written into a document, an attribute, a URL or a script context without encoding.",
        prevention: "Encode per context, use safe DOM APIs, sanitize where HTML is genuinely required, and deploy a strict CSP as a second layer.",
        testing: "Run an XSS payload set against every reflected and stored field, in every encoding context present in the application.",
      },
      code: {
        language: "text",
        vulnerable:
          "Vulnerable renderer:\n  element.innerHTML = userInput\n  <script>...</script> would execute",
        secure:
          "Safe renderer:\n  element.textContent = userInput\n  // or server-side: htmlspecialchars(userInput)",
        note: "Encoding is the fix. Sanitizing is a fallback. CSP is the seatbelt.",
      },
      options: [
        { id: "xss", label: "Cross-site scripting - untrusted input is rendered as markup, so it executes in another user's browser context.", correct: true, rationale: "The value is parsed as markup in the victim's browser." },
        { id: "sqli", label: "SQL injection - the input is concatenated into a database query.", correct: false, rationale: "No database query is involved in this rendering path." },
        { id: "ssrf", label: "Server-side request forgery - the server is tricked into making a request.", correct: false, rationale: "The server is not making requests on the attacker's behalf." },
        { id: "csrf", label: "Cross-site request forgery - the user is tricked into making an authenticated request.", correct: false, rationale: "No forged state-changing request is involved." },
      ],
      flagDigest: D.L3C3,
      xp: 150,
    },
    {
      id: "L3C4",
      labId: "lab-03",
      index: 4,
      codename: "ENCODING",
      title: "Encode for the context",
      description:
        "Select every statement that correctly describes the defensive behaviour, then capture the flag released by the encoder panel.",
      objective: "Which statements describe correct output-encoding practice?",
      difficulty: "Hard",
      type: "multiple-answer",
      requiresEvidence: ["lab-03:markup", "lab-03:encoder"],
      hints: [
        { level: 1, text: "Encoding is not one function. Ask where in the document the value will land.", cost: 10 },
        { level: 2, text: "HTML text, HTML attributes, URLs, CSS and JavaScript are five different contexts with five different encodings.", cost: 20 },
        { level: 3, text: "Correct set: encode per context, prefer safe DOM APIs, and keep a strict CSP as defence in depth. Input validation and a WAF are not the fix.", cost: 30 },
      ],
      learning: {
        what: "Correct practice is context-sensitive encoding plus safe DOM APIs, backed by a strict Content Security Policy.",
        why: "Encoding is context-dependent because the same characters mean different things in different parts of a document.",
        danger: "Encoding the wrong context gives a false sense of safety: HTML-encoded text inside a script block is still dangerous.",
        discovery: "Identify where in the document each untrusted value is written, then check whether the encoding matches that position.",
        prevention: "Escape by default in the template engine, use textContent instead of innerHTML, sanitize rich text with a maintained library, and deploy a nonce-based CSP.",
        testing: "For each context present, submit a payload specific to that context and confirm it renders as inert text.",
      },
      code: {
        language: "text",
        vulnerable: "// one encoding for every context - wrong in five different ways\nconst out = `<div>${escapeHTML(userInput)}</div>`\ndocument.querySelector('#panel').innerHTML = out",
        secure: "// let the framework escape, and pick the API that treats the value as text\n<div>{userInput}</div>            // React escapes by default\nel.textContent = userInput      // DOM treats it as characters",
        note: "React, Vue and Angular escape by default. The bug is usually one deliberate bypass of that behaviour.",
      },
      options: [
        { id: "context", label: "Encode for the specific context the value is rendered in (HTML text, attribute, URL, JS, CSS).", correct: true },
        { id: "apis", label: "Prefer safe DOM APIs such as textContent over innerHTML.", correct: true },
        { id: "csp", label: "Keep a strict Content Security Policy as a second layer of defence.", correct: true },
        { id: "validate", label: "Rely on input validation to strip dangerous characters before rendering.", correct: false },
        { id: "waf", label: "Rely on a web application firewall to block XSS payloads.", correct: false },
        { id: "secret", label: "Rely on the value being non-sensitive, so rendering it is harmless.", correct: false },
      ],
      flagDigest: D.L3C4,
      xp: 175,
    },
    {
      id: "L3C5",
      labId: "lab-03",
      index: 5,
      codename: "PERSISTENCE",
      title: "Reflected vs stored",
      description:
        "Open the stored review panel. A review submitted earlier is rendered for every visitor. Decide how this differs from the search reflection, then capture the flag the panel prints.",
      objective: "Explain how stored XSS differs from reflected XSS, then capture the flag.",
      difficulty: "Hard",
      type: "flag",
      requiresEvidence: ["lab-03:stored-view"],
      hints: [
        { level: 1, text: "Ask how many people see the payload, and how many requests an attacker needs.", cost: 10 },
        { level: 2, text: "Reflected needs the victim to open a crafted link. Stored needs only one submission.", cost: 20 },
        { level: 3, text: "The panel prints a flag describing persistence. Copy the FLAG{...} token.", cost: 30 },
      ],
      learning: {
        what: "Reflected XSS returns the payload in the same response that carries it. Stored XSS saves the payload and serves it to every later visitor.",
        why: "Storage turns a per-victim attack into an audience-wide one, and the payload keeps working after the attacker has gone.",
        danger: "A stored payload can reach every visitor of a popular page, including staff who review content, and it survives until the data is cleaned.",
        discovery: "Submit a payload, then load a page that displays previously submitted content.",
        prevention: "Encode on output as with reflected XSS, sanitize on input for rich text, and moderate user content before publication.",
        testing: "Submit a payload, then verify every rendering path of that content - lists, detail pages, emails, exports - escapes it.",
      },
      code: {
        language: "text",
        vulnerable:
          "reflected: request  ->  response contains the payload\nstored:    submit    ->  database  ->  every later response contains the payload",
        secure:
          "Both are fixed by the same rule: encode at render time, in the context you are rendering into.",
        note: "Stored payloads survive your patch window. Clean the data too.",
      },
      options: [],
      flagDigest: D.L3C5,
      xp: 200,
    },
    {
      id: "L3F",
      labId: "lab-03",
      index: 6,
      codename: "FINAL",
      title: "State the principle",
      description:
        "Write the one rule that prevents this entire class of bug, then submit the final flag from the assessment panel.",
      objective: "State the fundamental defensive principle and capture the final flag.",
      difficulty: "Expert",
      type: "flag",
      requiresEvidence: ["lab-03:markup", "lab-03:stored-view", "lab-03:encoder"],
      hints: [
        { level: 1, text: "Every fix in this lab is an instance of the same rule. What is it?", cost: 10 },
        { level: 2, text: "It has two halves: what input is, and what happens to it before it is rendered.", cost: 20 },
        { level: 3, text: "The final flag is in the assessment panel. Search it for FLAG{ after viewing the encoder and stored panels.", cost: 30 },
      ],
      learning: {
        what: "Treat untrusted input as data, and encode it appropriately for its context before rendering it.",
        why: "Browsers execute markup, not intentions. Encoding is what turns a value back into data at the moment it becomes output.",
        danger: "Any application that renders untrusted input without encoding has an XSS bug waiting for someone to notice.",
        discovery: "Audit every sink - innerHTML, document.write, template interpolation, attribute values, inline handlers - and trace back to the sources.",
        prevention: "Escape by default, use safe APIs, sanitize where rich text is required, and enforce a strict CSP as a second layer.",
        testing: "Keep a regression suite of payloads per context and run it on every build, not once before release.",
      },
      code: {
        language: "text",
        vulnerable: "input is code  ->  the browser runs it",
        secure: "input is data  ->  encoded for its context  ->  the browser displays it",
        note: "Break it. Understand it. Fix it.",
      },
      options: [],
      flagDigest: D.L3F,
      xp: 250,
    },
  ],
  writeUp: {
    overview:
      "Northstar's feedback portal takes a search term and places it into the results page without encoding it. A term containing HTML is not displayed - it is parsed. Because stored reviews use the same rendering path, one malicious review would run in every visitor's browser.",
    concept:
      "Cross-site scripting occurs when data crosses into a context that gives it meaning - the HTML parser, an attribute, or a script block. Encoding is the boundary that keeps data on the data side of that line.",
    solution:
      "Submitting <b>test</b> changes the rendered output, proving the value was interpreted as markup rather than displayed as text. The stored review panel shows the same weakness with a payload that persists in the database and is served to every later visitor. TRACE//5 classifies these payloads without ever executing them.",
    whyItWorks:
      "The rendering path treats application markup and user data as the same kind of thing. Once a value is concatenated into HTML, the parser has no way to know which characters the author intended as structure.",
    remediation:
      "Escape output for the specific context, use textContent rather than innerHTML, keep a strict nonce-based Content Security Policy, sanitize rich text on input with a maintained library, and moderate user-submitted content before publication.",
    realWorld:
      "XSS remains one of the most common web vulnerabilities because it needs no server-side flaw at all - just one place where a value is rendered without encoding. It is also the basis of many higher-impact attacks such as session theft and phishing in the victim's own origin.",
    flag: "FLAG{ESCAPE_OUTPUT_NOT_TRUST}",
  },
};
