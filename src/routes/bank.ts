import { Router } from 'express';
import { rawBodyJson, requireConvertorSignature } from '../middleware/signature';
import * as bankEndpoints from '../controllers/bankEndpoints';

const router = Router();

router.post('/connection-request', rawBodyJson(), requireConvertorSignature, bankEndpoints.connectionRequest);
router.post('/auth-challenge-response', rawBodyJson(), requireConvertorSignature, bankEndpoints.authChallengeResponse);
router.get('/account-balance', requireConvertorSignature, bankEndpoints.accountBalance);
router.post('/debit-request', rawBodyJson(), requireConvertorSignature, bankEndpoints.debitRequest);
router.post('/credit-request', rawBodyJson(), requireConvertorSignature, bankEndpoints.creditRequest);
router.post('/transaction-status', rawBodyJson(), requireConvertorSignature, bankEndpoints.transactionStatus);
router.post('/reversal-request', rawBodyJson(), requireConvertorSignature, bankEndpoints.reversalRequest);

export default router;
