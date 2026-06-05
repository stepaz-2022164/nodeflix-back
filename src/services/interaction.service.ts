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
        }

        // 🌟 NUEVA LÓGICA MULTI-INTERACCIÓN Y TOGGLE
        // 1. Verificamos si EXACTAMENTE esta interacción ya existe
        const checkRelQuery = `
            MATCH (u:Usuario {id: $idUsuario})-[r:${tipoInteraccion}]->(s:Serie {id_tmdb: $idTmdb})
            RETURN r
        `;
        const relResult = await session.run(checkRelQuery, { idUsuario, idTmdb });

        if (relResult.records.length > 0) {
            // Si el usuario vuelve a presionar el botón encendido, lo "apagamos" (Toggle Off)
            await session.run(
                `MATCH (u:Usuario {id: $idUsuario})-[r:${tipoInteraccion}]->(s:Serie {id_tmdb: $idTmdb}) DELETE r`,
                { idUsuario, idTmdb }
            );
            return { usuario: idUsuario, accion: 'REMOVIDA', serie: idTmdb };
        } else {
            // Si no existe, la creamos (Toggle On)
            // Regla: Si marcó NO_LE_GUSTA, borramos las positivas. Si es positiva, borramos NO_LE_GUSTA.
            if (tipoInteraccion === 'NO_LE_GUSTA') {
                await session.run(
                    `MATCH (u:Usuario {id: $idUsuario})-[r:LE_GUSTA|ES_FAVORITA|QUIERE_VER]->(s:Serie {id_tmdb: $idTmdb}) DELETE r`,
                    { idUsuario, idTmdb }
                );
            } else {
                await session.run(
                    `MATCH (u:Usuario {id: $idUsuario})-[r:NO_LE_GUSTA]->(s:Serie {id_tmdb: $idTmdb}) DELETE r`,
                    { idUsuario, idTmdb }
                );
            }

            const createRelQuery = `
                MATCH (u:Usuario {id: $idUsuario}), (s:Serie {id_tmdb: $idTmdb})
                MERGE (u)-[r:${tipoInteraccion}]->(s)
                RETURN u.nombre AS usuario, type(r) AS accion, s.titulo AS serie
            `;
            const result = await session.run(createRelQuery, { idUsuario, idTmdb });
            return result.records[0].toObject();
        }

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
        
        return resultado.records.map(record => {
            // 1. Extraemos el valor crudo del ID
            const idCrudo = record.get('id_tmdb');
            
            // 2. Aplicamos la evaluación segura
            const idSeguro = (idCrudo && typeof idCrudo.toNumber === 'function') 
                             ? idCrudo.toNumber() 
                             : Number(idCrudo);

            return {
                id_tmdb: idSeguro,
                titulo: record.get('titulo'),
                interaccion: record.get('interaccion')
            };
        });
    } finally {
        await session.close();
    }
};