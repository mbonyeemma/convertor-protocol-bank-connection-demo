"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireConvertorSignature = requireConvertorSignature;
exports.rawBodyJson = rawBodyJson;
const crypto_1 = require("../lib/crypto");
const config_1 = require("../config");
const HEADER_KEY_ID = 'x-convertor-keyid';
const HEADER_NONCE = 'x-convertor-nonce';
const HEADER_TIMESTAMP = 'x-convertor-timestamp';
const HEADER_SIGNATURE = 'x-convertor-signature';
let convertorPublicKey = null;
function getConvertorPublicKey() {
    if (!convertorPublicKey) {
        convertorPublicKey = (0, crypto_1.loadPublicKey)(config_1.config.keys.convertorPublicKeyPath, config_1.config.keys.convertorPublicKey || undefined);
    }
    return convertorPublicKey;
}
function requireConvertorSignature(req, res, next) {
    const keyId = req.get(HEADER_KEY_ID);
    const nonce = req.get(HEADER_NONCE);
    const timestamp = req.get(HEADER_TIMESTAMP);
    const signature = req.get(HEADER_SIGNATURE);
    if (!keyId || !nonce || !timestamp || !signature) {
        res.status(401).json({ error: 'Missing signature headers' });
        return;
    }
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body || {}));
    const bodySha256 = (0, crypto_1.sha256Hex)(rawBody);
    const method = (req.method || 'GET').toUpperCase();
    const path = req.path || req.url?.split('?')[0] || '/';
    const canonical = (0, crypto_1.buildCanonicalString)(method, path, bodySha256, nonce, timestamp);
    try {
        const publicKey = getConvertorPublicKey();
        if (!(0, crypto_1.verifySignature)(canonical, signature, publicKey)) {
            res.status(401).json({ error: 'Invalid signature' });
            return;
        }
    }
    catch (e) {
        console.error('[signature] Failed to load/verify', e);
        res.status(503).json({ error: 'Signature verification unavailable' });
        return;
    }
    req.signatureMeta = {
        keyId,
        nonce,
        timestamp,
    };
    next();
}
function rawBodyJson() {
    return (req, res, next) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => {
            const raw = Buffer.concat(chunks);
            req.rawBody = raw;
            if (raw.length) {
                try {
                    req.body = JSON.parse(raw.toString('utf8'));
                }
                catch {
                    req.body = {};
                }
            }
            else {
                req.body = {};
            }
            next();
        });
        req.on('error', next);
    };
}
//# sourceMappingURL=signature.js.map