"""idcv — Verify .cv domain identity via DNS TXT records."""

from .verify import verify, verify_many, parse_record

__version__ = "0.1.0"
__all__ = ["verify", "verify_many", "parse_record"]
