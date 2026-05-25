// ==========================================
// SERVICIO DE TMDB (Lectura de Datos)
// ==========================================

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Función auxiliar para no repetir la validación de la API Key
 * y el idioma en cada petición.
 */
const armarUrl = (endpoint: string, parametrosExtra: string = '') => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
        throw new Error('Falta la TMDB_API_KEY en el archivo .env');
    }
    return `${TMDB_BASE_URL}${endpoint}?api_key=${apiKey}&language=es-MX${parametrosExtra}`;
};

// ---------------------------------------------------------
// 1. OBTENER SERIES POPULARES (Para la pantalla de inicio)
// ---------------------------------------------------------
export const obtenerSeriesPopulares = async (pagina: number = 1) => {
    const url = armarUrl('/tv/popular', `&page=${pagina}`);
    const respuesta = await fetch(url);
    
    if (!respuesta.ok) throw new Error('Error al obtener populares de TMDB');
    
    const datos = await respuesta.json();
    
    // Mapeamos para devolver solo lo que Angular necesita
    return datos.results.map((serie: any) => ({
        id_tmdb: serie.id,
        titulo: serie.name,
        poster: serie.poster_path ? `https://image.tmdb.org/t/p/w500${serie.poster_path}` : null,
        descripcion: serie.overview
    }));
};

// ---------------------------------------------------------
// 2. BUSCAR SERIES POR NOMBRE (Para la barra de búsqueda)
// ---------------------------------------------------------
export const buscarSeries = async (query: string, pagina: number = 1) => {
    // encodeURIComponent asegura que si el usuario busca "Breaking Bad", 
    // el espacio se convierta en "%20" para que la URL no se rompa.
    const querySeguro = encodeURIComponent(query);
    const url = armarUrl('/search/tv', `&query=${querySeguro}&page=${pagina}`);
    
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error('Error en la búsqueda de TMDB');
    
    const datos = await respuesta.json();
    
    return datos.results.map((serie: any) => ({
        id_tmdb: serie.id,
        titulo: serie.name,
        poster: serie.poster_path ? `https://image.tmdb.org/t/p/w500${serie.poster_path}` : null,
        fecha_salida: serie.first_air_date
    }));
};

// ---------------------------------------------------------
// 3. OBTENER DETALLES Y TRÁILER (Para Lazy Loading y Neo4j)
// ---------------------------------------------------------
export const obtenerDetallesSerie = async (idTmdb: number) => {
    // Hacemos DOS peticiones simultáneas usando Promise.all para que sea más rápido
    const urlDetalles = armarUrl(`/tv/${idTmdb}`);
    const urlVideos = armarUrl(`/tv/${idTmdb}/videos`);

    const [resDetalles, resVideos] = await Promise.all([
        fetch(urlDetalles),
        fetch(urlVideos)
    ]);

    if (!resDetalles.ok) throw new Error(`Error al obtener detalles de la serie ${idTmdb}`);

    const detalles = await resDetalles.json();
    let videos = { results: [] as any[] };
    
    // Si la petición de videos falla, no rompemos todo, simplemente asumimos que no hay videos
    if (resVideos.ok) {
        videos = await resVideos.json();
    }

    // Buscamos específicamente el primer video que sea de tipo "Trailer" en YouTube
    const trailer = videos.results.find((vid: any) => vid.site === 'YouTube' && vid.type === 'Trailer');

    // Retornamos el objeto consolidado listo para ser insertado en Neo4j mediante Cypher
    return {
        id_tmdb: detalles.id,
        titulo: detalles.name,
        descripcion: detalles.overview,
        calificacion: detalles.vote_average,
        fecha_salida: detalles.first_air_date,
        poster: detalles.poster_path ? `https://image.tmdb.org/t/p/w500${detalles.poster_path}` : null,
        youtube_key: trailer ? trailer.key : null,
        generos: detalles.genres // Viene como un arreglo: [{ id: 18, name: 'Drama' }, ...]
    };
};