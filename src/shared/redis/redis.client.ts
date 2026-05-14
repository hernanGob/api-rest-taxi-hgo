import { createClient } from "redis";
import { config } from "../../config/config.js";

export const redisClient = createClient({
    url: config.REDIS_URL,
});

redisClient.on('error', (error) => {
    console.error('Error en el cliente de Redis: ', error);
});

redisClient.on('connect', () => {
    console.log('Conexión a Redis exitosa');
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
}
