import { Router } from 'express';
import { interactuar } from '../controllers/interaction.controller.ts';
import { verificarToken } from '../middlewares/auth.middleware.ts';

const router = Router();

// POST /api/interacciones
router.post('/', verificarToken, interactuar);

export default router;