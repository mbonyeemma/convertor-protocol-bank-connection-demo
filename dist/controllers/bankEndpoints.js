"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionRequest = connectionRequest;
exports.authChallengeResponse = authChallengeResponse;
exports.accountBalance = accountBalance;
exports.debitRequest = debitRequest;
exports.creditRequest = creditRequest;
exports.transactionStatus = transactionStatus;
exports.reversalRequest = reversalRequest;
const data_source_1 = require("../data-source");
const Account_1 = require("../entities/Account");
const ConnectionToken_1 = require("../entities/ConnectionToken");
const Transaction_1 = require("../entities/Transaction");
const crypto_1 = require("../lib/crypto");
const config_1 = require("../config");
function getBankPrivateKey() {
    return (0, crypto_1.loadPrivateKey)(config_1.config.keys.bankPrivateKeyPath, config_1.config.keys.bankPrivateKey || undefined);
}
const uuid_1 = require("uuid");
const accountRepo = () => data_source_1.AppDataSource.getRepository(Account_1.Account);
const tokenRepo = () => data_source_1.AppDataSource.getRepository(ConnectionToken_1.ConnectionToken);
const txRepo = () => data_source_1.AppDataSource.getRepository(Transaction_1.BankTransaction);
/** POST /connection-request - Convertor initiates user bank connection */
async function connectionRequest(req, res) {
    try {
        const { user_id, account_reference } = req.body;
        console.log('[bank-demo.connectionRequest] Received request', {
            user_id,
            account_reference: account_reference ? `${account_reference.slice(0, 4)}****` : 'missing',
            timestamp: new Date().toISOString(),
        });
        if (!account_reference) {
            console.error('[bank-demo.connectionRequest] Missing account_reference');
            res.status(400).json({ error: 'account_reference is required' });
            return;
        }
        console.log('[bank-demo.connectionRequest] Looking up account in database', {
            accountNumber: account_reference,
        });
        const account = await accountRepo().findOne({ where: { accountNumber: account_reference } });
        if (!account) {
            console.error('[bank-demo.connectionRequest] Account not found in database', {
                accountNumber: account_reference,
                searchedIn: 'accounts table',
            });
            res.status(404).json({ error: 'Account not found' });
            return;
        }
        console.log('[bank-demo.connectionRequest] Account found', {
            accountId: account.id,
            accountNumber: account.accountNumber,
            userName: account.userName,
            balance: account.balance,
            currency: account.currency,
        });
        const response = {
            challenge_type: 'otp',
            required_metadata: {
                account_number: account.accountNumber,
                account_holder_name: account.userName, // Return real account holder name
            },
            account_holder_name: account.userName, // Also at top level for easy access
        };
        console.log('[bank-demo.connectionRequest] Sending success response', {
            accountHolderName: account.userName,
            challengeType: 'otp',
        });
        res.json(response);
    }
    catch (e) {
        console.error('[bank-demo.connectionRequest] Error processing request', {
            error: e instanceof Error ? e.message : String(e),
            stack: e instanceof Error ? e.stack : undefined,
        });
        res.status(500).json({ error: 'Failed to process connection request' });
    }
}
/** POST /auth-challenge-response - User completes OTP, bank returns token */
async function authChallengeResponse(req, res) {
    try {
        const { user_id, challenge_response } = req.body;
        const account = await accountRepo().findOne({ where: { userId: user_id } });
        if (!account) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }
        const token = `CTK-${(0, uuid_1.v4)()}`;
        const tokenHash = (0, crypto_1.sha256Hex)(token);
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
        const signature = (0, crypto_1.sign)(JSON.stringify({ token, expiresAt: expiresAt.toISOString() }), privateKey);
        res.json({
            connection_token: token,
            expiry_timestamp: expiresAt.getTime(),
            scope: 'debit-enabled',
            bank_signature: signature,
        });
    }
    catch (e) {
        console.error('[authChallengeResponse]', e);
        res.status(500).json({ error: 'Failed to process challenge' });
    }
}
/** GET /account-balance - Return balance for transfer eligibility */
async function accountBalance(req, res) {
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
    }
    catch (e) {
        console.error('[accountBalance]', e);
        res.status(500).json({ error: 'Failed to get balance' });
    }
}
/** POST /debit-request - Lock then debit funds */
async function debitRequest(req, res) {
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
            account_hash: (0, crypto_1.sha256Hex)(account.accountNumber),
            timestamp: Date.now(),
        };
        const privateKey = getBankPrivateKey();
        const bankSignature = (0, crypto_1.sign)(JSON.stringify(debitProof), privateKey);
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
    }
    catch (e) {
        console.error('[debitRequest]', e);
        res.status(500).json({ error: 'Failed to process debit' });
    }
}
/** POST /credit-request - Credit funds to beneficiary */
async function creditRequest(req, res) {
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
            beneficiary_hash: (0, crypto_1.sha256Hex)(account.accountNumber),
            timestamp: Date.now(),
        };
        const privateKey = getBankPrivateKey();
        const bankSignature = (0, crypto_1.sign)(JSON.stringify(creditConfirmation), privateKey);
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
    }
    catch (e) {
        console.error('[creditRequest]', e);
        res.status(500).json({ error: 'Failed to process credit' });
    }
}
/** POST /transaction-status - Query transaction by Protocol Reference ID */
async function transactionStatus(req, res) {
    try {
        const { reference_id } = req.body;
        const tx = await txRepo().findOne({ where: { referenceId: reference_id }, order: { createdAt: 'DESC' } });
        if (!tx) {
            res.json({ state: 'UNKNOWN' });
            return;
        }
        res.json({ state: tx.type });
    }
    catch (e) {
        console.error('[transactionStatus]', e);
        res.status(500).json({ error: 'Failed to get status' });
    }
}
/** POST /reversal-request - Reverse a debit */
async function reversalRequest(req, res) {
    try {
        const { reference_id, debit_proof, idempotency_key } = req.body;
        const debitTx = await txRepo().findOne({ where: { referenceId: reference_id, type: 'DEBIT' } });
        if (!debitTx) {
            res.status(404).json({ error: 'Debit transaction not found' });
            return;
        }
        const account = await accountRepo().findOne({ where: { id: debitTx.accountId } });
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
        const bankSignature = (0, crypto_1.sign)(JSON.stringify(reversalConfirmation), privateKey);
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
    }
    catch (e) {
        console.error('[reversalRequest]', e);
        res.status(500).json({ error: 'Failed to process reversal' });
    }
}
//# sourceMappingURL=bankEndpoints.js.map