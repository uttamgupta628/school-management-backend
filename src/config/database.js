const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'school_management'
});

const connectDB = () => {
  return new Promise((resolve, reject) => {
    db.connect((err) => {
      if (err) {
        console.error('Database connection failed:', err);
        reject(err);
      } else {
        console.log('Connected to MySQL database');
        resolve();
      }
    });
  });
};

const createSchoolsTable = () => {
  return new Promise((resolve, reject) => {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS schools (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        contact VARCHAR(20) NOT NULL,
        image VARCHAR(255),
        email_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    db.query(createTableQuery, (err, result) => {
      if (err) {
        console.error('Error creating schools table:', err);
        reject(err);
      } else {
        console.log('Schools table ready');
        resolve();
      }
    });
  });
};

module.exports = {
  db,
  connectDB,
  createSchoolsTable
};