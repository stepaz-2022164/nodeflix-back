import { driver, DATABASE_NAME } from '../config/neo4j.ts';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const registrarUsuario = async (datos: any) => {
    const { nombre, correo, password, rol = 'Tester' } = datos;
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const idUnico = crypto.randomUUID();

    const session = driver.session({ database: DATABASE_NAME });
    try {
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
        if (error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
            throw new Error('El correo ya está registrado. Intenta iniciar sesión.');
        }
        throw error;
    } finally {
        await session.close();
    }
};

export const loginUsuario = async (correo: string, passwordPlano: string) => {
    const session = driver.session({ database: DATABASE_NAME });
    try {
        const query = `MATCH (u:Usuario {correo: $correo}) RETURN u`;
        const resultado = await session.run(query, { correo });

        if (resultado.records.length === 0) {
            throw new Error('Correo o contraseña incorrectos.');
        }

        const nodoUsuario = resultado.records[0].get('u').properties;
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