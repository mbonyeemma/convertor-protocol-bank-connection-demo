import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Account } from '../entities/Account';
import { ConnectionToken } from '../entities/ConnectionToken';
import { BankTransaction } from '../entities/Transaction';
import { sign, sha256Hex, loadPrivateKey } from '../lib/crypto';
import { config } from '../config';

function getBankPrivateKey(): string {
  return loadPrivateKey(
    config.keys.bankPrivateKeyPath,
    config.keys.bankPrivateKey || undefined
  );
}
import { v4 as uuidv4 } from 'uuid';

const accountRepo = () => AppDataSource.getRepository(Account);
const tokenRepo = () => AppDataSource.getRepository(ConnectionToken);
const txRepo = () => AppDataSource.getRepository(BankTransaction);

/** POST /connection-request - Convertor initiates user bank connection */
export async function connectionRequest(req: Request, res: Response): Promise<void> {
  try {
    const { user_id, account_reference } = req.body;
    const account = await accountRepo().findOne({ where: { accountNumber: account_reference } });
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }
    res.json({
      challenge_type: 'otp',
      required_metadata: { account_number: account.accountNumber },
    });
  } catch (e) {
    console.error('[connectionRequest]', e);
    res.status(500).json({ error: 'Failed to process connection request' });
  }
}

/** POST /auth-challenge-response - User completes OTP, bank returns token */
export async function authChallengeResponse(req: Request, res: Response): Promise<void> {
  try {
    const { user_id, challenge_response } = req.body;
    const account = await accountRepo().findOne({ where: { userId: user_id } });
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }
    const token = `CTK-${uuidv4()}`;
    const tokenHash = sha256Hex(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const tokenEntity = tokenRepo().create({
      userId: user_id,
      tokenHash,
      token,
      scope: 'debit-enabled',
      expiresAt,
    });
    await tokenRepo().save(tokenEntity);
    const privateKey = getBankPrivateKey();
    const signature = sign(JSON.stringify({ token, expiresAt: expiresAt.toISOString() }), privateKey);
    res.json({
      connection_token: token,
      expiry_timestamp: expiresAt.getTime(),
      scope: 'debit-enabled',
      bank_signature: signature,
    });
  } catch (e) {
    console.error('[authChallengeResponse]', e);
    res.status(500).json({ error: 'Failed to process challenge' });
  }
}

/** GET /account-balance - Return balance for transfer eligibility */
export async function accountBalance(req: Request, res: Response): Promise<void> {
  try {
    const { connection_token_hash } = req.query;
    const token = await tokenRepo().findOne({ where: { tokenHash: String(connection_token_hash) } });
    if (!token || new Date() > token.expiresAt) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    const account = await accountRepo().findOne({ where: { userId: token.userId } });
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }
    res.json({
      balance: Number(account.balance),
      currency: account.currency,
    });
  } catch (e) {
    console.error('[accountBalance]', e);
    res.status(500).json({ error: 'Failed to get balance' });
  }
}

/** POST /debit-request - Lock then debit funds */
export async function debitRequest(req: Request, res: Response): Promise<void> {
  try {
    const { reference_id, lock_confirmation_id, amount, connection_token_hash, idempotency_key, phase } = req.body;
    const token = await tokenRepo().findOne({ where: { tokenHash: connection_token_hash } });
    if (!token || new Date() > token.expiresAt) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    const account = await accountRepo().findOne({ where: { userId: token.userId } });
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }
    if (phase === 'lock') {
      const lockId = `LOCK-${reference_id}-${Date.now()}`;
      await txRepo().save(txRepo().create({
        referenceId: reference_id,
        type: 'LOCK',
        accountId: account.id,
        amount: String(amount.value || amount),
        currency: amount.currency || account.currency,
        payload: JSON.stringify({ lockId }),
      }));
      res.json({ lock_confirmation_id: lockId });
      return;
    }
    const lockTx = await txRepo().findOne({ where: { referenceId: reference_id, type: 'LOCK' } });
    if (!lockTx || lockTx.payload !== JSON.stringify({ lockId: lock_confirmation_id })) {
      res.status(400).json({ error: 'Invalid lock confirmation' });
      return;
    }
    const amountValue = Number(amount.value || amount);
    if (Number(account.balance) < amountValue) {
      res.status(400).json({ error: 'Insufficient funds' });
      return;
    }
    account.balance = String(Number(account.balance) - amountValue);
    await accountRepo().save(account);
    const debitProof = {
      amount: amountValue,
      account_hash: sha256Hex(account.accountNumber),
      timestamp: Date.now(),
    };
    const privateKey = getBankPrivateKey();
    const bankSignature = sign(JSON.stringify(debitProof), privateKey);
    await txRepo().save(txRepo().create({
      referenceId: reference_id,
      type: 'DEBIT',
      accountId: account.id,
      amount: String(amountValue),
      currency: amount.currency || account.currency,
      payload: JSON.stringify({ debitProof, bankSignature }),
    }));
    res.json({
      debit_proof: {
        ...debitProof,
        bank_signature: bankSignature,
      },
    });
  } catch (e) {
    console.error('[debitRequest]', e);
    res.status(500).json({ error: 'Failed to process debit' });
  }
}

