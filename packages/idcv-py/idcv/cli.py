"""CLI entry point for idcv-verify."""

from __future__ import annotations

import argparse
import json
import sys

from .verify import verify, verify_many


def main():
    parser = argparse.ArgumentParser(
        prog="idcv-verify",
        description="Verify .cv domain identity via DNS TXT records",
    )
    parser.add_argument(
        "domains",
        nargs="+",
        help="One or more .cv domains to verify",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        dest="json_output",
        help="Output as JSON",
    )

    args = parser.parse_args()

    results = verify_many(args.domains)

    if args.json_output:
        output = [r.to_dict() for r in results]
        if len(output) == 1:
            output = output[0]
        print(json.dumps(output, indent=2))
    else:
        for r in results:
            if r.status == "verified":
                print(f"\u2713 {r.domain} — verified via {r.method} (proof: {r.proof}, date: {r.verified})")
            elif r.status == "not_found":
                print(f"\u2717 {r.domain} — domain not found")
            elif r.status == "unverified":
                print(f"\u2717 {r.domain} — no id-cv record found")
            elif r.status == "invalid":
                print(f"\u2717 {r.domain} — {r.error}")
            else:
                print(f"? {r.domain} — error: {r.error}")

    # Exit 1 if any domain is not verified
    if any(r.status != "verified" for r in results):
        sys.exit(1)


if __name__ == "__main__":
    main()
