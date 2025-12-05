import { initializeDatabase, closePool } from '../config/database';
import { createTables, dropAllTables } from './schema';
import { seedAll } from './seed';

async function setup() {
  try {
    console.log('🚀 Starting database setup...\n');
    
    // Initialize database connection
    await initializeDatabase();
    
    // Drop existing tables (clean setup)
    console.log('\n🗑️  Dropping existing tables...');
    await dropAllTables();
    
    // Create tables
    console.log('\n📋 Creating tables...');
    await createTables();
    
    // Seed data
    console.log('\n🌱 Seeding data...');
    await seedAll();
    
    console.log('\n✅ Database setup completed successfully!');
  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

setup();
