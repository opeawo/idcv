# @idcv/verify

Verify .cv domain identity. Resolves `id-cv` TXT records and validates proofs.

## Install

```bash
npm install @idcv/verify
```

## Usage

```js
const { verify, verifyMany } = require("@idcv/verify");

// Single domain
const result = await verify("johndoe.cv");
// { domain: "johndoe.cv", status: "verified", method: "linkedin", proof: "johndoe", verified: "2026-04-04" }

// Multiple domains
const results = await verifyMany(["johndoe.cv", "janebuilder.cv"]);
```

## API

### `verify(domain: string): Promise<VerifyResult>`

Resolves the `id-cv` TXT record for a `.cv` domain and returns verification status.

### `verifyMany(domains: string[]): Promise<VerifyResult[]>`

Verify multiple domains in parallel.

### `parseRecord(record: string): ParsedRecord | null`

Parse a raw `id-cv` TXT record value.

## Response

```ts
interface VerifyResult {
  domain: string;
  status: "verified" | "unverified" | "not_found" | "invalid" | "error";
  method?: string;   // "linkedin" | "self"
  proof?: string;    // LinkedIn handle or ZK proof hash
  verified?: string; // ISO date
  error?: string;
}
```

## License

MIT
