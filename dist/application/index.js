"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((err, req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});
exports.default = app;
//# sourceMappingURL=index.js.map