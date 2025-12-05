import mysql from 'mysql2/promise';

async function testCollation() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'nexus_portal'
    });

    console.log('=== Testing Collation ===\n');

    // Check table collations
    const [tables] = await conn.query("SHOW TABLE STATUS WHERE Name IN ('users', 'forum_posts', 'forum_space_members', 'forum_spaces')");
    console.log('Table Collations:');
    (tables as any[]).forEach(t => console.log(`  ${t.Name}: ${t.Collation}`));

    console.log('\n=== Testing Query ===\n');

    // Try the actual query
    try {
        const [rows] = await conn.query(`
      SELECT 
        p.id, p.space_id, p.author_id, p.title, p.content, p.tags, 
        p.vote_score, p.created_at, p.updated_at,
        u.id as author_id, u.full_name as author_name, u.avatar_url as author_avatar, 
        COALESCE(u.karma_points, 0) as author_karma,
        s.id as space_id, s.name as space_name, s.display_name as space_display_name, s.icon as space_icon
      FROM forum_posts p
      INNER JOIN forum_space_members sm ON p.space_id = sm.space_id AND sm.user_id = 'test-user-id'
      INNER JOIN users u ON p.author_id = u.id
      INNER JOIN forum_spaces s ON p.space_id = s.id
      LIMIT 10
    `);
        console.log('Query successful! Rows:', (rows as any[]).length);
    } catch (error: any) {
        console.log('Query FAILED with error:');
        console.log('  Message:', error.message);
        console.log('  Code:', error.code);
        console.log('  SQL Message:', error.sqlMessage);
    }

    await conn.end();
}

testCollation().catch(console.error);
