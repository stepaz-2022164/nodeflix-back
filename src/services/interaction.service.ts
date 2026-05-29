import { driver, DATABASE_NAME } from '../config/neo4j.ts';
import { obtenerDetallesSerie } from './tmdb.service.ts';

export const registrarInteraccion = async (idUsuario: string, idTmdb: number, tipoInteraccion: string) => {
    const interaccionesValidas = ['LE_GUSTA', 'ES_FAVORITA', 'QUIERE_VER', 'NO_LE_GUSTA'];
    if (!interaccionesValidas.includes(tipoInteraccion)) {
        throw new Error('Tipo de interacción no válido.');
    }

    const session = driver.session({ database: DATABASE_NAME });
    
    try {
        const checkQuery = `MATCH (s:Serie {id_tmdb: $idTmdb}) RETURN s`;
        const checkResult = await session.run(checkQuery, { idTmdb });

        if (checkResult.records.length === 0) {
            console.log(`Serie ${idTmdb} no existe en Neo4j. Importando desde TMDB...`);

            const detalles = await obtenerDetallesSerie(idTmdb);

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
            console.log(`Serie "${detalles.titulo}" importada correctamente.`);
        }

        const interactQuery = `
            MATCH (u:Usuario {id: $idUsuario})
            MATCH (s:Serie {id_tmdb: $idTmdb})
            
            // Borrar cualquier relación anterior de interés hacia esta serie
            OPTIONAL MATCH (u)-[rAntigua:LE_GUSTA|ES_FAVORITA|QUIERE_VER|NO_LE_GUSTA]->(s)
            DELETE rAntigua
            
            // Pasar las variables a la siguiente etapa
            WITH u, s
            
            // Crear la nueva relación dinámicamente
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

export const obtenerInteraccionesUsuario = async (idUsuario: string) => {
    const session = driver.session({ database: DATABASE_NAME });
    
    try {
        const query = `
            MATCH (u:Usuario {id: $idUsuario})-[r]->(s:Serie)
            WHERE type(r) IN ['LE_GUSTA', 'ES_FAVORITA', 'QUIERE_VER', 'NO_LE_GUSTA']
            RETURN s.id_tmdb AS id_tmdb, s.titulo AS titulo, type(r) AS interaccion
        `;
        
        const resultado = await session.run(query, { idUsuario });
        
        return resultado.records.map(record => ({
            id_tmdb: record.get('id_tmdb').toNumber(),
            titulo: record.get('titulo'),
            interaccion: record.get('interaccion')
        }));
    } finally {
        await session.close();
    }
};