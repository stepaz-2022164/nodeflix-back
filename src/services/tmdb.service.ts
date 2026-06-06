const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const POSTER_COMODIN = 'https://placehold.co/500x750/111111/EF4444?text=NODEFLIX';

const armarUrl = (endpoint: string, parametrosExtra: string = '') => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
        throw new Error('Falta la TMDB_API_KEY en el archivo .env');
    }
    return `${TMDB_BASE_URL}${endpoint}?api_key=${apiKey}&language=es-MX${parametrosExtra}`;
};

export const obtenerSeriesPopulares = async (pagina: number = 1) => {
    const filtros = `&page=${pagina}&sort_by=popularity.desc&vote_count.gte=250&without_genres=10767,10764,10763,99`;
    const url = armarUrl('/discover/tv', filtros);
    
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error('Error al obtener populares de TMDB');
    
    const datos = await respuesta.json();
    
    return datos.results.map((serie: any) => ({
        id_tmdb: serie.id,
        titulo: serie.name,
        poster: serie.poster_path ? `https://image.tmdb.org/t/p/w500${serie.poster_path}` : POSTER_COMODIN,
        descripcion: serie.overview
    }));
};

export const buscarSeries = async (query: string, pagina: number = 1) => {
    const querySeguro = encodeURIComponent(query);
    const url = armarUrl('/search/tv', `&query=${querySeguro}&page=${pagina}`);
    
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error('Error en la búsqueda de TMDB');
    
    const datos = await respuesta.json();
    
    // Filtramos manualmente la búsqueda para quitar series con 0 votos (fragmentos/errores de TMDB)
    const seriesValidas = datos.results.filter((serie: any) => serie.vote_count > 10);
    
    return seriesValidas.map((serie: any) => ({
        id_tmdb: serie.id,
        titulo: serie.name,
        poster: serie.poster_path ? `https://image.tmdb.org/t/p/w500${serie.poster_path}` : POSTER_COMODIN,
        fecha_salida: serie.first_air_date
    }));
};

export const obtenerDetallesSerie = async (idTmdb: number) => {
    const urlDetalles = armarUrl(`/tv/${idTmdb}`);
    const urlVideos = armarUrl(`/tv/${idTmdb}/videos`, '&include_video_language=es-MX,es,en');
    
    const urlProveedores = armarUrl(`/tv/${idTmdb}/watch/providers`);

    const [resDetalles, resVideos, resProveedores] = await Promise.all([
        fetch(urlDetalles),
        fetch(urlVideos),
        fetch(urlProveedores)
    ]);

    if (!resDetalles.ok) throw new Error(`Error al obtener detalles de la serie ${idTmdb}`);

    const detalles = await resDetalles.json();
    let videos = { results: [] as any[] };
    let proveedores = { results: {} as any };

    if (resVideos.ok) videos = await resVideos.json();
    if (resProveedores.ok) proveedores = await resProveedores.json();

    const videosYT = videos.results.filter((vid: any) => vid.site === 'YouTube');
    const videoSeleccionado = videosYT.find((vid: any) => vid.type === 'Trailer')
                        || videosYT.find((vid: any) => vid.type === 'Teaser')
                        || videosYT.find((vid: any) => vid.type === 'Clip')
                        || videosYT[0];

    const plataformasGT = proveedores.results?.['GT']?.flatrate || [];
    
    const plataformas = plataformasGT.map((p: any) => ({
        nombre: p.provider_name,
        logo: `https://image.tmdb.org/t/p/original${p.logo_path}`
    }));

    return {
        id_tmdb: detalles.id,
        titulo: detalles.name,
        descripcion: detalles.overview,
        calificacion: detalles.vote_average,
        fecha_salida: detalles.first_air_date,
        // 🌟 APLICAMOS EL COMODÍN AQUÍ
        poster: detalles.poster_path ? `https://image.tmdb.org/t/p/w500${detalles.poster_path}` : POSTER_COMODIN,
        youtube_key: videoSeleccionado ? videoSeleccionado.key : null,
        generos: detalles.genres,
        plataformas: plataformas 
    };
};