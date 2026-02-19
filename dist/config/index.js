"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
require("dotenv/config");
exports.config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    bankCode: process.env.BANK_CODE || 'DEMO',
    bankName: process.env.BANK_NAME || 'Demo Bank',
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'bankdemo',
    },
    convertor: {
        apiUrl: process.env.CONVERTOR_API_URL || 'http://localhost:4000',
    },
    keys: {
        bankPrivateKeyPath: process.env.BANK_PRIVATE_KEY_PATH || './keys/bank_private.pem',
        convertorPublicKeyPath: process.env.CONVERTOR_PUBLIC_KEY_PATH || './keys/convertor_public.pem',
        // Railway: keys can be provided as env vars directly (secrets)
        bankPrivateKey: process.env.BANK_PRIVATE_KEY || '',
        convertorPublicKey: process.env.CONVERTOR_PUBLIC_KEY || '',
    },
};
//# sourceMappingURL=index.js.map