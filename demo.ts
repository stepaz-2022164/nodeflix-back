import neo4j from 'neo4j-driver';

// ==========================================
// 1. CREDENCIALES (Reemplaza con las tuyas)
// ==========================================
const NEO4J_URI = 'neo4j://127.0.0.1:7687'; // Usa el enlace de AuraDB si están en la nube
const NEO4J_USER = 'neo4j';
const NEO4J_PASS = 'admin123';
const TMDB_API_KEY = '56cb2cc008b39b4141c9c0deacd9ce45';

// ==========================================
// 2. PRUEBA DE CONEXIÓN A NEO4J
// ==========================================
async function probarNeo4j() {
    console.log("⏳ Probando conexión a Neo4j...");
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASS));
    const session = driver.session();

    try {
        // Ejecutamos una consulta Cypher súper básica que solo devuelve un texto
        const resultado = await session.run('RETURN "¡Conexión a Neo4j exitosa!" AS mensaje');
        const mensaje = resultado.records[0].get('mensaje');
        console.log(`✅ NEO4J: ${mensaje}`);
    } catch (error) {
        console.error("❌ ERROR EN NEO4J:", error);
    } finally {
        await session.close();
        await driver.close();
    }
}

// ==========================================
// 3. PRUEBA DE CONEXIÓN A TMDB (Banco de datos)
// ==========================================
async function probarTMDB() {
    console.log("⏳ Probando conexión a TMDB...");
    try {
        // Usamos el fetch nativo de Node 22 para pedir la lista de series populares
        const url = `https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=es-MX&page=1`;
        const respuesta = await fetch(url);
        
        if (!respuesta.ok) throw new Error(`HTTP Error: ${respuesta.status}`);

        const datos = await respuesta.json();
        
        // Extraemos solo el nombre de la primera serie de la lista para confirmar que funciona
        const primeraSerie = datos.results[1].name;
        console.log(`✅ TMDB: ¡Conexión exitosa! La serie #1 actualmente es "${primeraSerie}"`);
    } catch (error) {
        console.error("❌ ERROR EN TMDB:", error);
    }
}

// ==========================================
// 4. EJECUCIÓN
// ==========================================
async function ejecutarDemo() {
    console.log("--- INICIANDO DIAGNÓSTICO DEL BACKEND ---\n");
    await probarNeo4j();
    console.log("-----------------------------------------");
    await probarTMDB();
    console.log("\n--- DIAGNÓSTICO FINALIZADO ---");
}

ejecutarDemo();