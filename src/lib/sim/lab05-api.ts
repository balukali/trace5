/**
 * LAB 05 SIMULATOR - simulated Northstar Customer API.
 *
 * SECURITY: everything is canned JSON held in this module. No fetch, no real
 * service, no database. The learner inspects predefined responses and submits
 * a written report; the report is checked for key concepts with substring
 * matching in the CTF engine.
 */

import { z } from "zod";

export interface ApiCall {
  id: string;
  method: "GET" | "POST" | "PATCH";
  path: string;
  requestBody?: string;
  status: number;
  response: string;
  note: string;
}

const SESSION_USER = { id: 1021, name: "Alex" };

export const PROFILE_RESPONSE = `{
  "id": 1021,
  "name": "Alex",
  "email": "alex@example.test",
  "role": "customer",
  "internalRiskScore": 17,
  "supportNote": "Prefers email",
  "warehouse": "BLR-02"
}`;

export const PROFILE_MINIMAL = `{
  "id": 1021,
  "name": "Alex",
  "email": "alex@example.test"
}`;

export const INTERNAL_FIELDS = ["internalRiskScore", "supportNote", "warehouse"] as const;

export const ORDERS: Record<number, { id: number; owner: string; ownerId: number; total: number; items: number }> = {
  1021: { id: 1021, owner: "alex", ownerId: 1021, total: 219.0, items: 2 },
  1022: { id: 1022, owner: "priya", ownerId: 1022, total: 1899.5, items: 5 },
  1023: { id: 1023, owner: "dev-team", ownerId: 1023, total: 74.25, items: 1 },
  1024: { id: 1024, owner: "sam", ownerId: 1024, total: 450.0, items: 3 },
  1025: { id: 1025, owner: "riley", ownerId: 1025, total: 19.99, items: 1 },
  1026: { id: 1026, owner: "ops", ownerId: 1026, total: 3200.0, items: 12 },
};

export function getOrder(idInput: string): {
  status: number;
  body: string;
  record?: (typeof ORDERS)[number];
  owned: boolean;
  observations: string[];
} {
  const trimmed = idInput.trim();
  if (!/^\d{3,6}$/.test(trimmed)) {
    return {
      status: 404,
      body: JSON.stringify({ error: "order not found" }, null, 2),
      owned: false,
      observations: ["Identifiers are sequential integers - easy to guess."],
    };
  }
  const record = ORDERS[Number(trimmed)];
  if (!record) {
    return {
      status: 404,
      body: JSON.stringify({ error: "order not found" }, null, 2),
      owned: false,
      observations: ["The identifier was in range but no order exists at that position."],
    };
  }
  const owned = record.ownerId === SESSION_USER.id;
  return {
    status: 200,
    body: JSON.stringify(record, null, 2),
    record,
    owned,
    observations: owned
      ? ["This order belongs to the signed-in customer."]
      : [
          `This order belongs to "${record.owner}" (id ${record.ownerId}); the session is user 1021.`,
          "200 OK was returned for another customer's order - no ownership check ran.",
        ],
  };
}

export const PATCH_UI_BODY = `{
  "name": "Alex",
  "email": "alex@example.test"
}`;

export const PATCH_SENT_BODY = `{
  "name": "Alex",
  "email": "alex@example.test",
  "role": "admin"
}`;

export const PATCH_RESPONSE = `{
  "ok": true,
  "applied": ["name", "email", "role"],
  "note": "role accepted from the request body even though the UI never sends it"
}`;

export const RATE_LIMIT_LOG = [
  "09:41:02.114  GET /api/orders/1021  200",
  "09:41:02.198  GET /api/orders/1022  200",
  "09:41:02.281  GET /api/orders/1023  200",
  "09:41:02.366  GET /api/orders/1024  200",
  "09:41:02.451  GET /api/orders/1025  200",
  "09:41:02.537  GET /api/orders/1026  200",
  "09:41:02.622  GET /api/orders/1027  404",
  "09:41:02.708  GET /api/orders/1028  404",
  "...",
  "09:41:12.001  100 requests in 10.0s from 203.0.113.44 - no 429 emitted, no lockout",
].join("\n");

export const NETWORK_REQUESTS: ApiCall[] = [
  {
    id: "n1",
    method: "GET",
    path: "/api/profile",
    status: 200,
    response: PROFILE_RESPONSE,
    note: "The dashboard renders name and email. The response carries more than that.",
  },
  {
    id: "n2",
    method: "GET",
    path: "/api/orders",
    status: 200,
    response: JSON.stringify({ orders: [1021], count: 1 }, null, 2),
    note: "The list endpoint only returns the caller's own order.",
  },
  {
    id: "n3",
    method: "GET",
    path: "/api/notifications",
    status: 200,
    response: JSON.stringify({ notifications: [] }, null, 2),
    note: "Polled every 30 seconds by the frontend.",
  },
];

export const EVIDENCE_CHAIN = [
  "1. API exposes internal fields",
  "2. Order identifiers are predictable",
  "3. Object authorization is weak",
  "4. Profile accepts unintended fields",
  "5. API has weak request throttling",
];

/** Zod validates the *shape* of the learner's report, never its content as code. */
export const incidentReportSchema = z.object({
  rootCause: z.string().min(1),
  impact: z.string().min(1),
  component: z.string().min(1),
  remediation: z.string().min(1),
});

export const RATE_LIMIT_GUIDANCE = [
  "Per-user and per-token quotas on sensitive endpoints.",
  "Stricter limits on authentication and password-reset paths.",
  "IP-based limits as a secondary signal, not the only control (proxies and NAT break them).",
  "Quota accounting plus alerting on repeated enumeration patterns.",
  "Rate limiting raises cost for an attacker; it is not a substitute for authorization.",
];
