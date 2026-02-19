import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Account } from '../entities/Account';
import { BankTransaction } from '../entities/Transaction';
import { ConnectionToken } from '../entities/ConnectionToken';
import * as ConfigModel from '../models/ConfigModel';
import { config } from '../config';
import crypto from 'crypto';

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

/**
 * Extract public key from private key (Ed25519)
 */
function extractPublicKey(privateKeyPem: string): string {
  try {
    const keyObject = crypto.createPrivateKey(privateKeyPem);
    const publicKeyObject = crypto.createPublicKey(keyObject);
    return publicKeyObject.export({ type: 'spki', format: 'pem' }) as string;
  } catch (e) {
    throw new Error('Failed to extract public key from private key');
  }
}

/**
 * Register bank with Convertor protocol
 */
async function registerWithProtocol(
  bankCode: string,
  bankName: string,
  publicKeyPem: string,
  baseUrl: string | null
): Promise<{ id: string; status: string } | null> {
  try {
    const protocolUrl = config.getConvertorApiUrl();
    const response = await fetch(`${protocolUrl}/api/banks/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: bankCode,
        name: bankName,
        publicKeyPem: publicKeyPem.trim(),
        keyId: `${bankCode.toLowerCase()}_bank_key_${new Date().getFullYear()}`,
        baseUrl: baseUrl || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: string };
      // If bank already exists (409), mark as registered but status unknown
      if (response.status === 409) {
        console.log(`[admin.updateKeys] Bank ${bankCode} already registered`);
        // Store that registration was attempted (bank exists)
        await ConfigModel.setConfig('protocol_registration_attempted', 'true', 'Registration attempted flag');
        return { id: 'existing', status: 'pending' }; // Status unknown, assume pending
      }
      throw new Error(errorData.error || `Registration failed: ${response.status}`);
    }

    const data = await response.json() as { id: string; status: string };
    return { id: data.id, status: data.status };
  } catch (e) {
    console.error('[admin.updateKeys] Protocol registration error:', e);
    throw e;
  }
}

/**
 * Get bank registration status from protocol (internal helper)
 */
async function getRegistrationStatusInternal(bankCode: string): Promise<{ id: string; status: string } | null> {
  try {
    const protocolUrl = config.getConvertorApiUrl();
    // Try to get bank by checking admin API (if we had access) or by trying to register
    // For now, we'll store registration info in config
    const registrationId = await ConfigModel.getConfig('protocol_registration_id');
    const registrationStatus = await ConfigModel.getConfig('protocol_registration_status');
    
    if (registrationId && registrationStatus) {
      return { id: registrationId, status: registrationStatus };
    }
    return null;
  } catch (e) {
    console.error('[admin.updateKeys] Failed to get registration status:', e);
    return null;
  }
}

export async function updateKeys(req: Request, res: Response): Promise<void> {
  try {
    const { bankPrivateKey, convertorPublicKey } = req.body;
    
    if (bankPrivateKey) {
      await ConfigModel.setConfig('bank_private_key', bankPrivateKey, 'Bank Ed25519 private key (PEM)');
      
      // Auto-register with protocol when private key is saved
      try {
        const bankCode = config.getBankCode();
        const bankName = config.getBankName();
        const convertorApiUrl = config.getConvertorApiUrl();
        
        // Extract public key from private key
        const publicKeyPem = extractPublicKey(bankPrivateKey);
        
        // Get base URL (bank's own URL for webhooks)
        // For now, we'll leave it null - bank can update it later via /api/banks/me/webhook
        const baseUrl = null;
        
        // Register with protocol
        const registration = await registerWithProtocol(bankCode, bankName, publicKeyPem, baseUrl);
        
        if (registration) {
          await ConfigModel.setConfig('protocol_registration_id', registration.id, 'Protocol registration ID');
          await ConfigModel.setConfig('protocol_registration_status', registration.status, 'Protocol registration status');
          await ConfigModel.setConfig('protocol_registration_attempted', 'true', 'Registration attempted flag');
          console.log(`[admin.updateKeys] Bank registered with protocol: ${registration.id} (${registration.status})`);
        }
      } catch (regError) {
        console.error('[admin.updateKeys] Auto-registration failed (keys still saved):', regError);
        // Don't fail the request - keys are saved even if registration fails
      }
    }
    
    if (convertorPublicKey) {
      await ConfigModel.setConfig('convertor_public_key', convertorPublicKey, 'Convertor operational public key (PEM)');
    }
    
    // Get updated registration status
    const registrationId = await ConfigModel.getConfig('protocol_registration_id');
    const registrationStatus = await ConfigModel.getConfig('protocol_registration_status');
    
    res.json({
      message: 'Keys updated successfully',
      registration: registrationId && registrationStatus
        ? { id: registrationId, status: registrationStatus }
        : null,
    });
  } catch (e) {
    console.error('[admin.updateKeys]', e);
    res.status(500).json({ error: 'Failed to update keys' });
  }
}

export async function getRegistrationStatus(req: Request, res: Response): Promise<void> {
  try {
    const registrationId = await ConfigModel.getConfig('protocol_registration_id');
    const registrationStatus = await ConfigModel.getConfig('protocol_registration_status');
    const registrationAttempted = await ConfigModel.getConfig('protocol_registration_attempted');
    
    // If we have registration info, return it
    if (registrationId && registrationStatus) {
      res.json({
        registered: true,
        registrationId: registrationId,
        status: registrationStatus,
      });
    } else if (registrationAttempted === 'true') {
      // Registration was attempted but we don't have full info
      res.json({
        registered: true,
        registrationId: null,
        status: 'pending', // Assume pending if we don't know
      });
    } else {
      // Not registered yet
      res.json({
        registered: false,
        registrationId: null,
        status: null,
      });
    }
  } catch (e) {
    console.error('[admin.getRegistrationStatus]', e);
    res.status(500).json({ error: 'Failed to get registration status' });
  }
}
