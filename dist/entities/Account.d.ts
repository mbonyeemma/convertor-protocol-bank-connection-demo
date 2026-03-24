export declare class Account {
    id: string;
    userId: string;
    userName: string;
    accountNumber: string;
    /** E.164-style digits only (e.g. 256700123456) for phone-to-account resolution */
    phoneNumber: string | null;
    balance: string;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
}
