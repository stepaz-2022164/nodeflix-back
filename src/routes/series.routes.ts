import { Router } from 'express';
import { getPopulares, searchSeries, getDetalles } from '../controllers/series.controller.ts';

const router = Router();

// IMPORTANTE: El orden importa en Express. 
// Las rutas fijas (/populares, /buscar) deben ir ANTES que las rutas con parámetros dinámicos (/:id)

// GET /api/series/populares
router.get('/populares', getPopulares);

// GET /api/series/buscar
router.get('/buscar', searchSeries);

// GET /api/series/:id  <-- (Ejemplo: /api/series/1399)
router.get('/:id', getDetalles);

export default router;