import mysql from 'mysql2/promise';
import { env } from './env';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  connectionLimit?: number;
  waitForConnections?: boolean;
  queueLimit?: number;
}

export const databaseConfig: DatabaseConfig = {
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
};

// Connection pool
let pool: mysql.Pool | null = null;

/**
 * Get database connection pool
 */
export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: databaseConfig.host,
      port: databaseConfig.port,
      user: databaseConfig.user,
      password: databaseConfig.password,
      database: databaseConfig.database,
      connectionLimit: databaseConfig.connectionLimit,
      waitForConnections: databaseConfig.waitForConnections,
      queueLimit: databaseConfig.queueLimit,
    });
  }
  return pool;
}

/**
 * Execute a query
 */
export async function query<T>(sql: string, params?: any[]): Promise<T> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}


/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Create database if not exists
 */
export async function createDatabaseIfNotExists(): Promise<void> {
  const connection = await mysql.createConnection({
    host: databaseConfig.host,
    port: databaseConfig.port,
    user: databaseConfig.user,
    password: databaseConfig.password,
  });

  try {
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${databaseConfig.database}\``);
    console.log(`✅ Database '${databaseConfig.database}' created or already exists`);
  } finally {
    await connection.end();
  }
}

/**
 * Initialize database with tables
 */
export async function initializeDatabase(): Promise<void> {
  console.log(`Initializing database connection to ${env.db.host}:${env.db.port}/${env.db.name}`);
  
  // Create database if not exists
  await createDatabaseIfNotExists();
  
  // Test connection
  await testConnection();
}

/**
 * Close database connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection pool closed');
  }
}

export default { getPool, query, testConnection, initializeDatabase, closePool };
