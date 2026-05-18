import 'dotenv/config';
import express, {
    type Request,
    type Response,
    type NextFunction,
    type Application
} from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import compression from 'compression';
import { buildContainer } from './modules/container.js';


export const createApp = () => {
    const app: Application = express();
    const container = buildContainer();

    app.disable('x-powered-by');

    app.set('trust proxy', 1);

    app.use(helmet());

    app.use(compression());

    app.use(hpp());

    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        process.env.FRONTEND_URL
    ].filter(Boolean) as string[];

    app.use(cors({
        origin(requestOrigin, callback) {
            if (!requestOrigin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(requestOrigin)) {
                return callback(null, true);
            }

            return callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }));

    app.use(express.json({
        limit: '1mb'
    }));

    app.use(express.urlencoded({
        extended: true,
        limit: '1mb'
    }));

    app.use(cookieParser());

    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 300,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 'error',
            msg: 'Demasiadas solicitudes. Por favor, inténtelo de nuevo más tarde.'
        },
    });

    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 'error',
            msg: 'Demasiados intentos para iniciar sesión. Por favor, inténtelo de nuevo más tarde.'
        }
    });

    //app.use('/api', apiLimiter);

    app.use('/api/user', container.userRoutes);
    app.use('/api/passenger', container.passengerRoutes);
    app.use('/api/pricing', container.pricingRoutes);
    app.use('/api/geo', container.geoRoutes);
    app.use('/api/driver', container.driverRoutes);
    app.use("/api/driver/auth", container.driverAuthRoutes);
    app.use('/api/concessionaires', container.concessionaireRoutes);
    app.use('/api/zone', container.zoneRoutes);
    app.use("/api/trips", container.tripRoutes);
    app.use("/api/service-types", container.serviceTypeRoutes);

    app.use((_req: Request, res: Response) => {
        return res.status(404).json({
            status: 'error',
            msg: 'Ruta no encontrada'
        });
    });

    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        console.error(err);

        const isProduction = process.env.NODE_ENV === 'production';

        return res.status(500).json({
            status: 'error',
            msg: isProduction
                ? 'Error interno del servidor'
                : err.message || "Error interno del servidor",
        });
    });

    return app;
}