import { getPool, testConnection, closePool } from '../config/database';

async function test() {
  try {
    console.log('🔍 Testing database connection and data...\n');
    
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }
    
    const pool = getPool();
    
    // Count records in each table
    const tables = [
      'users',
      'linked_accounts',
      'departments',
      'projects',
      'task_columns',
      'tasks',
      'task_tags',
      'checklist_items',
      'comments',
      'meeting_rooms',
      'room_amenities',
      'bookings',
      'booking_participants',
      'project_files',
    ];
    
    console.log('📊 Record counts:');
    for (const table of tables) {
      const [rows] = await pool.execute(`SELECT COUNT(*) as count FROM ${table}`);
      const count = (rows as any)[0].count;
      console.log(`  - ${table}: ${count} records`);
    }
    
    // Sample data from users
    console.log('\n👥 Sample users:');
    const [users] = await pool.execute('SELECT id, full_name, email, role, status FROM users LIMIT 5');
    console.table(users);
    
    // Sample data from projects
    console.log('\n📁 Sample projects:');
    const [projects] = await pool.execute('SELECT id, project_key, name, status, progress FROM projects LIMIT 5');
    console.table(projects);
    
    // Sample data from tasks
    console.log('\n✅ Sample tasks:');
    const [tasks] = await pool.execute('SELECT id, code, title, type, priority FROM tasks LIMIT 5');
    console.table(tasks);
    
    console.log('\n✅ Database test completed successfully!');
  } catch (error) {
    console.error('\n❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

test();
