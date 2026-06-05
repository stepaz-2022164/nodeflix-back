import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import seriesRoutes from './routes/series.routes.ts';
import { conectarDB } from './config/neo4j.ts';
import userRoutes from './routes/users.routes.ts';
import interactionRoutes from './routes/interaction.routes.ts';
import recommendationRoutes from './routes/recommendation.routes.ts';

const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// Middlewares
app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'] 
}));
app.use(express.json());

// Rutas
app.use('/api/series', seriesRoutes);
app.use('/api/user', userRoutes);
app.use('/api/interacciones', interactionRoutes);
app.use('/api/recomendaciones', recommendationRoutes);

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`✅ Rutas de series activas en http://localhost:${PORT}/api/series`);
    conectarDB();
});

