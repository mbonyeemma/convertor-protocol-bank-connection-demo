import 'dotenv/config';
import { AppDataSource } from '../data-source';
import * as ConfigModel from '../models/ConfigModel';

// Database config loader - loads from DB with env var fallbacks
let dbConfigCache: Record<string, string> | null = null;

async function loadDbConfig(): Promise<Record<string, string>> {
  if (dbConfigCache) return dbConfigCache;
  
  try {
    if (AppDataSource.isInitialized) {
      dbConfigCache = await ConfigModel.getAllConfig();
      return dbConfigCache;
    }
  } catch (e) {
    console.warn('[config] Database not initialized, using env vars only');
  }
  return {};
}

async function getConfigValue(key: string, envVar: string | undefined, defaultValue: string): Promise<string> {
  const dbConfig = await loadDbConfig();
  return dbConfig[key] || envVar || defaultValue;
}

// Helper to get key from DB or env/file
async function getKeyFromConfig(keyName: string, filePath: string, envKeyVar: string | undefined): Promise<string> {
  const dbConfig = await loadDbConfig();
  // Check database first
  if (dbConfig[keyName]) {
    return dbConfig[keyName];
  }
  // Then check env var (direct PEM)
  if (envKeyVar) {
    return envKeyVar;
  }
  // Then check file path
  if (filePath) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const resolved = path.default.isAbsolute(filePath) ? filePath : path.default.resolve(process.cwd(), filePath);
      if (fs.default.existsSync(resolved)) {
        return fs.default.readFileSync(resolved, 'utf8');
      }
    } catch {
      // File not found, continue
    }
  }
  throw new Error(`${keyName} not found in database, env vars, or file`);
}

// Base config (must be available before DB connection)
export const config = {
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
    async getBankPrivateKey(): Promise<string> {
      return getKeyFromConfig('bank_private_key', config.keys.bankPrivateKeyPath, config.keys.bankPrivateKey);
    },
    
    async getConvertorPublicKey(): Promise<string> {
      return getKeyFromConfig('convertor_public_key', config.keys.convertorPublicKeyPath, config.keys.convertorPublicKey);
    },
  },

  // These will be loaded from database after initialization
  async getBankCode(): Promise<string> {
    return getConfigValue('bank_code', process.env.BANK_CODE, 'DFC');
  },

  async getBankName(): Promise<string> {
    return getConfigValue('bank_name', process.env.BANK_NAME, 'DFC Bank');
  },

  async getConvertorApiUrl(): Promise<string> {
    return getConfigValue('convertor_api_url', process.env.CONVERTOR_API_URL, 'http://localhost:4000');
  },
} as const;
