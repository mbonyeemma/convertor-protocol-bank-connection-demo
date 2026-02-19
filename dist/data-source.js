"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const config_1 = require("./config");
const Account_1 = require("./entities/Account");
const ConnectionToken_1 = require("./entities/ConnectionToken");
const Transaction_1 = require("./entities/Transaction");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'mysql',
    host: config_1.config.db.host,
    port: config_1.config.db.port,
    username: config_1.config.db.user,
    password: config_1.config.db.password,
    database: config_1.config.db.database,
    synchronize: config_1.config.env === 'development',
    logging: false,
    entities: [Account_1.Account, ConnectionToken_1.ConnectionToken, Transaction_1.BankTransaction],
    migrations: [],
});
//# sourceMappingURL=data-source.js.map