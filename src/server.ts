import { createApp } from "./app.js";
import { config } from "./config/config.js";
import http from 'http';
import { initializeSocket } from "./socket/index.js";
//import { connectRedis } from "./shared/redis/redis.client.js";

const main = async () => {

    try {
        //await connectRedis();

        const app = createApp();
        const httpServer = http.createServer(app);
        initializeSocket(httpServer);

        httpServer.listen(config.port, () => {
            console.log(`Servidor corriendo en el puerto: ${config.port}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
    }
}

main();