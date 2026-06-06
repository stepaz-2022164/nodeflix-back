import { type Request, type Response } from 'express';
import { registrarUsuario, loginUsuario } from '../services/user.service.ts';

export const registro = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.body.correo || !req.body.password || !req.body.nombre) {
            res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
            return;
        }

        const nuevoUsuario = await registrarUsuario(req.body);
        res.status(201).json({ success: true, data: nuevoUsuario });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.body.correo || !req.body.password) {
            res.status(400).json({ success: false, message: 'Faltan credenciales' });
            return;
        }

        const usuario = await loginUsuario(req.body.correo, req.body.password);
        res.status(200).json({ success: true, data: usuario });
    } catch (error: any) {
        res.status(401).json({ success: false, message: error.message });
    }
};