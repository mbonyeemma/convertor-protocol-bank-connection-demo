"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.setConfig = setConfig;
exports.getAllConfig = getAllConfig;
const data_source_1 = require("../data-source");
const Config_1 = require("../entities/Config");
const repo = () => data_source_1.AppDataSource.getRepository(Config_1.BankConfig);
async function getConfig(key) {
    const config = await repo().findOne({ where: { key } });
    return config?.value || null;
}
async function setConfig(key, value, description) {
    let config = await repo().findOne({ where: { key } });
    if (config) {
        config.value = value;
        if (description)
            config.description = description;
    }
    else {
        config = repo().create({ key, value, description: description || null });
    }
    await repo().save(config);
}
async function getAllConfig() {
    const configs = await repo().find();
    return configs.reduce((acc, c) => {
        acc[c.key] = c.value;
        return acc;
    }, {});
}
//# sourceMappingURL=ConfigModel.js.map