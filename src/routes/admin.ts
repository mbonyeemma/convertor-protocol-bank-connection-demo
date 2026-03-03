import { Router } from 'express';
import * as adminController from '../controllers/adminController';

const router = Router();

router.get('/accounts', adminController.listAccounts);
router.post('/accounts', adminController.createAccount);
router.get('/accounts/validate/:accountNumber', adminController.validateAccount);
router.get('/accounts/:accountId/balance', adminController.getAccountBalance);
router.post('/accounts/:accountNumber/deposit', adminController.depositToAccount);
router.get('/transactions', adminController.listTransactions);
router.get('/connection-tokens', adminController.listConnectionTokens);

// Config endpoints
router.get('/config', adminController.getConfig);
router.post('/config', adminController.updateConfig);
router.post('/config/keys', adminController.updateKeys);
router.get('/config/registration', adminController.getRegistrationStatus);

export default router;
