import { type Request, type Response, type NextFunction } from 'express';
import jsonwebtoken from 'jsonwebtoken';

export interface AuthRequest extends Request {
    usuario?: string | jsonwebtoken.JwtPayload;
}

export const verificarToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const headerAuth = req.headers.authorization;

    if (!headerAuth || !headerAuth.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Acceso denegado. No hay token válido.' });
        return;
    }

    const token = headerAuth.split(' ')[1];

    try {
        const firma = process.env.JWT_SECRET || 'secreto_por_defecto';
        const payload = jsonwebtoken.verify(token, firma);
        req.usuario = payload;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token inválido o expirado. Vuelve a iniciar sesión.' });
    }
};