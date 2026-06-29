const mysql = require('mysql2/promise');
require('dotenv').config();

// creating the V2 database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_V2 || 'society_management_v2',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// creating the required tables when the server starts
async function initializeDatabase() {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected');

        // Creating the societies table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS societies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                join_code VARCHAR(50) NOT NULL UNIQUE,
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                razorpay_key_id VARCHAR(100),
                razorpay_key_secret VARCHAR(255)
            )
        `);

        // Creating the flats table before users
        await connection.query(`
            CREATE TABLE IF NOT EXISTS flats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                society_id INT NOT NULL,
                building_name VARCHAR(100) NOT NULL,
                flat_number VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
                UNIQUE KEY unique_flat_per_society (society_id,building_name, flat_number)
            )
        `);

        // Creating the users table
        await connection.query(`
           CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                society_id INT NOT NULL,
                flat_id INT DEFAULT NULL, 
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'resident', 'guard') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
                FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE SET NULL,
                UNIQUE KEY unique_email (email) 
            );
        `);

        // Creating the tickets table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                society_id INT NOT NULL,
                author_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                status ENUM('open', 'resolved') DEFAULT 'open',
                agree_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Storing comments for each ticket
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ticket_comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Tracking users who agreed with a ticket
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ticket_agreements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_agreement (ticket_id, user_id)
            )
        `);

        // Storing visitor entry and exit records
        await connection.query(`
            CREATE TABLE IF NOT EXISTS visitors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                society_id INT NOT NULL,
                flat_id INT NOT NULL,
                guard_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                purpose VARCHAR(255),
                entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                exit_time TIMESTAMP NULL,
                status ENUM('inside', 'left') DEFAULT 'inside',
                FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
                FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE CASCADE,
                FOREIGN KEY (guard_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        // Creating the announcements table
        await connection.query(`
        CREATE TABLE IF NOT EXISTS announcements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            society_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            created_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        )
        `);

        // Creating the polls table
        await connection.query(`
        CREATE TABLE IF NOT EXISTS polls (
            id INT AUTO_INCREMENT PRIMARY KEY,
            society_id INT NOT NULL,
            question VARCHAR(255) NOT NULL,
            created_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        )
        `);

        // Store the options for each poll
        await connection.query(`
        CREATE TABLE IF NOT EXISTS poll_options (
            id INT AUTO_INCREMENT PRIMARY KEY,
            poll_id INT NOT NULL,
            option_text VARCHAR(255) NOT NULL,
            FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
        )
        `);

        // Storing votes submitted by residents
        await connection.query(`
        CREATE TABLE IF NOT EXISTS poll_votes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            poll_id INT NOT NULL,
            user_id INT NOT NULL,
            option_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
            UNIQUE KEY unique_vote (poll_id, user_id)
        )
        `);

        // Storing monthly maintenance dues
        await connection.query(`
        CREATE TABLE IF NOT EXISTS monthly_dues (
            id INT AUTO_INCREMENT PRIMARY KEY,
            society_id INT NOT NULL,
            flat_id INT NOT NULL,
            month VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM'
            amount DECIMAL(10, 2) NOT NULL,
            status ENUM('pending', 'paid') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
            FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE CASCADE,
            UNIQUE KEY unique_flat_month (flat_id, month)
        );
        `);

        // Storing completed payments
        await connection.query(`
        CREATE TABLE IF NOT EXISTS payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            society_id INT NOT NULL,
            due_id INT NOT NULL,
            amount_paid DECIMAL(10, 2) NOT NULL,
            razorpay_order_id VARCHAR(100),
            razorpay_payment_id VARCHAR(100),
            payment_method VARCHAR(50),
            payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
            FOREIGN KEY (due_id) REFERENCES monthly_dues(id) ON DELETE CASCADE
        );
        `);

        console.log('Database initialized.');
        connection.release();
    } catch (err) {
        console.error('Database connection or initialization failed:', err.message);
    }
}

initializeDatabase();
module.exports = pool;