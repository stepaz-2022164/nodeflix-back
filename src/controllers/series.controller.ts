import { type Request, type Response } from 'express';
import { obtenerSeriesPopulares, buscarSeries, obtenerDetallesSerie } from '../services/tmdb.service.ts';

// 1. Controlador para Populares
export const getPopulares = async (req: Request, res: Response) => {
    try {
        // Leemos la página de la URL (?page=2). Si no viene, usamos la 1.
        const pagina = Number(req.query.page) || 1; 
        const series = await obtenerSeriesPopulares(pagina);
        
        res.status(200).json({ success: true, data: series });
    } catch (error: any) {
        console.error("Error en getPopulares:", error.message);
        res.status(500).json({ success: false, message: 'Error al obtener series populares' });
    }
};

// 2. Controlador para Búsqueda
export const searchSeries = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = req.query.query as string;
        const pagina = Number(req.query.page) || 1;

        // Validación: Si el usuario no mandó qué buscar, devolvemos un error 400 (Bad Request)
        if (!query) {
            res.status(400).json({ success: false, message: 'Falta el parámetro de búsqueda (query)' });
            return; 
        }

        const series = await buscarSeries(query, pagina);
        res.status(200).json({ success: true, data: series });
    } catch (error: any) {
        console.error("Error en searchSeries:", error.message);
        res.status(500).json({ success: false, message: 'Error al buscar series' });
    }
};

// 3. Controlador para Detalles (Lazy Loading)
export const getDetalles = async (req: Request, res: Response) => {
    try {
        // Leemos el ID de la URL (/api/series/1399)
        const id = Number(req.params.id);
        const serie = await obtenerDetallesSerie(id);
        
        res.status(200).json({ success: true, data: serie });
    } catch (error: any) {
        console.error("Error en getDetalles:", error.message);
        res.status(500).json({ success: false, message: 'Error al obtener los detalles de la serie' });
    }
};