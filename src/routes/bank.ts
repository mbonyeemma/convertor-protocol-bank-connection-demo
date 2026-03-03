import { Router } from 'express';
import { requireConvertorSignature } from '../middleware/signature';
import * as bankEndpoints from '../controllers/bankEndpoints';

const router = Router();

router.post('/connection-request', requireConvertorSignature, bankEndpoints.connectionRequest);
router.post('/auth-challenge-response', requireConvertorSignature, bankEndpoints.authChallengeResponse);
router.get('/account-balance', requireConvertorSignature, bankEndpoints.accountBalance);
router.post('/debit-request', requireConvertorSignature, bankEndpoints.debitRequest);
router.post('/credit-request', requireConvertorSignature, bankEndpoints.creditRequest);
router.post('/transaction-status', requireConvertorSignature, bankEndpoints.transactionStatus);
router.post('/reversal-request', requireConvertorSignature, bankEndpoints.reversalRequest);
router.post('/verify-account', requireConvertorSignature, bankEndpoints.verifyAccount);
router.get('/balance/:accountNumber', requireConvertorSignature, bankEndpoints.balanceByAccountNumber);

export default router;
