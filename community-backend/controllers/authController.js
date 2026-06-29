const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Registering a new society along with its admin
exports.registerSociety = async (req, res) => {
    // Start a transaction so we don't end up with a society but no admin
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { societyName, address, adminName, adminEmail, adminPassword } = req.body;

        // Checking if the admin email is already registered
        const [existingUser] = await connection.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
        if (existingUser.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Email is already registered.' });
        }

        // Generating a unique join code for the society
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Creating the society record
        const [societyResult] = await connection.query(
            'INSERT INTO societies (name, join_code, address) VALUES (?, ?, ?)',
            [societyName, joinCode, address]
        );
        const newSocietyId = societyResult.insertId;

        // Hashing the password before storing it
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminPassword, salt);

        // Creating the admin account
        await connection.query(
            'INSERT INTO users (society_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [newSocietyId, adminName, adminEmail, passwordHash, 'admin']
        );

        await connection.commit();
        res.status(201).json({ 
            message: 'Society and Admin created successfully', 
            societyId: newSocietyId,
            joinCode: joinCode 
        });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error during society registration' });
    } finally {
        connection.release();
    }
};

// Registering a new resident or guard
exports.registerUser = async (req, res) => {
    try {
        // Using the flat number since users don't know the flat ID
        const { joinCode, name, email, password, role, flatNumber } = req.body;

        // Validating the join code
        const [societies] = await db.query('SELECT id FROM societies WHERE join_code = ?', [joinCode]);
        if (societies.length === 0) {
            return res.status(404).json({ message: 'Invalid Join Code' });
        }
        const societyId = societies[0].id;

        // Checking if the email is already registered
        const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let targetFlatId = null;
        // Making sure the flat isn't already assigned
        if (role === 'resident' && flatNumber) {
            const [flatCheck] = await db.query(
                'SELECT id FROM flats WHERE society_id = ? AND flat_number = ?',
                [societyId, flatNumber]
            );
            if (flatCheck.length === 0) {
                return res.status(404).json({ message: 'Unit not found in this society' });
            }

            targetFlatId = flatCheck[0].id;
            // Checking if another resident already occupies the flat
            const [occupied] = await db.query(
                'SELECT id FROM users WHERE flat_id = ?',
                [targetFlatId]
            );

            if (occupied.length > 0) {
                return res.status(400).json({
                    message: 'This unit is already assigned to an active resident.'
                });
            }
        }

        // Hashing the password before storing it
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Creating the user account
        const [result] = await db.query(
            'INSERT INTO users (society_id, flat_id, name, email, password, role) VALUES (?, ?, ?, ?, ?, ?)',
            [societyId, targetFlatId, name, email, passwordHash, role]
        );
        const newUserId = result.insertId;
        res.status(201).json({ message: 'User registered successfully', userId: newUserId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during user registration' });
    }
};

// Logging in an existing user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await db.query(
            `SELECT
                u.*,
                s.name AS society_name
            FROM users u
            JOIN societies s
                ON u.society_id = s.id
            WHERE u.email = ?`,
            [email]
        );
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Getting the resident's flat ID
        let userFlatId = null;
        if (user.role === 'resident') {
            userFlatId = user.flat_id;
        }

        // Generating the login token
        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                role: user.role,
                societyId: user.society_id,
                societyName: user.society_name,
                flatId: userFlatId
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            token,
            user: { 
                id: user.id, 
                name: user.name, 
                role: user.role, 
                societyId: user.society_id,
                flatId: userFlatId 
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};