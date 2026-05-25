import { Router } from 'express';
import { registro, login } from '../controllers/users.controller.ts';

const router = Router();

// POST /api/usuarios/registro
router.post('/registro', registro);

// POST /api/usuarios/login
router.post('/login', login);

export default router;