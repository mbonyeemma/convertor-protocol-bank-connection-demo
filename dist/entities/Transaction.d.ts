export declare class BankTransaction {
    id: string;
    referenceId: string;
    type: string;
    accountId: string | null;
    amount: string | null;
    currency: string | null;
    payload: string | null;
    createdAt: Date;
}
