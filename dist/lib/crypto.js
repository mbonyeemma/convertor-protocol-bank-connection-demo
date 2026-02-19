"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256Hex = sha256Hex;
exports.buildCanonicalString = buildCanonicalString;
exports.verifySignature = verifySignature;
exports.sign = sign;
exports.loadPrivateKey = loadPrivateKey;
exports.loadPrivateKeyAsync = loadPrivateKeyAsync;
exports.loadPublicKey = loadPublicKey;
exports.loadPublicKeyAsync = loadPublicKeyAsync;
exports.generateKeyPair = generateKeyPair;
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function sha256Hex(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}
function buildCanonicalString(method, path, bodySha256, nonce, timestamp) {
    return [method, path, bodySha256, nonce, timestamp].join(':');
}
function verifySignature(canonicalString, signatureBase64, publicKeyPem) {
    try {
        const sig = Buffer.from(signatureBase64, 'base64');
        return crypto.verify(null, Buffer.from(canonicalString, 'utf8'), publicKeyPem, sig);
    }
    catch {
        return false;
    }
}
function sign(canonicalString, privateKeyPem) {
    const sig = crypto.sign(null, Buffer.from(canonicalString, 'utf8'), privateKeyPem);
    return sig.toString('base64');
}
function loadPrivateKey(keyPath, envVar) {
    if (envVar)
        return envVar;
    const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
    if (fs.existsSync(resolved)) {
        return fs.readFileSync(resolved, 'utf8');
    }
    throw new Error(`Private key not found at ${resolved} and BANK_PRIVATE_KEY env var not set`);
}
async function loadPrivateKeyAsync() {
    const { config } = await Promise.resolve().then(() => __importStar(require('../config')));
    return config.keys.getBankPrivateKey();
}
function loadPublicKey(keyPath, envVar) {
    if (envVar)
        return envVar;
    const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
    if (fs.existsSync(resolved)) {
        return fs.readFileSync(resolved, 'utf8');
    }
    throw new Error(`Public key not found at ${resolved} and CONVERTOR_PUBLIC_KEY env var not set`);
}
async function loadPublicKeyAsync() {
    const { config } = await Promise.resolve().then(() => __importStar(require('../config')));
    return config.keys.getConvertorPublicKey();
}
function generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    return { publicKey, privateKey };
}
//# sourceMappingURL=crypto.js.map