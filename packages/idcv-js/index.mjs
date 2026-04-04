import dns from "dns";
import { promisify } from "util";

const resolveTxt = promisify(dns.resolveTxt);

const ID_CV_PREFIX = "id-cv=";

export function parseRecord(record) {
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

export async function verify(domain) {
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
      return {
        domain,
        status: "verified",
        method: parsed.method,
        proof: parsed.proof,
        verified: parsed.verified,
      };
    }
  }

  return { domain, status: "unverified", error: "Malformed id-cv record" };
}

export async function verifyMany(domains) {
  return Promise.all(domains.map(verify));
}
