import dotenv from 'dotenv';

dotenv.config();

interface Config {
    port: number;
    nodeEnv: string;
    DATABASE_URL: string;
    FRONTEND_URL: string;
    JWT_SECRET: string;
    REDIS_URL: string;
    API_KEY_GOOGLE: string;
    API_STCH: string;
    STCH_USER: string;
    STCH_PASSWORD: string;
    CLIENT_URL: string;
}

export const config: Config = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || '',
    FRONTEND_URL: process.env.FRONTEND_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || '',
    REDIS_URL: process.env.REDIS_URL || '',
    API_KEY_GOOGLE: process.env.API_KEY_GOOGLE || '',
    API_STCH: process.env.API_STCH || '',
    STCH_USER: process.env.STCH_USER || '',
    STCH_PASSWORD: process.env.STCH_PASSWORD || '',
    CLIENT_URL: process.env.CLIENT_URL || '*',
};
