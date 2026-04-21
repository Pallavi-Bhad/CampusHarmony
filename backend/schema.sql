CREATE DATABASE IF NOT EXISTS complaint_system_db;
USE complaint_system_db;

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    is_hosteller BOOLEAN NOT NULL,
    contact VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    category ENUM('Hostel', 'Mess', 'College') NOT NULL,
    description TEXT NOT NULL,
    status ENUM('Pending', 'In Progress', 'Resolved') DEFAULT 'Pending',
    admin_remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Insert a default admin for testing (password is 'admin123' bcrypt hashed would be better, but I'll use a simple one for now or just wait for registration if I implement it. Actually, I should probably seed one admin.)
-- For seed, I'll use a hashed version of 'admin123' -> $2a$10$7R.D9fM1.d8Z8d8d8d8d8u (example)
-- I will handle admin creation in the server code or just provide a manual script.
