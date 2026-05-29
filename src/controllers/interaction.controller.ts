import { type Request, type Response } from 'express';
import { registrarInteraccion, obtenerInteraccionesUsuario } from '../services/interaction.service.ts';
import { type AuthRequest } from '../middlewares/auth.middleware.ts';

export const interactuar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { idTmdb, tipoInteraccion } = req.body;
        const idUsuario = (req.usuario as any).id; 

        if (!idUsuario || !idTmdb || !tipoInteraccion) {
            res.status(400).json({ success: false, message: 'Faltan parámetros obligatorios.' });
            return;
        }

        const interaccion = await registrarInteraccion(idUsuario, Number(idTmdb), tipoInteraccion);
        
        res.status(201).json({ success: true, data: interaccion });
    } catch (error: any) {
        console.error("Error en interacción:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

export const getInteraccionesUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const idUsuario = (req.usuario as any).id;

        if (!idUsuario) {
            res.status(400).json({ success: false, message: 'Falta el ID del usuario.' });
            return;
        }

        const interacciones = await obtenerInteraccionesUsuario (idUsuario);
        
        res.status(200).json({ success: true, data: interacciones });
    } catch (error: any) {
        console.error("Error al obtener interacciones:", error.message);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};