import { Router } from 'express';
import { getPopulares, searchSeries, getDetalles } from '../controllers/series.controller.ts';

const router = Router();

// GET /api/series/populares
router.get('/populares', getPopulares);

// GET /api/series/buscar
router.get('/buscar', searchSeries);

// GET /api/series/:id  <-- (Ejemplo: /api/series/1399)
router.get('/:id', getDetalles);

export default router;