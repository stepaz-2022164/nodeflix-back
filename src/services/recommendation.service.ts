import { driver, DATABASE_NAME } from '../config/neo4j.ts';
import { obtenerSeriesPopulares } from './tmdb.service.ts';

export const obtenerRecomendaciones = async (idUsuario: string) => {
  const session = driver.session({ database: DATABASE_NAME });

  try {
   const query = `
            // PASO 1: CREAR PERFIL PONDERADO DEL USUARIO
            // Contamos cuántas veces se repite cada género en el historial del usuario
            MATCH (u:Usuario {id: $idUsuario})-[:LE_GUSTA|:ES_FAVORITA]->(s:Serie)-[:PERTENECE_A]->(g:Genero)
            WITH u, g, count(s) AS pesoGenero
            
            // PASO 2: BUSCAR CANDIDATOS
            // Buscamos series que no haya visto y que compartan esos géneros
            MATCH (rec:Serie)-[:PERTENECE_A]->(g)
            WHERE NOT (u)-[]->(rec)
            
            // PASO 3: CALIFICACIÓN MATEMÁTICA
            // Sumamos el peso de los géneros compartidos. (Ej: Si coincide en su género favorito, suma mucho)
            WITH u, rec, sum(pesoGenero) AS scoreContenido
            
            // FILTRO DE RIGUROSIDAD: Exigimos un score mínimo para evitar coincidencias débiles
            WHERE scoreContenido >= 2
            
            // PASO 4: FILTRADO COLABORATIVO (El toque mágico social)
            OPTIONAL MATCH (u)-[:LE_GUSTA|:ES_FAVORITA]->(:Serie)<-[:LE_GUSTA|:ES_FAVORITA]-(otroU:Usuario)-[:LE_GUSTA|:ES_FAVORITA]->(rec)
            WITH rec, scoreContenido, count(DISTINCT otroU) AS scoreColaborativo
            
            // Damos mucho más valor al colaborativo porque significa que a humanos reales con gustos similares les gustó
            WITH rec, scoreContenido + (scoreColaborativo * 4) AS scoreTotal
            ORDER BY scoreTotal DESC
            LIMIT 12

            RETURN rec.id_tmdb AS id_tmdb, 
                rec.titulo AS titulo, 
                rec.poster AS poster, 
                rec.youtube_key AS youtube_key, 
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
      console.log(`Usuario ${idUsuario} sin historial suficiente. Retornando populares de TMDB.`);
      return await obtenerSeriesPopulares(1);
    }

    return recomendaciones;

  } finally {
    await session.close();
  }
};