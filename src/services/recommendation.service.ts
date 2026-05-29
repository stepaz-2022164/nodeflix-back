import { driver, DATABASE_NAME } from '../config/neo4j.ts';

export const obtenerRecomendaciones = async (idUsuario: string) => {
    const session = driver.session({ database: DATABASE_NAME });
    
    try {
        // EL ALGORITMO HÍBRIDO EN CYPHER
        const query = `
            // PASO 1: Filtrado Colaborativo (Buscar a "almas gemelas" de series)
            // Encontramos otros usuarios que les gustan las mismas series que a nuestro usuario
            MATCH (u:Usuario {id: $idUsuario})-[:LE_GUSTA|:ES_FAVORITA]->(sComun:Serie)<-[:LE_GUSTA|:ES_FAVORITA]-(otroU:Usuario)
            
            // Buscamos qué OTRAS series le gustan a esos usuarios similares
            MATCH (otroU)-[:LE_GUSTA|:ES_FAVORITA]->(rec:Serie)
            
            // Descartamos las series que nuestro usuario ya vio o interactuó
            WHERE NOT (u)-[]->(rec)
            
            // Calculamos un puntaje inicial basado en cuántos usuarios similares la recomiendan
            WITH u, rec, count(DISTINCT otroU) AS scoreColaborativo

            // PASO 2: Filtrado por Contenido (Potenciador por géneros)
            // Opcional (MATCH) para ver si la serie recomendada comparte géneros con las favoritas del usuario original
            OPTIONAL MATCH (u)-[:LE_GUSTA|:ES_FAVORITA]->(:Serie)-[:PERTENECE_A]->(g:Genero)<-[:PERTENECE_A]-(rec)
            WITH rec, scoreColaborativo, count(DISTINCT g) AS scoreContenido

            // PASO 3: Ponderación y Ordenamiento
            // Le damos más peso al colaborativo (x2), y sumamos las coincidencias de género
            WITH rec, (scoreColaborativo * 2) + scoreContenido AS scoreTotal
            ORDER BY scoreTotal DESC
            LIMIT 10 // Solo devolvemos las 10 mejores recomendaciones

            // Retornamos el objeto limpio para Angular
            RETURN rec.id_tmdb AS id_tmdb, 
                   rec.titulo AS titulo, 
                   rec.poster AS poster, 
                   rec.youtube_key AS youtube_key, 
                   scoreTotal
        `;
        
        const resultado = await session.run(query, { idUsuario });

        // Transformamos los registros de Neo4j en un arreglo normal de JavaScript
        const recomendaciones = resultado.records.map(record => ({
            id_tmdb: record.get('id_tmdb').toNumber(), // Convertimos el entero de Neo4j a número normal
            titulo: record.get('titulo'),
            poster: record.get('poster'),
            youtube_key: record.get('youtube_key'),
            score: record.get('scoreTotal').toNumber()
        }));

        return recomendaciones;

    } finally {
        await session.close();
    }
};