import { type Request, type Response } from 'express';
import { obtenerSeriesPopulares, buscarSeries, obtenerDetallesSerie } from '../services/tmdb.service.ts';

export const getPopulares = async (req: Request, res: Response) => {
    try {
        const pagina = Number(req.query.page) || 1; 
        const series = await obtenerSeriesPopulares(pagina);
        
        res.status(200).json({ success: true, data: series });
    } catch (error: any) {
        console.error("Error en getPopulares:", error.message);
        res.status(500).json({ success: false, message: 'Error al obtener series populares' });
    }
};

export const searchSeries = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = req.query.query as string;
        const pagina = Number(req.query.page) || 1;

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

export const getDetalles = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const serie = await obtenerDetallesSerie(id);
        
        res.status(200).json({ success: true, data: serie });
    } catch (error: any) {
        console.error("Error en getDetalles:", error.message);
        res.status(500).json({ success: false, message: 'Error al obtener los detalles de la serie' });
    }
};