# ADA Checker REST API

Run WCAG accessibility checks programmatically from your own tools, CI pipelines, or applications.

## Authentication

All requests must include an API key in the `Authorization` header:

```
Authorization: Bearer ada_sk_<your-key>
```

Generate keys in **Settings → API Access** (requires Pro or Enterprise plan).

---

## Endpoints

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

| Status | Meaning |
|--------|---------|
| `400`  | Missing or invalid fields (`"html"` required, `level` must be A/AA/AAA) |
| `401`  | Missing or invalid API key |
| `403`  | Plan does not include API access |
| `429`  | Rate limit exceeded |

---

### `GET /api/v1/keys`

List your API keys (prefix, name, last used).

```http
GET /api/v1/keys
Authorization: Bearer <session-cookie-or-jwt>
```

### `POST /api/v1/keys`

Generate a new API key.

```http
POST /api/v1/keys
Content-Type: application/json

{ "name": "CI pipeline" }
```

The full key is returned **once** — store it securely. Maximum 5 keys per account.

### `DELETE /api/v1/keys/:id`

Revoke a key. The key stops working immediately.

---

## Rate limits

| Plan       | Requests/hour |
|------------|---------------|
| Free       | Not available |
| Pro        | 60            |
| Enterprise | 1 000         |

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
