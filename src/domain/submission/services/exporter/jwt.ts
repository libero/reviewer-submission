import { sign } from 'jsonwebtoken';

// MECA workaround for issue https://github.com/libero/reviewer/issues/1165
export const encode = (secret: string, payload: object, expiresIn: string): string => {
    return sign(payload, secret, { expiresIn, issuer: 'continuum-adaptor' });
};
