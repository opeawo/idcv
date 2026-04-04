"""Core verification logic for id-cv TXT records."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Optional

import dns.resolver

ID_CV_PREFIX = "id-cv="


@dataclass
class VerifyResult:
    domain: str
    status: str  # "verified" | "unverified" | "not_found" | "invalid" | "error"
    method: Optional[str] = None
    proof: Optional[str] = None
    verified: Optional[str] = None
    error: Optional[str] = None

    def to_dict(self) -> dict:
        d = {"domain": self.domain, "status": self.status}
        if self.method:
            d["method"] = self.method
        if self.proof:
            d["proof"] = self.proof
        if self.verified:
            d["verified"] = self.verified
        if self.error:
            d["error"] = self.error
        return d


def parse_record(record: str) -> Optional[dict]:
    """Parse an id-cv TXT record value.

    Format: id-cv=method:proof|date
    """
    if not record.startswith(ID_CV_PREFIX):
        return None

    payload = record[len(ID_CV_PREFIX):]
    pipe_idx = payload.rfind("|")
    if pipe_idx == -1:
        return None

    method_proof = payload[:pipe_idx]
    date = payload[pipe_idx + 1:]

    colon_idx = method_proof.find(":")
    if colon_idx == -1:
        return None

    method = method_proof[:colon_idx]
    proof = method_proof[colon_idx + 1:]

    if not method or not proof or not date:
        return None

    return {"method": method, "proof": proof, "verified": date}


def verify(domain: str) -> VerifyResult:
    """Verify a .cv domain by resolving its id-cv TXT record."""
    if not domain or not domain.endswith(".cv"):
        return VerifyResult(domain=domain, status="invalid", error="Domain must end with .cv")

    try:
        answers = dns.resolver.resolve(domain, "TXT")
    except dns.resolver.NXDOMAIN:
        return VerifyResult(domain=domain, status="not_found")
    except dns.resolver.NoAnswer:
        return VerifyResult(domain=domain, status="unverified")
    except Exception as e:
        return VerifyResult(domain=domain, status="error", error=str(e))

    for rdata in answers:
        txt = b"".join(rdata.strings).decode("utf-8", errors="replace")
        if txt.startswith(ID_CV_PREFIX):
            parsed = parse_record(txt)
            if parsed:
                return VerifyResult(
                    domain=domain,
                    status="verified",
                    method=parsed["method"],
                    proof=parsed["proof"],
                    verified=parsed["verified"],
                )

    return VerifyResult(domain=domain, status="unverified")


def verify_many(domains: list[str]) -> list[VerifyResult]:
    """Verify multiple domains."""
    return [verify(d) for d in domains]
