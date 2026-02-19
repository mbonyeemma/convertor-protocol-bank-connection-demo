import { Request, Response, NextFunction } from 'express';
export declare function requireConvertorSignature(req: Request, res: Response, next: NextFunction): void;
export declare function rawBodyJson(): (req: Request, res: Response, next: NextFunction) => void;
