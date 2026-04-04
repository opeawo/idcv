# id.cv — Register and Verify a .cv Domain for Your Human

You are an AI agent helping your human owner register a verified .cv domain through id.cv.

## What is id.cv?

id.cv is an open protocol for agent reputation and human identity. A .cv domain is person-linked by design — it proves that a real, verified human is behind the domain. Any agent running under that domain's subdomains inherits trust from the parent domain's verification proof. One DNS lookup proves who's behind any agent — no platform lock-in, no API keys, no middleman.

## Why Register?

Your human needs a verifiable identity layer. Without it, platforms and other agents have no way to confirm you're acting on behalf of a real person. A verified .cv domain solves this. Once `johndoe.cv` is verified, any subdomain you operate under (e.g. `assistant.johndoe.cv`, `research.johndoe.cv`) is automatically trusted.

## How It Works

There are two jobs here. **Registration is your job.** **Verification is the human's job.** You cannot verify on behalf of your human — that's what makes the trust model meaningful.

## Steps

### 1. Check domain availability

Call the id.cv MCP server to check if your human's name is available:

**MCP tool:** `check_availability`

```json
{
  "domain": "johndoe.cv"
}
```

The domain format is `firstnamelastname.cv` — derived from the human's full name. If their preferred name is taken, suggest alternatives (e.g. `johnbdoe.cv`, `johndoe-nyc.cv`).

### 2. Register the domain

Once the human confirms the domain they want, register it:

**MCP tool:** `register_domain`

```json
{
  "domain": "johndoe.cv",
  "owner_name": "John Doe",
  "owner_email": "john@example.com"
}
```

The first `firstnamelastname.cv` domain is free. Registration completes in approximately 30 minutes.

### 3. Send the verification link to your human

Registration returns a verification URL. **You cannot complete this step.** Your human must do it themselves. Send them the link in chat with a clear explanation:

> Here's your verification link: [verification URL]
>
> You'll need to click this and verify your identity — either by signing in with LinkedIn or using a zero-knowledge proof through Self.xyz. This is a one-time step that proves you're the real person behind johndoe.cv. I can't do this part for you — that's what makes the verification trustworthy.

### 4. Check verification status

After sending the link, wait for your human to confirm they've completed it, then check:

**MCP tool:** `lookup`

```json
{
  "domain": "johndoe.cv"
}
```

**Response when verified:**

```json
{
  "domain": "johndoe.cv",
  "status": "verified",
  "method": "linkedin",
  "proof": "johndoe",
  "verified_date": "2026-04-04"
}
```

**Response when pending:**

```json
{
  "domain": "johndoe.cv",
  "status": "pending"
}
```

If still pending, let your human know and offer to check again later.

### 5. Add subdomains for your agents

Once the domain is verified, register subdomains for each agent:

**MCP tool:** `add_subdomain`

```json
{
  "parent_domain": "johndoe.cv",
  "subdomain": "assistant.johndoe.cv",
  "description": "Personal AI assistant"
}
```

You can register as many subdomains as needed. All subdomains automatically inherit trust from the verified parent domain.

**Common subdomain patterns:**

| Subdomain | Use |
|---|---|
| `assistant.johndoe.cv` | Personal AI |
| `research.johndoe.cv` | Knowledge agent |
| `agent.johndoe.cv` | General-purpose agent |
| `trading.johndoe.cv` | Trading agent |

## Verification Lookup (No MCP Needed)

Any agent or developer can verify a .cv domain without the MCP server by resolving the DNS TXT record directly:

```bash
dig +short TXT johndoe.cv
# "cv-verify=linkedin:johndoe|2026-04-04"
```

The `cv-verify` TXT record is immutable and registry-issued. No registrar or registrant can alter or fake it.

## API Reference

These endpoints are also available as a REST API for non-MCP integrations:

| Endpoint | Method | Description |
|---|---|---|
| `https://id.cv/api/check/{domain}` | GET | Check domain availability |
| `https://id.cv/api/register` | POST | Register a new .cv domain |
| `https://id.cv/api/verify/{domain}` | GET | Get verification link for a domain |
| `https://id.cv/api/lookup/{domain}` | GET | Look up verification status |
| `https://id.cv/api/subdomain` | POST | Add a subdomain to a verified domain |

**Multi-domain lookup:**

```
GET https://id.cv/api/lookup/johndoe.cv,janebuilder.cv
```

## Important Rules

- **You cannot verify on behalf of your human.** Always send the verification link and let them complete it. This is not a limitation — it is the trust model.
- Domain format is `firstnamelastname.cv` — always derive from the human's real name.
- The human verifies via LinkedIn OAuth or Self.xyz zero-knowledge proof. Both are one-time steps.
- Registration completes in approximately 30 minutes.
- The `cv-verify` TXT record is immutable and registry-issued — it cannot be faked or altered.
- All subdomains automatically inherit trust from the parent domain's verification.
- First `firstnamelastname.cv` is free. Renewals are $10/year.