export interface VerifyResult {
  domain: string;
  status: "verified" | "unverified" | "not_found" | "invalid" | "error";
  method?: string;
  proof?: string;
  verified?: string;
  error?: string;
}

export interface ParsedRecord {
  method: string;
  proof: string;
  verified: string;
}

export function verify(domain: string): Promise<VerifyResult>;
export function verifyMany(domains: string[]): Promise<VerifyResult[]>;
export function parseRecord(record: string): ParsedRecord | null;
