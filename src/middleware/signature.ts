import { Request, Response, NextFunction } from 'express';
import { buildCanonicalString, sha256Hex, verifySignature, loadPublicKey } from '../lib/crypto';
import { config } from '../config';

const HEADER_KEY_ID = 'x-convertor-keyid';
const HEADER_NONCE = 'x-convertor-nonce';
const HEADER_TIMESTAMP = 'x-convertor-timestamp';
const HEADER_SIGNATURE = 'x-convertor-signature';

let convertorPublicKey: string | null = null;

function getConvertorPublicKey(): string {
  if (!convertorPublicKey) {
    convertorPublicKey = loadPublicKey(
      config.keys.convertorPublicKeyPath,
      config.keys.convertorPublicKey || undefined
    );
  }
  return convertorPublicKey;
}

export function requireConvertorSignature(req: Request, res: Response, next: NextFunction): void {
  const keyId = req.get(HEADER_KEY_ID);
  const nonce = req.get(HEADER_NONCE);
  const timestamp = req.get(HEADER_TIMESTAMP);
  const signature = req.get(HEADER_SIGNATURE);

  if (!keyId || !nonce || !timestamp || !signature) {
    res.status(401).json({ error: 'Missing signature headers' });
    return;
  }

  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body || {}));
  const bodySha256 = sha256Hex(rawBody);
  const method = (req.method || 'GET').toUpperCase();
  const path = req.path || req.url?.split('?')[0] || '/';
  const canonical = buildCanonicalString(method, path, bodySha256, nonce, timestamp);

  try {
    const publicKey = getConvertorPublicKey();
    if (!verifySignature(canonical, signature, publicKey)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }
  } catch (e) {
    console.error('[signature] Failed to load/verify', e);
    res.status(503).json({ error: 'Signature verification unavailable' });
    return;
  }

  (req as Request & { signatureMeta?: { keyId: string; nonce: string; timestamp: string } }).signatureMeta = {
    keyId,
    nonce,
    timestamp,
  };
  next();
}

export function rawBodyJson(): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks);
      (req as Request & { rawBody?: Buffer }).rawBody = raw;
      if (raw.length) {
        try {
          (req as Request).body = JSON.parse(raw.toString('utf8'));
        } catch {
          (req as Request).body = {};
        }
      } else {
        (req as Request).body = {};
      }
      next();
    });
    req.on('error', next);
  };
}
