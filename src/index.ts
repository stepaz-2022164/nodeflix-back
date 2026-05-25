import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Esto carga automáticamente las variables de tu archivo .env
import seriesRoutes from './routes/series.routes.ts';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Permite peticiones desde otros puertos (como el 4200 de Angular)
app.use(express.json()); // Permite que tu backend entienda JSON

// Rutas
app.use('/api/series', seriesRoutes);

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`✅ Rutas de series activas en http://localhost:${PORT}/api/series`);
});