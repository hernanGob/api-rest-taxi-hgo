import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './src/config/drizzle',
    schema: "./src/config/drizzle/schema.ts",
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL_MIGRATIONS!,
    },
    schemaFilter: ["public"],
});
