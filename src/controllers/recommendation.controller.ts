import { type Request, type Response } from 'express';
import { obtenerRecomendaciones } from '../services/recommendation.service.ts';

export const getRecomendaciones = async (req: Request, res: Response): Promise<void> => {
    try {
        const idUsuario = req.params.idUsuario;

        if (!idUsuario) {
            res.status(400).json({ success: false, message: 'Se requiere el ID del usuario.' });
            return;
        }

        const recomendaciones = await obtenerRecomendaciones(idUsuario);
        
        res.status(200).json({ success: true, data: recomendaciones });
    } catch (error: any) {
        console.error("Error al obtener recomendaciones:", error.message);
        res.status(500).json({ success: false, message: 'Error interno del servidor al calcular recomendaciones.' });
    }
};