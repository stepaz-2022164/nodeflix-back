import { Router } from 'express';
import { interactuar, getInteraccionesUsuario } from '../controllers/interaction.controller.ts';
import { verificarToken } from '../middlewares/auth.middleware.ts';

const router = Router();

// POST /api/interacciones
router.post('/', verificarToken, interactuar);

// GET /api/interacciones/:idUsuario (Leer historial para el Frontend)
router.get('/', verificarToken, getInteraccionesUsuario);

export default router;