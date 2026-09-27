/**
 * LAB 02 SIMULATOR - simulated customer portal invoice API.
 *
 * SECURITY: all records are fictional literals held in this module. There is
 * no database, no ORM and no live HTTP call. The learner is authenticated as
 * "alex" for the whole exercise.
 */

import { INVOICES } from "./terminal-data";

export const SESSION_USER = "alex";

export interface InvoiceRecord {
  invoice_id: number;
  customer: string;
  amount: number;
  status: string;
}

export interface InvoiceResponse {
  requestLine: string;
  status: number;
  statusText: string;
  body: string;
  record?: InvoiceRecord;
  owned: boolean;
  observations: string[];
  finding?: "idor";
}

function isNumeric(v: string) {
  return /^\d{1,9}$/.test(v.trim());
}

/** Replays a simulated GET /api/invoices/:id request. */
export function simulateInvoiceRequest(rawId: string): InvoiceResponse {
  const id = rawId.trim();
  const requestLine = `GET /api/invoices/${id || "<empty>"}`;

  if (!id) {
    return {
      requestLine,
      status: 400,
      statusText: "Bad Request",
      body: JSON.stringify({ error: "invoice_id is required" }, null, 2),
      owned: false,
      observations: ["The endpoint requires an object identifier."],
    };
  }

  if (!isNumeric(id)) {
    return {
      requestLine,
      status: 404,
      statusText: "Not Found",
      body: JSON.stringify({ error: "invoice not found" }, null, 2),
      owned: false,
      observations: ["Non-numeric identifiers are rejected before any lookup."],
    };
  }

  const record = INVOICES.find((i) => String(i.invoice_id) === String(Number(id)));

  if (!record) {
    return {
      requestLine,
      status: 404,
      statusText: "Not Found",
      body: JSON.stringify({ error: "invoice not found" }, null, 2),
      owned: false,
      observations: [
        "The identifier space is dense and predictable: 1042, 1043, 1044 ...",
        "No rate limiting or ownership error is visible here.",
      ],
    };
  }

  const owned = record.customer === SESSION_USER;

  return {
    requestLine,
    status: 200,
    statusText: "OK",
    record,
    owned,
    finding: owned ? undefined : "idor",
    body: JSON.stringify(
      {
        invoice_id: record.invoice_id,
        customer: record.customer,
        amount: record.amount,
        status: record.status,
      },
      null,
      2,
    ),
    observations: owned
      ? [
          `This invoice belongs to the signed-in customer (${SESSION_USER}).`,
          "The response contains a `customer` field - that is the field a correct check should compare.",
        ]
      : [
          `This invoice belongs to "${record.customer}", but the request was made by "${SESSION_USER}".`,
          "The API returned 200 OK with another customer's object.",
          "No ownership comparison happened between the session identity and the record owner.",
        ],
  };
}

export const INVOICE_ID_SUGGESTIONS = ["1042", "1043", "1044", "1045", "1046"];
