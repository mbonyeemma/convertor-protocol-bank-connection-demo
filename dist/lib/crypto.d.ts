export declare function sha256Hex(data: string | Buffer): string;
export declare function buildCanonicalString(method: string, path: string, bodySha256: string, nonce: string, timestamp: string): string;
export declare function verifySignature(canonicalString: string, signatureBase64: string, publicKeyPem: string): boolean;
export declare function sign(canonicalString: string, privateKeyPem: string): string;
export declare function loadPrivateKey(keyPath: string, envVar?: string): string;
export declare function loadPublicKey(keyPath: string, envVar?: string): string;
export declare function generateKeyPair(): {
    publicKey: string;
    privateKey: string;
};
