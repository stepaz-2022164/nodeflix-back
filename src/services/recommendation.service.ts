import { driver, DATABASE_NAME } from '../config/neo4j.ts';
import { obtenerSeriesPopulares } from './tmdb.service.ts';

export const obtenerRecomendaciones = async (idUsuario: string) => {
    const session = driver.session({ database: DATABASE_NAME });
    
    try {
        // EL ALGORITMO HÍBRIDO EN CYPHER
        const query = `
            // PASO 1: Filtrado por Contenido (La Base Sólida)
            MATCH (u:Usuario {id: $idUsuario})-[:LE_GUSTA|:ES_FAVORITA]->(:Serie)-[:PERTENECE_A]->(g:Genero)
            MATCH (rec:Serie)-[:PERTENECE_A]->(g)
            WHERE NOT (u)-[]->(rec)
            WITH u, rec, count(DISTINCT g) AS scoreContenido

            // PASO 2: Filtrado Colaborativo (El Multiplicador Opcional)
            OPTIONAL MATCH (u)-[:LE_GUSTA|:ES_FAVORITA]->(sComun:Serie)<-[:LE_GUSTA|:ES_FAVORITA]-(otroU:Usuario)-[:LE_GUSTA|:ES_FAVORITA]->(rec)
            WITH rec, scoreContenido, count(DISTINCT otroU) AS scoreColaborativo

            // PASO 3: Ponderación y Ordenamiento
            WITH rec, scoreContenido + (scoreColaborativo * 2) AS scoreTotal
            ORDER BY scoreTotal DESC
            LIMIT 10

            RETURN rec.id_tmdb AS id_tmdb, 
                rec.titulo AS titulo, 
                rec.poster AS poster, 
                rec.youtube_key AS youtube_key, 
                scoreTotal
        `;
        
        const resultado = await session.run(query, { idUsuario });

        const recomendaciones = resultado.records.map(record => {
            // 1. Extraemos los valores crudos
            const idCrudo = record.get('id_tmdb');
            const scoreCrudo = record.get('scoreTotal');

            // 2. Evaluamos si son objetos de Neo4j o números normales de JS
            const idSeguro = (idCrudo && typeof idCrudo.toNumber === 'function') 
                             ? idCrudo.toNumber() 
                             : Number(idCrudo);

            const scoreSeguro = (scoreCrudo && typeof scoreCrudo.toNumber === 'function') 
                             ? scoreCrudo.toNumber() 
                             : Number(scoreCrudo);

            return {
                id_tmdb: idSeguro,
                titulo: record.get('titulo'),
                poster: record.get('poster'),
                youtube_key: record.get('youtube_key'),
                score: scoreSeguro
            };
        });

        if (recomendaciones.length === 0) {
            console.log(`Usuario ${idUsuario} sin historial suficiente. Retornando populares de TMDB.`);
            return await obtenerSeriesPopulares(1); 
        }

        return recomendaciones;

    } finally {
        await session.close();
    }
};