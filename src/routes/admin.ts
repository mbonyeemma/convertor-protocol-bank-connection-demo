import { Router } from 'express';
import * as adminController from '../controllers/adminController';

const router = Router();

router.get('/accounts', adminController.listAccounts);
router.post('/accounts', adminController.createAccount);
router.get('/accounts/:accountId/balance', adminController.getAccountBalance);
router.get('/transactions', adminController.listTransactions);
router.get('/connection-tokens', adminController.listConnectionTokens);

export default router;
