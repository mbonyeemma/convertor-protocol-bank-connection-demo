import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export function sha256Hex(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function buildCanonicalString(
  method: string,
  path: string,
  bodySha256: string,
  nonce: string,
  timestamp: string
): string {
  return [method, path, bodySha256, nonce, timestamp].join(':');
}

export function verifySignature(
  canonicalString: string,
  signatureBase64: string,
  publicKeyPem: string
): boolean {
  try {
    const sig = Buffer.from(signatureBase64, 'base64');
    return crypto.verify(null, Buffer.from(canonicalString, 'utf8'), publicKeyPem, sig);
  } catch {
    return false;
  }
}

export function sign(canonicalString: string, privateKeyPem: string): string {
  const sig = crypto.sign(null, Buffer.from(canonicalString, 'utf8'), privateKeyPem);
  return sig.toString('base64');
}

export function loadPrivateKey(keyPath: string, envVar?: string): string {
  if (envVar) return envVar;
  const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
  if (fs.existsSync(resolved)) {
    return fs.readFileSync(resolved, 'utf8');
  }
  throw new Error(`Private key not found at ${resolved} and BANK_PRIVATE_KEY env var not set`);
}

export function loadPublicKey(keyPath: string, envVar?: string): string {
  if (envVar) return envVar;
  const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
  if (fs.existsSync(resolved)) {
    return fs.readFileSync(resolved, 'utf8');
  }
  throw new Error(`Public key not found at ${resolved} and CONVERTOR_PUBLIC_KEY env var not set`);
}

export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}
