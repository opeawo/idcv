# idcv

Verify .cv domain identity. Resolves `id-cv` TXT records and validates proofs.

## Install

```bash
pip install idcv
```

## Python API

```python
from idcv import verify, verify_many

# Single domain
result = verify("johndoe.cv")
# VerifyResult(domain='johndoe.cv', status='verified', method='linkedin', proof='johndoe', verified='2026-04-04')

# Multiple domains
results = verify_many(["johndoe.cv", "janebuilder.cv"])
```

## CLI

```bash
# Verify a domain
idcv-verify johndoe.cv
# ✓ johndoe.cv — verified via linkedin (proof: johndoe, date: 2026-04-04)

# JSON output
idcv-verify --json johndoe.cv janebuilder.cv

# Exit code: 0 if all verified, 1 if any are not
```

## Response

```python
@dataclass
class VerifyResult:
    domain: str
    status: str      # "verified" | "unverified" | "not_found" | "invalid" | "error"
    method: str      # "linkedin" | "self"
    proof: str       # LinkedIn handle or ZK proof hash
    verified: str    # ISO date
    error: str       # Error message if applicable
```

## License

MIT
