import 'dotenv/config';
export declare function setDbConfigCache(cache: Record<string, string>): void;
export declare const config: {
    readonly env: string;
    readonly port: number;
    readonly db: {
        readonly host: string;
        readonly port: number;
        readonly user: string;
        readonly password: string;
        readonly database: string;
    };
    readonly keys: {
        readonly bankPrivateKeyPath: string;
        readonly convertorPublicKeyPath: string;
        readonly bankPrivateKey: string;
        readonly convertorPublicKey: string;
        readonly getBankPrivateKey: () => Promise<string>;
        readonly getConvertorPublicKey: () => Promise<string>;
    };
    readonly getBankCode: () => string;
    readonly getBankName: () => string;
    readonly getConvertorApiUrl: () => string;
};
