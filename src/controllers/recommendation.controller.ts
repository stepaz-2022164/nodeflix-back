import { type Request, type Response } from 'express';
import { obtenerRecomendaciones } from '../services/recommendation.service.ts';
import { type AuthRequest } from '../middlewares/auth.middleware.ts';

export const getRecomendaciones = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const idUsuario = (req.usuario as any).id;

        if (!idUsuario) {
            res.status(401).json({ success: false, message: 'Usuario no autenticado o token inválido.' });
            return;
        }

        const recomendaciones = await obtenerRecomendaciones(idUsuario);
        
        res.status(200).json({ success: true, data: recomendaciones });
    } catch (error: any) {
        console.error("Error al obtener recomendaciones:", error.message);
        res.status(500).json({ success: false, message: 'Error interno del servidor al calcular recomendaciones.' });
    }
};