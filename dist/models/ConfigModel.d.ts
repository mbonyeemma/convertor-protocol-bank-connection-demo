export declare function getConfig(key: string): Promise<string | null>;
export declare function setConfig(key: string, value: string, description?: string): Promise<void>;
export declare function getAllConfig(): Promise<Record<string, string>>;