/** POST /credit-request - Credit funds to beneficiary */
export async function creditRequest(req: Request, res: Response): Promise<void> {
  try {
    const { reference_id, amount, beneficiary_reference, debit_proof_hash, idempotency_key } = req.body;
    const account = await accountRepo().findOne({ where: { accountNumber: beneficiary_reference } });
    if (!account) {
      res.status(404).json({ error: 'Beneficiary account not found' });
      return;
    }
    const amountValue = Number(amount.value || amount);
    account.balance = String(Number(account.balance) + amountValue);
    await accountRepo().save(account);
    const creditConfirmation = {
      amount: amountValue,
      beneficiary_hash: sha256Hex(account.accountNumber),
      timestamp: Date.now(),
    };
    const privateKey = getBankPrivateKey();
    const bankSignature = sign(JSON.stringify(creditConfirmation), privateKey);
    await txRepo().save(txRepo().create({
      referenceId: reference_id,
      type: 'CREDIT',
      accountId: account.id,
      amount: String(amountValue),
      currency: amount.currency || account.currency,
      payload: JSON.stringify({ creditConfirmation, bankSignature }),
    }));
    res.json({
      credit_confirmation: {
        ...creditConfirmation,
        bank_signature: bankSignature,
      },
    });
  } catch (e) {
    console.error('[creditRequest]', e);
    res.status(500).json({ error: 'Failed to process credit' });
  }
}

/** POST /transaction-status - Query transaction by Protocol Reference ID */
export async function transactionStatus(req: Request, res: Response): Promise<void> {
  try {
    const { reference_id } = req.body;
    const tx = await txRepo().findOne({ where: { referenceId: reference_id }, order: { createdAt: 'DESC' } });
    if (!tx) {
      res.json({ state: 'UNKNOWN' });
      return;
    }
    res.json({ state: tx.type });
  } catch (e) {
    console.error('[transactionStatus]', e);
    res.status(500).json({ error: 'Failed to get status' });
  }
}

/** POST /reversal-request - Reverse a debit */
export async function reversalRequest(req: Request, res: Response): Promise<void> {
  try {
    const { reference_id, debit_proof, idempotency_key } = req.body;
    const debitTx = await txRepo().findOne({ where: { referenceId: reference_id, type: 'DEBIT' } });
    if (!debitTx) {
      res.status(404).json({ error: 'Debit transaction not found' });
      return;
    }
    const account = await accountRepo().findOne({ where: { id: debitTx.accountId! } });
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }
    account.balance = String(Number(account.balance) + Number(debitTx.amount));
    await accountRepo().save(account);
    const reversalConfirmation = {
      reference_id,
      reversed_amount: debitTx.amount,
      timestamp: Date.now(),
    };
    const privateKey = getBankPrivateKey();
    const bankSignature = sign(JSON.stringify(reversalConfirmation), privateKey);
    await txRepo().save(txRepo().create({
      referenceId: reference_id,
      type: 'REVERSAL',
      accountId: account.id,
      amount: debitTx.amount,
      currency: debitTx.currency,
      payload: JSON.stringify({ reversalConfirmation, bankSignature }),
    }));
    res.json({
      reversal_confirmation: {
        ...reversalConfirmation,
        bank_signature: bankSignature,
      },
    });
  } catch (e) {
    console.error('[reversalRequest]', e);
    res.status(500).json({ error: 'Failed to process reversal' });
  }
}
