"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAccounts = listAccounts;
exports.createAccount = createAccount;
exports.listTransactions = listTransactions;
const data_source_1 = require("../data-source");
const Account_1 = require("../entities/Account");
const Transaction_1 = require("../entities/Transaction");
const accountRepo = () => data_source_1.AppDataSource.getRepository(Account_1.Account);
const txRepo = () => data_source_1.AppDataSource.getRepository(Transaction_1.BankTransaction);
async function listAccounts(_req, res) {
    try {
        const accounts = await accountRepo().find({ order: { createdAt: 'DESC' } });
        res.json(accounts.map((a) => ({
            id: a.id,
            userId: a.userId,
            userName: a.userName,
            accountNumber: a.accountNumber,
            balance: Number(a.balance),
            currency: a.currency,
            createdAt: a.createdAt,
        })));
    }
    catch (e) {
        console.error('[admin.listAccounts]', e);
        res.status(500).json({ error: 'Failed to list accounts' });
    }
}
async function createAccount(req, res) {
    try {
        const { userId, userName, accountNumber, initialBalance = 0, currency = 'UGX' } = req.body;
        if (!userId || !userName || !accountNumber) {
            res.status(400).json({ error: 'userId, userName, accountNumber required' });
            return;
        }
        const existing = await accountRepo().findOne({ where: { accountNumber } });
        if (existing) {
            res.status(409).json({ error: 'Account number already exists' });
            return;
        }
        const account = accountRepo().create({
            userId: String(userId),
            userName: String(userName),
            accountNumber: String(accountNumber),
            balance: String(initialBalance),
            currency: String(currency),
        });
        await accountRepo().save(account);
        res.status(201).json({
            id: account.id,
            userId: account.userId,
            userName: account.userName,
            accountNumber: account.accountNumber,
            balance: Number(account.balance),
            currency: account.currency,
        });
    }
    catch (e) {
        console.error('[admin.createAccount]', e);
        res.status(500).json({ error: 'Failed to create account' });
    }
}
async function listTransactions(_req, res) {
    try {
        const txs = await txRepo().find({ order: { createdAt: 'DESC' }, take: 100 });
        res.json(txs.map((t) => ({
            id: t.id,
            referenceId: t.referenceId,
            type: t.type,
            accountId: t.accountId,
            amount: t.amount ? Number(t.amount) : null,
            currency: t.currency,
            payload: t.payload ? JSON.parse(t.payload) : null,
            createdAt: t.createdAt,
        })));
    }
    catch (e) {
        console.error('[admin.listTransactions]', e);
        res.status(500).json({ error: 'Failed to list transactions' });
    }
}
//# sourceMappingURL=adminController.js.map