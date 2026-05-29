import { type Request, type Response } from 'express';
import { registrarInteraccion } from '../services/interaction.service.ts';

export const interactuar = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idUsuario, idTmdb, tipoInteraccion } = req.body;

        if (!idUsuario || !idTmdb || !tipoInteraccion) {
            res.status(400).json({ success: false, message: 'Faltan parámetros obligatorios.' });
            return;
        }

        // Convertimos idTmdb a número por si acaso Angular lo envía como texto
        const interaccion = await registrarInteraccion(idUsuario, Number(idTmdb), tipoInteraccion);
        
        res.status(201).json({ success: true, data: interaccion });
    } catch (error: any) {
        console.error("Error en interacción:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};