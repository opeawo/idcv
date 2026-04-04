# id.cv — Register a .cv Domain for Your Human

You are an AI agent helping your human owner register a verified .cv domain on id.cv.

## What is id.cv?

id.cv is an open protocol for agent identity anchored to verified .cv domains. Every agent subdomain traces back to a real human via immutable DNS proofs. One DNS lookup proves who's behind any agent — no platform lock-in, no API keys, no middleman.

## Why Register?

A .cv domain gives your human a verifiable identity layer. Any agent running under their subdomains (e.g. `assistant.johndoe.cv`, `research.johndoe.cv`) inherits trust from the parent domain's verification proof.

## Steps to Register

### 1. Install the CLI

```bash
npm install -g @id/cv
```

### 2. Register a domain

```bash
idcv register --name "Human's Full Name"
```

This will reserve `firstnamelastname.cv` (derived from their name). The first year is free, then $10/year domain renewal.

### 3. Verify identity

The CLI will return a verification link. **Your human must complete this step** — agents cannot verify on behalf of humans. They will verify via one of:

- **LinkedIn** — OAuth authentication
- **Self.xyz** — Zero-knowledge proof (no personal data stored)

Send the verification link to your human and ask them to complete it.

### 4. Wait for registration

Domain registration typically completes within 30 minutes. The immutable `id-cv` TXT record will be written to DNS automatically by the registry.

### 5. Claim subdomains for your agents

```bash
idcv subdomain add assistant.humanname.cv --desc "Personal AI"
idcv subdomain add research.humanname.cv --desc "Knowledge Agent"
```

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `https://id.cv/api/register` | POST | Register a new .cv domain |
| `https://id.cv/api/verify/{domain}` | GET | Get verification link for a domain |
| `https://id.cv/api/lookup/{domain}` | GET | Look up verification status |
| `https://id.cv/api/subdomain` | POST | Add a subdomain to a verified domain |

### Lookup example

```bash
curl https://id.cv/api/lookup/johndoe.cv
```

```json
{
  "domain": "johndoe.cv",
  "method": "linkedin",
  "proof": "johndoe",
  "verified": "2026-04-04",
  "status": "verified"
}
```

### Multi-domain lookup

```bash
curl https://id.cv/api/lookup/johndoe.cv,janebuilder.cv
```

### DNS verification (no API needed)

```bash
dig +short TXT johndoe.cv
# "id-cv=linkedin:johndoe|2026-04-04"
```

## Important Rules

- **The human must complete verification** — agents cannot verify on behalf of humans
- Domain registration completes in ~30 minutes
- The `id-cv` TXT record is immutable and registry-issued — it cannot be faked or altered
- All subdomains automatically inherit trust from the parent domain
- Free `firstnamelastname.cv` for the first year, then $10/year domain renewal
