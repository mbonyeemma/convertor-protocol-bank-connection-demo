import { Router } from 'express';
import * as bankEndpoints from '../controllers/bankEndpoints';

const router = Router();

router.post('/connection-request', bankEndpoints.connectionRequest);
router.post('/auth-challenge-response', bankEndpoints.authChallengeResponse);
router.get('/account-balance', bankEndpoints.accountBalance);
router.post('/debit-request', bankEndpoints.debitRequest);
router.post('/credit-request', bankEndpoints.creditRequest);
router.post('/transaction-status', bankEndpoints.transactionStatus);
router.post('/reversal-request', bankEndpoints.reversalRequest);
router.post('/verify-account', bankEndpoints.verifyAccount);
router.get('/balance/:accountNumber', bankEndpoints.balanceByAccountNumber);

export default router;
