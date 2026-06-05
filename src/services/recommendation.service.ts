import { driver, DATABASE_NAME } from '../config/neo4j.ts';
import { obtenerSeriesPopulares } from './tmdb.service.ts';

/**
 * RANDOM WALK SOBRE EL GRAFO DE GÉNEROS
 *
 * Algoritmo en 3 saltos:
 *   Semilla (serie interactuada)
 *     → Primer salto: géneros de la semilla   (peso * rand())
 *     → Segundo salto: candidatos de esos géneros
 *     → Boost: filtrado colaborativo (usuarios similares)
 *
 * El uso de rand() en los pesos garantiza que cada llamada
 * explore caminos diferentes del grafo, produciendo resultados
 * variados sin perder la relevancia para el usuario.
 */
export const obtenerRecomendaciones = async (idUsuario: string) => {
  const session = driver.session({ database: DATABASE_NAME });

  try {
    const query = `
      // ================================================================
      // PASO 1: SEMILLAS — series con interacción positiva del usuario
      // ES_FAVORITA pesa 3x más que LE_GUSTA en el walk
      // ================================================================
      MATCH (u:Usuario {id: $idUsuario})-[r:LE_GUSTA|ES_FAVORITA]->(semilla:Serie)
      WITH u, semilla,
           CASE type(r) WHEN 'ES_FAVORITA' THEN 3.0 ELSE 1.0 END AS pesoInteraccion

      // ================================================================
      // PASO 2: PRIMER SALTO — de series a géneros
      // rand() introduce aleatoriedad: cada género recibe un peso
      // distinto en cada llamada, creando caminos de exploración únicos
      // ================================================================
      MATCH (semilla)-[:PERTENECE_A]->(genero:Genero)
      WITH u, genero,
           sum(pesoInteraccion) * (0.3 + rand() * 1.4) AS pesoWalk

      // Solo exploramos los géneros con mayor peso en este walk
      // El subconjunto varía entre llamadas gracias al rand()
      ORDER BY pesoWalk DESC
      LIMIT 8

      // ================================================================
      // PASO 3: SEGUNDO SALTO — de géneros a candidatos no vistos
      // Un candidato alcanzable desde múltiples géneros acumula más peso
      // ================================================================
      MATCH (genero)<-[:PERTENECE_A]-(candidato:Serie)
      WHERE NOT (u)-[]->(candidato)

      WITH u, candidato,
           sum(pesoWalk) AS scoreContenido

      WHERE scoreContenido >= 0.3

      // ================================================================
      // PASO 4: BOOST COLABORATIVO
      // Usuarios con gustos similares que también interactuaron con el
      // candidato aumentan su score (con ruido aleatorio incorporado)
      // ================================================================
      OPTIONAL MATCH (u)-[:LE_GUSTA|ES_FAVORITA]->(:Serie)
            <-[:LE_GUSTA|ES_FAVORITA]-(par:Usuario)
            -[:LE_GUSTA|ES_FAVORITA]->(candidato)
      WITH candidato,
           scoreContenido,
           count(DISTINCT par) AS pares

      // Score final: contenido del walk + boost social + ruido
      WITH candidato,
           (scoreContenido + pares * 4.0) * (0.8 + rand() * 0.4) AS scoreTotal

      ORDER BY scoreTotal DESC
      LIMIT 20

      RETURN candidato.id_tmdb  AS id_tmdb,
             candidato.titulo   AS titulo,
             candidato.poster   AS poster,
             candidato.youtube_key AS youtube_key,
             scoreTotal
    `;

    const resultado = await session.run(query, { idUsuario });

    const recomendaciones = resultado.records.map(record => {
      const idCrudo    = record.get('id_tmdb');
      const scoreCrudo = record.get('scoreTotal');

      const idSeguro = (idCrudo && typeof idCrudo.toNumber === 'function')
        ? idCrudo.toNumber()
        : Number(idCrudo);

      const scoreSeguro = (scoreCrudo && typeof scoreCrudo.toNumber === 'function')
        ? scoreCrudo.toNumber()
        : Number(scoreCrudo);

      return {
        id_tmdb:     idSeguro,
        titulo:      record.get('titulo'),
        poster:      record.get('poster'),
        youtube_key: record.get('youtube_key'),
        score:       scoreSeguro
      };
    });

    if (recomendaciones.length === 0) {
      console.log(
        `Usuario ${idUsuario} sin historial suficiente. ` +
        `Retornando populares de TMDB (página aleatoria).`
      );
      // Página aleatoria 1-4 para que el fallback tampoco sea siempre igual
      const paginaAleatoria = 1 + Math.floor(Math.random() * 4);
      return await obtenerSeriesPopulares(paginaAleatoria);
    }

    return recomendaciones;

  } finally {
    await session.close();
  }
};