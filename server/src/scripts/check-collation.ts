import { getPool } from '../config/database';

async function check() {
    try {
        const pool = getPool();
        console.log('Checking users table collation...');

        const [tableStatus] = await pool.execute("SHOW TABLE STATUS WHERE Name = 'users'");
        console.log('Table Status:', (tableStatus as any[])[0]?.Collation);

        const [columns] = await pool.execute("SHOW FULL COLUMNS FROM users");
        console.log('\nColumns Collation:');
        (columns as any[]).forEach(col => {
            console.log(`${col.Field}: ${col.Collation}`);
        });

        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

check();
