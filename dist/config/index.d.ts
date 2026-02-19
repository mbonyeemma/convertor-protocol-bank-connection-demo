import 'dotenv/config';
export declare const config: {
    readonly env: string;
    readonly port: number;
    readonly bankCode: string;
    readonly bankName: string;
    readonly db: {
        readonly host: string;
        readonly port: number;
        readonly user: string;
        readonly password: string;
        readonly database: string;
    };
    readonly convertor: {
        readonly apiUrl: string;
    };
    readonly keys: {
        readonly bankPrivateKeyPath: string;
        readonly convertorPublicKeyPath: string;
        readonly bankPrivateKey: string;
        readonly convertorPublicKey: string;
    };
};
