import { driver, DATABASE_NAME } from '../config/neo4j.ts';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const registrarUsuario = async (datos: any) => {
    const { nombre, correo, password, rol = 'Tester' } = datos;

    // 1. Encriptar la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // 2. Generar un ID único
    const idUnico = crypto.randomUUID();

    const session = driver.session({ database: DATABASE_NAME });
    try {
        // 3. Usamos CREATE en lugar de MERGE. 
        // Si el correo ya existe, la restricción de Neo4j bloqueará esto automáticamente.
        const query = `
            CREATE (u:Usuario {
                id: $id,
                correo: $correo,
                nombre: $nombre,
                password_hash: $passwordHash,
                rol: $rol,
                frecuencia: 'Baja'
            })
            RETURN u.id AS id, u.nombre AS nombre, u.correo AS correo
        `;
        
        const resultado = await session.run(query, {
            correo, id: idUnico, nombre, passwordHash, rol
        });

        return resultado.records[0].toObject();

    } catch (error: any) {
        // 4. Capturamos específicamente el error de duplicidad de Neo4j
        if (error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
            throw new Error('El correo ya está registrado. Intenta iniciar sesión.');
        }
        // Si es otro tipo de error (como caída de red), lo lanzamos normal
        throw error;
    } finally {
        await session.close();
    }
};

export const loginUsuario = async (correo: string, passwordPlano: string) => {
    const session = driver.session({ database: DATABASE_NAME });
    try {
        // 1. Buscar al usuario por correo
        const query = `MATCH (u:Usuario {correo: $correo}) RETURN u`;
        const resultado = await session.run(query, { correo });

        if (resultado.records.length === 0) {
            throw new Error('Correo o contraseña incorrectos.');
        }

        const nodoUsuario = resultado.records[0].get('u').properties;

        // 2. Comparar la contraseña escrita con el Hash guardado
        const esCorrecta = await bcrypt.compare(passwordPlano, nodoUsuario.password_hash);
        
       if (!esCorrecta) {
            throw new Error('Correo o contraseña incorrectos.');
        }

        const firma = process.env.JWT_SECRET || 'secreto_por_defecto';
        const token = jwt.sign(
            { id: nodoUsuario.id, correo: nodoUsuario.correo }, 
            firma, 
            { expiresIn: '24h' }
        );

        // Devolvemos los datos del usuario Y el token
        return {
            usuario: {
                id: nodoUsuario.id,
                nombre: nodoUsuario.nombre,
                correo: nodoUsuario.correo,
                rol: nodoUsuario.rol
            },
            token: token
        };
    } finally {
        await session.close();
    }
};