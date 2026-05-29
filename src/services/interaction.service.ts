import { driver, DATABASE_NAME } from '../config/neo4j.ts';
import { obtenerDetallesSerie } from './tmdb.service.ts';

export const registrarInteraccion = async (idUsuario: string, idTmdb: number, tipoInteraccion: string) => {
    // 1. Seguridad: Validar el tipo de interacción para evitar inyección de código en Cypher
    const interaccionesValidas = ['LE_GUSTA', 'ES_FAVORITA', 'QUIERE_VER', 'NO_LE_GUSTA'];
    if (!interaccionesValidas.includes(tipoInteraccion)) {
        throw new Error('Tipo de interacción no válido.');
    }

    const session = driver.session({ database: DATABASE_NAME });
    
    try {
        // 2. Verificamos si la serie ya existe en nuestro grafo
        const checkQuery = `MATCH (s:Serie {id_tmdb: $idTmdb}) RETURN s`;
        const checkResult = await session.run(checkQuery, { idTmdb });

        // 3. ¡LA MAGIA DEL LAZY LOADING!
        if (checkResult.records.length === 0) {
            console.log(`⏳ Serie ${idTmdb} no existe en Neo4j. Importando desde TMDB...`);
            
            // Llamamos al servicio de la Fase 3
            const detalles = await obtenerDetallesSerie(idTmdb);

            // Guardamos la serie, iteramos sobre sus géneros (UNWIND) y creamos las relaciones
            const createSeriesQuery = `
                MERGE (s:Serie {id_tmdb: $idTmdb})
                ON CREATE SET 
                    s.titulo = $titulo,
                    s.poster = $poster,
                    s.youtube_key = $youtube_key
                WITH s
                UNWIND $generos AS genero
                MERGE (g:Genero {id_tmdb: genero.id})
                ON CREATE SET g.nombre = genero.name
                MERGE (s)-[:PERTENECE_A]->(g)
            `;
            
            await session.run(createSeriesQuery, {
                idTmdb: detalles.id_tmdb,
                titulo: detalles.titulo,
                poster: detalles.poster || '',
                youtube_key: detalles.youtube_key || '',
                generos: detalles.generos
            });
            console.log(`✅ Serie "${detalles.titulo}" importada correctamente.`);
        }

        // 4. Finalmente, creamos la interacción del usuario
        // Nota: El tipo de relación no se puede parametrizar con $, por eso lo concatenamos de forma segura
        const interactQuery = `
            MATCH (u:Usuario {id: $idUsuario})
            MATCH (s:Serie {id_tmdb: $idTmdb})
            MERGE (u)-[r:${tipoInteraccion}]->(s)
            RETURN u.nombre AS usuario, type(r) AS accion, s.titulo AS serie
        `;
        
        const result = await session.run(interactQuery, { idUsuario, idTmdb });
        
        if (result.records.length === 0) {
            throw new Error('Error al registrar. Verifica que el ID del usuario exista en Neo4j.');
        }

        return result.records[0].toObject();
    } finally {
        await session.close();
    }
};