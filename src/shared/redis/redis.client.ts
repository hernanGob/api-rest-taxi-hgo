import { createClient } from "redis";
import { config } from "../../config/config.js";

// Determinar si estamos en producción
const isProduction = process.env.NODE_ENV === 'production';

// Construir la URL de Redis según el entorno
let redisUrl = config.REDIS_URL;

// Si estamos en producción y la URL no tiene contraseña, agregarla
if (isProduction && config.REDIS_PASSWORD) {
    // Si la URL ya tiene formato redis://:password@host:port
    // O construirla manualmente
    const host = config.REDIS_HOST || '10.16.17.156';
    const port = config.REDIS_PORT || 6379;
    const password = encodeURIComponent(config.REDIS_PASSWORD);
    redisUrl = `redis://:${password}@${host}:${port}`;
}

export const redisClient = createClient({
    url: redisUrl,
});

export type AppRedisClient = typeof redisClient;

redisClient.on('error', (error) => {
    console.error('Error en el cliente de Redis: ', error);
});

redisClient.on('connect', () => {
    console.log(`Conexión a Redis exitosa (${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'})`);
});

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};

export const disconnectRedis = async () => {
    if (redisClient.isOpen) {
        await redisClient.quit();
    }

    console.log(
        `[Redis] cliente general cerrado PID ${process.pid}`
    );
}