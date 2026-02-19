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
exports.config = void 0;
exports.setDbConfigCache = setDbConfigCache;
require("dotenv/config");
// Database config cache - loaded after DB initialization
let dbConfigCache = null;
function setDbConfigCache(cache) {
    dbConfigCache = cache;
}
function getDbConfigValue(key) {
    return dbConfigCache?.[key] || null;
}
function getConfigValue(key, envVar, defaultValue) {
    return getDbConfigValue(key) || envVar || defaultValue;
}
// Helper to get key from DB cache, env vars, or files (in that order)
async function getKeyFromConfig(keyName, filePath, envKeyVar) {
    // Check database cache first (loaded after DB initialization)
    const dbValue = getDbConfigValue(keyName);
    if (dbValue) {
        return dbValue;
    }
    // Then check env var (direct PEM)
    if (envKeyVar) {
        return envKeyVar;
    }
    // Then check file path
    if (filePath) {
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs')));
            const path = await Promise.resolve().then(() => __importStar(require('path')));
            const resolved = path.default.isAbsolute(filePath) ? filePath : path.default.resolve(process.cwd(), filePath);
            if (fs.default.existsSync(resolved)) {
                return fs.default.readFileSync(resolved, 'utf8');
            }
        }
        catch {
            // File not found, continue
        }
    }
    throw new Error(`${keyName} not found in database, env vars, or file`);
}
// Base config (must be available before DB connection)
exports.config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'bankdemo',
    },
    keys: {
        bankPrivateKeyPath: process.env.BANK_PRIVATE_KEY_PATH || './keys/bank_private.pem',
        convertorPublicKeyPath: process.env.CONVERTOR_PUBLIC_KEY_PATH || './keys/convertor_public.pem',
        // Railway: keys can be provided as env vars directly (secrets)
        bankPrivateKey: process.env.BANK_PRIVATE_KEY || '',
        convertorPublicKey: process.env.CONVERTOR_PUBLIC_KEY || '',
        // Get keys from database, env vars, or files (in that order)
        async getBankPrivateKey() {
            return getKeyFromConfig('bank_private_key', exports.config.keys.bankPrivateKeyPath, exports.config.keys.bankPrivateKey);
        },
        async getConvertorPublicKey() {
            return getKeyFromConfig('convertor_public_key', exports.config.keys.convertorPublicKeyPath, exports.config.keys.convertorPublicKey);
        },
    },
    // These will be loaded from database after initialization
    getBankCode() {
        return getConfigValue('bank_code', process.env.BANK_CODE, 'DFC');
    },
    getBankName() {
        return getConfigValue('bank_name', process.env.BANK_NAME, 'DFC Bank');
    },
    getConvertorApiUrl() {
        return getConfigValue('convertor_api_url', process.env.CONVERTOR_API_URL, 'http://localhost:4000');
    },
};
//# sourceMappingURL=index.js.map