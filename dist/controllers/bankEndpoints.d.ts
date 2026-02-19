import { Request, Response } from 'express';
/** POST /connection-request - Convertor initiates user bank connection */
export declare function connectionRequest(req: Request, res: Response): Promise<void>;
/** POST /auth-challenge-response - User completes OTP, bank returns token */
export declare function authChallengeResponse(req: Request, res: Response): Promise<void>;
/** GET /account-balance - Return balance for transfer eligibility */
export declare function accountBalance(req: Request, res: Response): Promise<void>;
/** POST /debit-request - Lock then debit funds */
export declare function debitRequest(req: Request, res: Response): Promise<void>;
/** POST /credit-request - Credit funds to beneficiary */
export declare function creditRequest(req: Request, res: Response): Promise<void>;
/** POST /transaction-status - Query transaction by Protocol Reference ID */
export declare function transactionStatus(req: Request, res: Response): Promise<void>;
/** POST /reversal-request - Reverse a debit */
export declare function reversalRequest(req: Request, res: Response): Promise<void>;
