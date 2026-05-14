import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from './config.js';

const pool = new Pool({ connectionString: config.DATABASE_URL });
export const db = drizzle(pool);

const testConnection = async (): Promise<void> => {
    try {
        console.log('Conexión a la base de datos exitosa');
        console.log((await pool.query('SELECT 1')).rows[0]);
    } catch (err) {
        console.error('Error en la conexión a la base de datos:', (err as Error).stack);
    }
};
testConnection();

pool.on('error', (err: Error) => {
    console.error('Error inesperado en la pool de conexiones:', (err as Error).stack);
});

export default pool;