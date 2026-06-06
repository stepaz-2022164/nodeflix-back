import { driver, DATABASE_NAME } from '../config/neo4j.ts';
import { obtenerSeriesPopulares } from './tmdb.service.ts';

export const obtenerRecomendaciones = async (idUsuario: string) => {
    const session = driver.session({ database: DATABASE_NAME });
    
    try {
        const query = `
            // 1. RANDOM WALK CORE
              MATCH (u:Usuario {id: $idUsuario})-[r:LE_GUSTA|ES_FAVORITA|QUIERE_VER]->(sVisto:Serie)-[:PERTENECE_A]->(g:Genero)<-[:PERTENECE_A]-(candidata:Serie)
              WHERE NOT (u)-[]->(candidata)

              WITH u, candidata, g,
                  CASE type(r) 
                      WHEN 'ES_FAVORITA' THEN 3.0 
                      WHEN 'LE_GUSTA' THEN 2.0 
                      WHEN 'QUIERE_VER' THEN 1.0
                      ELSE 0.5 
                  END AS pesoFuerza

              // Si la suma es 100, el log10 lo reduce a 2. Si es 1000, lo reduce a 3. 
              WITH u, candidata, log10(sum(pesoFuerza) + 1.0) * 5.0 AS scoreContenido

              // 2. AGREGADO COLABORATIVO
              OPTIONAL MATCH (u)-[:LE_GUSTA|ES_FAVORITA]->(:Serie)<-[:LE_GUSTA|ES_FAVORITA]-(vecino:Usuario)-[:LE_GUSTA|ES_FAVORITA]->(candidata)
              WITH candidata, scoreContenido, count(DISTINCT vecino) AS vecinosComunes
              WITH candidata, scoreContenido, log10(vecinosComunes + 1.0) * 4.0 AS scoreColaborativo

              // 3. INYECCIÓN DE SERENDIPIA
              WITH candidata, scoreContenido, scoreColaborativo, (rand() * 5.0) AS factorSerendipia

              // 4. ECUACIÓN FINAL ESTABILIZADA
              WITH candidata, scoreContenido, scoreColaborativo, factorSerendipia,
                  (scoreContenido * 1.5) + (scoreColaborativo * 1.2) + factorSerendipia AS scoreTotal

              WHERE scoreTotal > 2.0
              ORDER BY scoreTotal DESC
              LIMIT 20

              RETURN candidata.id_tmdb AS id_tmdb, 
                    candidata.titulo AS titulo, 
                    candidata.poster AS poster, 
                    candidata.youtube_key AS youtube_key, 
                    scoreTotal
        `;
        
        const resultado = await session.run(query, { idUsuario });

        const recomendaciones = resultado.records.map(record => {
            const idCrudo = record.get('id_tmdb');
            const scoreCrudo = record.get('scoreTotal');

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
            console.log(`Usuario ${idUsuario} sin historial suficiente. Inyectando populares aleatorias.`);
            const randomPage = Math.floor(Math.random() * 4) + 1;
            return await obtenerSeriesPopulares(randomPage); 
        }

        return recomendaciones;

    } finally {
        await session.close();
    }
};