const { drizzle } = require('drizzle-orm/mysql2');
const mysql = require('mysql2/promise');

async function checkDatabase() {
  try {
    // You'll need to update these with your actual DB credentials
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'fbr_inventory'
    });

    console.log('✅ Database connected successfully');

    // Check if import_jobs table exists
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'import_jobs'"
    );

    if (tables.length === 0) {
      console.log('❌ import_jobs table does not exist!');
      console.log('\n📝 Run this SQL to create the table:');
      console.log(`
CREATE TABLE import_jobs (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  blob_url VARCHAR(500) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  total_records INT DEFAULT 0,
  processed_records INT DEFAULT 0,
  successful_records INT DEFAULT 0,
  failed_records INT DEFAULT 0,
  errors JSON,
  results JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  created_by VARCHAR(255) NOT NULL,
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_type (type),
  INDEX idx_status (status)
);
      `);
      return;
    }

    console.log('✅ import_jobs table exists');

    // Check table structure
    const [columns] = await connection.execute('DESCRIBE import_jobs');
    console.log('\n📋 Table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Check for the specific job
    const [jobs] = await connection.execute(
      "SELECT * FROM import_jobs WHERE id = ?",
      ['1f38fb34-8088-4275-af9e-caad844bc2f2']
    );

    if (jobs.length > 0) {
      console.log('\n📄 Found job record:');
      console.log(JSON.stringify(jobs[0], null, 2));
    } else {
      console.log('\n❌ Job record not found in database');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.log('\n💡 Make sure your database is running and credentials are correct');
  }
}

checkDatabase();
