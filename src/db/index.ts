import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';

// Function to create a new connection pool.
export const createPool = () => {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (connectionString) {
    return new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // required for secure external/Vercel connections
      max: 2, // Restrict connection limit to avoid exhausting Cloud SQL connections
      idleTimeoutMillis: 1000, // Close idle clients after 1 second to release DB slots
      connectionTimeoutMillis: 15000,
    });
  }

  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    max: 2, // Restrict connection limit to avoid exhausting Cloud SQL connections
    idleTimeoutMillis: 1000, // Close idle clients after 1 second to release DB slots
    connectionTimeoutMillis: 15000,
  });
};

// Create a pool instance.
const pool = createPool();

// Prevent unhandled pool-level errors from crashing the application
pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
