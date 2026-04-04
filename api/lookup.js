/**
 * Vercel Serverless Function — GET /api/lookup/:domains
 *
 * Resolves id-cv TXT records for one or more .cv domains.
 *
 * Usage:
 *   GET /api/lookup/johndoe.cv
 *   GET /api/lookup/johndoe.cv,janebuilder.cv
 *
 * Response:
 *   Single domain → object
 *   Multiple domains → array
 */

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

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "public, max-age=60");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Extract domains from URL path: /api/lookup/domain1,domain2
  const pathParts = req.url.split("/").filter(Boolean);
  const domainsParam = pathParts[pathParts.length - 1];

  if (!domainsParam || domainsParam === "lookup") {
    return res.status(400).json({
      error: "Missing domain parameter",
      usage: "GET /api/lookup/johndoe.cv or GET /api/lookup/johndoe.cv,janebuilder.cv",
    });
  }

  const domains = domainsParam.split(",").map((d) => d.trim()).filter(Boolean);

  if (domains.length === 0) {
    return res.status(400).json({ error: "No valid domains provided" });
  }

  if (domains.length > 10) {
    return res.status(400).json({ error: "Maximum 10 domains per request" });
  }

  const results = await Promise.all(domains.map(verify));

  if (results.length === 1) {
    return res.status(200).json(results[0]);
  }

  return res.status(200).json(results);
};
