import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Account } from '../entities/Account';
import { BankTransaction } from '../entities/Transaction';
import { ConnectionToken } from '../entities/ConnectionToken';
import * as ConfigModel from '../models/ConfigModel';

const accountRepo = () => AppDataSource.getRepository(Account);
const txRepo = () => AppDataSource.getRepository(BankTransaction);
const tokenRepo = () => AppDataSource.getRepository(ConnectionToken);

export async function listAccounts(_req: Request, res: Response): Promise<void> {
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
  } catch (e) {
    console.error('[admin.listAccounts]', e);
    res.status(500).json({ error: 'Failed to list accounts' });
  }
}

export async function createAccount(req: Request, res: Response): Promise<void> {
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
  } catch (e) {
    console.error('[admin.createAccount]', e);
    res.status(500).json({ error: 'Failed to create account' });
  }
}

export async function listTransactions(_req: Request, res: Response): Promise<void> {
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
  } catch (e) {
    console.error('[admin.listTransactions]', e);
    res.status(500).json({ error: 'Failed to list transactions' });
  }
}

export async function listConnectionTokens(_req: Request, res: Response): Promise<void> {
  try {
    const tokens = await tokenRepo().find({ order: { createdAt: 'DESC' } });
    res.json(tokens.map((t) => ({
      id: t.id,
      userId: t.userId,
      tokenHash: t.tokenHash,
      scope: t.scope,
      expiresAt: t.expiresAt,
      createdAt: t.createdAt,
      isExpired: new Date(t.expiresAt) < new Date(),
    })));
  } catch (e) {
    console.error('[admin.listConnectionTokens]', e);
    res.status(500).json({ error: 'Failed to list connection tokens' });
  }
}

export async function getAccountBalance(req: Request, res: Response): Promise<void> {
  try {
    const { accountId } = req.params;
    const account = await accountRepo().findOne({ where: { id: accountId } });
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }
    res.json({
      accountId: account.id,
      accountNumber: account.accountNumber,
      userId: account.userId,
      userName: account.userName,
      balance: Number(account.balance),
      currency: account.currency,
    });
  } catch (e) {
    console.error('[admin.getAccountBalance]', e);
    res.status(500).json({ error: 'Failed to get account balance' });
  }
}

export async function getConfig(_req: Request, res: Response): Promise<void> {
  try {
    const config = await ConfigModel.getAllConfig();
    res.json(config);
  } catch (e) {
    console.error('[admin.getConfig]', e);
    res.status(500).json({ error: 'Failed to get config' });
  }
}

export async function updateConfig(req: Request, res: Response): Promise<void> {
  try {
    const { key, value, description } = req.body;
    if (!key || value === undefined) {
      res.status(400).json({ error: 'key and value are required' });
      return;
    }
    await ConfigModel.setConfig(key, String(value), description);
    res.json({ key, value, message: 'Config updated successfully' });
  } catch (e) {
    console.error('[admin.updateConfig]', e);
    res.status(500).json({ error: 'Failed to update config' });
  }
}

export async function updateKeys(req: Request, res: Response): Promise<void> {
  try {
    const { bankPrivateKey, convertorPublicKey } = req.body;
    
    if (bankPrivateKey) {
      await ConfigModel.setConfig('bank_private_key', bankPrivateKey, 'Bank Ed25519 private key (PEM)');
    }
    
    if (convertorPublicKey) {
      await ConfigModel.setConfig('convertor_public_key', convertorPublicKey, 'Convertor operational public key (PEM)');
    }
    
    res.json({ message: 'Keys updated successfully' });
  } catch (e) {
    console.error('[admin.updateKeys]', e);
    res.status(500).json({ error: 'Failed to update keys' });
  }
}
