import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

const authenticate = (secret: string) => (req: Request, _res: Response, next: NextFunction): void => {
    try {
        const token = (req.headers.authorization || '').split(' ')[1];
        verify(token, secret);
        return next();
    } catch (e) {
        return next(e);
    }
};
export default authenticate;
