#!/usr/bin/env node

"use strict";

const dns = require("dns");
const { promisify } = require("util");

const resolveTxt = promisify(dns.resolveTxt);

const ID_CV_PREFIX = "id-cv=";

function parseRecord(record) {
  if (!record.startsWith(ID_CV_PREFIX)) return null;
  const payload = record.slice(ID_CV_PREFIX.length);
  const pipeIndex = payload.lastIndexOf("|");
  if (pipeIndex === -1) return null;
  const methodProof = payload.slice(0, pipeIndex);
  const date = payload.slice(pipeIndex + 1);
  const colonIndex = methodProof.indexOf(":");
  if (colonIndex === -1) return null;
  const method = methodProof.slice(0, colonIndex);
  const proof = methodProof.slice(colonIndex + 1);
  if (!method || !proof || !date) return null;
  return { method, proof, verified: date };
}

async function verify(domain) {
  if (!domain || !domain.endsWith(".cv")) {
    return { domain, status: "invalid", error: "Domain must end with .cv" };
  }

  let records;
  try {
    records = await resolveTxt(domain);
  } catch (err) {
    if (err.code === "ENOTFOUND" || err.code === "ENODATA") {
      return { domain, status: "not_found" };
    }
    return { domain, status: "error", error: err.message };
  }

  const flat = records.map((chunks) => chunks.join(""));
  const idcvRecords = flat.filter((r) => r.startsWith(ID_CV_PREFIX));

  if (idcvRecords.length === 0) {
    return { domain, status: "unverified" };
  }

  for (const raw of idcvRecords) {
    const parsed = parseRecord(raw);
    if (parsed) {
      return { domain, status: "verified", ...parsed };
    }
  }

  return { domain, status: "unverified", error: "Malformed id-cv record" };
}

// ── CLI ──

const args = process.argv.slice(2);
const jsonFlag = args.includes("--json");
const domains = args.filter((a) => !a.startsWith("--"));

if (domains.length === 0) {
  console.log(`idcv — Verify .cv domain identity

Usage:
  idcv <domain> [domain...]    Verify one or more .cv domains
  idcv --json <domain>         Output as JSON

Examples:
  idcv johndoe.cv
  idcv --json johndoe.cv janebuilder.cv`);
  process.exit(0);
}

Promise.all(domains.map(verify)).then((results) => {
  if (jsonFlag) {
    const output = results.length === 1 ? results[0] : results;
    console.log(JSON.stringify(output, null, 2));
  } else {
    for (const r of results) {
      if (r.status === "verified") {
        console.log(`\u2713 ${r.domain} — verified via ${r.method} (proof: ${r.proof}, date: ${r.verified})`);
      } else if (r.status === "not_found") {
        console.log(`\u2717 ${r.domain} — domain not found`);
      } else if (r.status === "unverified") {
        console.log(`\u2717 ${r.domain} — no id-cv record found`);
      } else if (r.status === "invalid") {
        console.log(`\u2717 ${r.domain} — ${r.error}`);
      } else {
        console.log(`? ${r.domain} — error: ${r.error}`);
      }
    }
  }

  if (results.some((r) => r.status !== "verified")) process.exit(1);
});
