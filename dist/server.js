"use strict";
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
    res.json({ status: 'ok', bank: config_1.config.bankName });
});
const port = config_1.config.port;
async function start() {
    try {
        await data_source_1.AppDataSource.initialize();
        console.log('✅ Database initialized');
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
        console.log(`\n🏦 ${config_1.config.bankName} (${config_1.config.bankCode}) listening on port ${port}`);
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