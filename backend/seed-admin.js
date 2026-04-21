const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

async function seedAdmin() {
    const email = 'admin@cms.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query('INSERT INTO admins (email, password) VALUES (?, ?)', [email, hashedPassword], (err, result) => {
        if (err) {
            console.error('Seed failed (maybe already exists):', err.message);
        } else {
            console.log(`Admin seeded successfully: ${email} / ${password}`);
        }
        db.end();
    });
}

seedAdmin();
