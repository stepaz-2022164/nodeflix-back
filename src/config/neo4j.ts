import neo4j from 'neo4j-driver';
import 'dotenv/config';

const URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const USER = process.env.NEO4J_USER || 'neo4j';
const PASS = process.env.NEO4J_PASSWORD || 'admin123';

export const DATABASE_NAME = process.env.NEO4J_DATABASE || 'neo4j';

// Creamos una única instancia del driver para toda la aplicación
export const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASS));

// Función para probar la conexión al iniciar el servidor
export const conectarDB = async () => {
    try {
        await driver.verifyConnectivity();
        console.log('✅ Conexión a Neo4j establecida correctamente.');
    } catch (error) {
        console.error('❌ Error conectando a Neo4j:', error);
    }
};