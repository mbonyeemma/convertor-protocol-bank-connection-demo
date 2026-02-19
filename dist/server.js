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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const application_1 = __importDefault(require("./application"));
const bank_1 = __importDefault(require("./routes/bank"));
const admin_1 = __importDefault(require("./routes/admin"));
const data_source_1 = require("./data-source");
const config_1 = require("./config");
application_1.default.use('/api', bank_1.default);
application_1.default.use('/admin', admin_1.default);
application_1.default.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
application_1.default.get('/health', (_req, res) => {
    const bankName = config_1.config.getBankName();
    res.json({ status: 'ok', bank: bankName });
});
const port = config_1.config.port;
async function start() {
    try {
        await data_source_1.AppDataSource.initialize();
        const synchronizeEnabled = data_source_1.AppDataSource.options.synchronize;
        console.log('✅ Database initialized' + (synchronizeEnabled ? ' (synchronize enabled - tables auto-created)' : ''));
        // Load config from database and cache it
        try {
            const ConfigModel = await Promise.resolve().then(() => __importStar(require('./models/ConfigModel')));
            const dbConfig = await ConfigModel.getAllConfig();
            const { setDbConfigCache } = await Promise.resolve().then(() => __importStar(require('./config')));
            setDbConfigCache(dbConfig);
        }
        catch (e) {
            console.warn('[config] Could not load config from database, using env vars');
        }
    }
    catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        if (error.includes('Unknown database')) {
            console.error(`❌ Database '${config_1.config.db.database}' does not exist`);
            console.error('\n💡 Create it with:');
            const passwordPart = config_1.config.db.password ? `-p${config_1.config.db.password}` : '';
            console.error(`   mysql -u ${config_1.config.db.user} ${passwordPart} -e "CREATE DATABASE IF NOT EXISTS ${config_1.config.db.database};"`);
            console.error('\n   Or use docker compose up -d (includes MySQL)');
        }
        else if (error.includes('ECONNREFUSED') || error.includes('ENOTFOUND')) {
            console.error('❌ Cannot connect to MySQL server');
            console.error(`   Host: ${config_1.config.db.host}:${config_1.config.db.port}`);
            console.error('\n💡 Make sure MySQL is running:');
            console.error('   - Local: brew services start mysql (macOS) or start MySQL service');
            console.error('   - Docker: docker compose up -d');
            console.error('   - Railway: Check MySQL service is running and DB_HOST is set correctly');
        }
        else {
            console.error('❌ Database connection failed:', error);
        }
        process.exit(1);
    }
    application_1.default.listen(port, '0.0.0.0', () => {
        const bankName = config_1.config.getBankName();
        const bankCode = config_1.config.getBankCode();
        console.log(`\n🏦 ${bankName} (${bankCode}) listening on port ${port}`);
        console.log(`   Bank endpoints: http://localhost:${port}/api/*`);
        console.log(`   Admin UI:       http://localhost:${port}/`);
        console.log(`   Admin API:     http://localhost:${port}/admin/*\n`);
    });
}
process.on('SIGTERM', async () => {
    await data_source_1.AppDataSource.destroy();
    process.exit(0);
});
start().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map