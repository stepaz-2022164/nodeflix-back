import { Router } from 'express';
import { getRecomendaciones } from '../controllers/recommendation.controller.ts';
import { verificarToken } from '../middlewares/auth.middleware.ts';

const router = Router();

// GET /api/recomendaciones/:idUsuario
router.get('/:idUsuario', verificarToken, getRecomendaciones);

export default router;