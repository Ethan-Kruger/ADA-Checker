# ADA Checker REST API

Run WCAG accessibility checks programmatically from your own tools, CI pipelines, or applications.

## Authentication

All requests must include an API key in the `Authorization` header:

```
Authorization: Bearer ada_sk_<your-key>
```

Generate keys in **Settings → API Access** (requires Pro or Enterprise plan).

---

## Error envelope

All error responses share the same shape:

```json
{ "error": "Human-readable message", "code": "MACHINE_CODE" }
```

| Code | Meaning |
|------|---------|
| `UNAUTHORIZED` | Missing, invalid, or expired credentials |
| `FORBIDDEN` | Authenticated but plan does not allow this action |
| `BAD_REQUEST` | Missing or invalid fields in the request body |
| `NOT_FOUND` | Resource does not exist |
| `RATE_LIMITED` | Too many requests — slow down |
| `LIMIT_REACHED` | Free-tier check quota exhausted for this window |
| `KEY_LIMIT_REACHED` | Max 5 API keys per account |
| `LOCKED` | Account temporarily locked after too many failed logins |
| `CONFLICT` | Resource already exists (e.g. email already registered) |
| `SERVER_ERROR` | Unexpected server-side failure |

---

## Rate-limit headers

Every `/api/check/run` response includes:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Max requests allowed in the window (`unlimited` for Pro/Enterprise) |
| `X-RateLimit-Remaining` | Requests remaining in the current window |
| `X-RateLimit-Reset` | Unix timestamp (seconds) when the window resets |

---

## Public API (Pro+)

### `POST /api/v1/check`

Run an accessibility check on an HTML string.

#### Request

```http
POST /api/v1/check
Authorization: Bearer ada_sk_…
Content-Type: application/json
```

```json
{
  "html": "<!DOCTYPE html><html>…</html>",
  "level": "AA",
  "threshold": 80
}
```

| Field       | Type   | Required | Default | Description |
|-------------|--------|----------|---------|-------------|
| `html`      | string | yes      | —       | Full HTML to check (max 5 MB) |
| `level`     | string | no       | `"AA"`  | WCAG level: `"A"`, `"AA"`, or `"AAA"` |
| `threshold` | number | no       | `80`    | Minimum passing score 0–100 |

#### Response `200 OK`

```json
{
  "score": 82,
  "level": "AA",
  "passed": true,
  "threshold": 80,
  "summary": {
    "total": 2,
    "critical": 0,
    "serious": 1,
    "moderate": 1,
    "minor": 0
  },
  "violations": [
    {
      "ruleId": "img-alt-missing",
      "severity": "critical",
      "message": "Image missing alt text",
      "element": "<img src=\"banner.png\">",
      "remediation": "Add a descriptive alt attribute.",
      "wcag": "1.1.1 Non-text Content (Level A)"
    }
  ]
}
```

#### Error responses

| Status | Code | Meaning |
|--------|------|---------|
| `400`  | `BAD_REQUEST` | Missing or invalid fields |
| `401`  | `UNAUTHORIZED` | Missing or invalid API key |
| `403`  | `FORBIDDEN` | Plan does not include API access |
| `429`  | `RATE_LIMITED` | Rate limit exceeded |

---

### `GET /api/v1/keys`

List your API keys (prefix, name, last used). Requires session cookie.

```http
GET /api/v1/keys
Cookie: ada-token=<jwt>
```

#### Response `200 OK`

```json
{
  "keys": [
    { "id": "uuid", "key_prefix": "ada_sk_abc123", "name": "CI pipeline", "created_at": "…", "last_used_at": "…" }
  ]
}
```

---

### `POST /api/v1/keys`

Generate a new API key. The full key is returned **once** — store it securely.

```http
POST /api/v1/keys
Content-Type: application/json
Cookie: ada-token=<jwt>

{ "name": "CI pipeline" }
```

#### Response `201 Created`

```json
{ "id": "uuid", "key_prefix": "ada_sk_abc123", "name": "CI pipeline", "created_at": "…", "key": "ada_sk_<full-key>" }
```

Maximum 5 keys per account. Returns `KEY_LIMIT_REACHED` if exceeded.

---

### `DELETE /api/v1/keys/:id`

Revoke a key. The key stops working immediately.

```http
DELETE /api/v1/keys/uuid
Cookie: ada-token=<jwt>
```

Response `200 OK`: `{ "ok": true }`

---

## Auth routes (internal)

### `POST /api/auth/login`

```json
{ "email": "user@example.com", "password": "…" }
```

Response sets an `httpOnly` cookie. Body: `{ "user": { "id", "email" }, "plan": "free" }`

Rate limited to 10 attempts/minute per IP. Account locks after 10 consecutive failures (`LOCKED`, 15-minute cooldown).

### `GET /api/auth/me`

Returns current user and plan. Requires session cookie. Used by the client to sync plan on page load.

### `POST /api/auth/logout`

Clears the session cookie. Response: `{ "ok": true }`

### `POST /api/auth/signup`

Same shape as login. Creates user + free subscription row.

### `POST /api/auth/change-password`

```json
{ "currentPassword": "…", "newPassword": "…" }
```

Increments `token_version` — invalidates all existing sessions on other devices.

---

## Billing routes (internal)

### `POST /api/stripe/checkout`

```json
{ "plan": "pro" }
```

Returns `{ "url": "https://checkout.stripe.com/…" }`. Redirect the user there to complete payment.

### `POST /api/stripe/webhook`

Stripe webhook receiver. Handles:
- `invoice.payment_succeeded` → upgrade plan
- `invoice.payment_failed` → set `past_due`
- `customer.subscription.deleted` → downgrade to free
- `customer.subscription.updated` → plan change / renewal

### `GET /api/billing/invoices`

Returns up to 24 past invoices from Stripe.

---

## Rate limits

| Plan       | UI checks | API requests/hour |
|------------|-----------|-------------------|
| Free       | 10 / 4 hr | Not available     |
| Pro        | Unlimited | 60                |
| Enterprise | Unlimited | 1 000             |

---

## Versioning

The public API lives under `/api/v1/`. Breaking changes will be introduced under a new version prefix (`/api/v2/`) — `/api/v1/` will not silently change shape after v1.0 stable.

---

## Example — cURL

```bash
curl https://your-app.vercel.app/api/v1/check \
  -H "Authorization: Bearer ada_sk_…" \
  -H "Content-Type: application/json" \
  -d '{"html":"<img src=test.png>","level":"AA"}'
```

## Example — Node.js

```js
const res = await fetch('https://your-app.vercel.app/api/v1/check', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ada_sk_…',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ html: '<img src="test.png">', level: 'AA' }),
});
const { score, passed, violations } = await res.json();
```
