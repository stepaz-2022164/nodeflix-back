import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as jsonwebtoken from 'jsonwebtoken';

// Extendemos la interfaz Request de Express para poder guardar los datos del usuario
export interface AuthRequest extends Request {
    usuario?: string | jsonwebtoken.JwtPayload;
}

export const verificarToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    // El token suele venir en los headers como: "Bearer eyJhbGciOiJIUzI1Ni..."
    const headerAuth = req.headers.authorization;

    if (!headerAuth || !headerAuth.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Acceso denegado. No hay token válido.' });
        return;
    }

    const token = headerAuth.split(' ')[1];

    try {
        const firma = process.env.JWT_SECRET || 'secreto_por_defecto';
        // Verificamos si el token es real y no ha expirado
        const payload = jsonwebtoken.verify(token, firma);
        
        // Guardamos los datos desencriptados en la petición para que el siguiente controlador los use
        req.usuario = payload;
        
        next(); // Le decimos a Express: "Todo en orden, déjalo pasar a la ruta"
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token inválido o expirado. Vuelve a iniciar sesión.' });
    }
};