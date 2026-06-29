const pool = require('../config/db');
const bcrypt = require('bcrypt');

// User Management
exports.getAllUsers = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    const societyId = req.user.societyId;
    try {
        // Fetching all users for the current society
        const [users] = await pool.execute(
            `SELECT u.id, u.name, u.email, u.role, u.flat_id,f.building_name, f.flat_number 
             FROM users u
             LEFT JOIN flats f ON u.flat_id = f.id
             WHERE u.society_id = ?
             ORDER BY u.role, u.name ASC`,
            [societyId]
        );
        res.status(200).json(users);
    } 
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Server error fetching user directory.' });
    }
};

// My Profile
exports.getMyProfile = async (req, res) => {
    const userId = req.user.id;
    const societyId = req.user.societyId;
    try {
        // Fetching the user's profile
        const [userProfile] = await pool.execute(
            `SELECT u.id, u.name, u.email, u.role, u.created_at, s.name as society_name,f.building_name, f.flat_number
             FROM users u
             JOIN societies s ON u.society_id = s.id
             LEFT JOIN flats f ON u.flat_id = f.id
             WHERE u.id = ? AND u.society_id = ?`,
            [userId, societyId]
        );
        if (userProfile.length === 0) {
            return res.status(404).json({ error: 'User profile not found.' });
        }
        res.status(200).json(userProfile[0]);
    } 
    catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Server error fetching profile.' });
    }
};

// Guards
exports.getGuards = async (req, res) => {
    const societyId = req.user.societyId;
    try {
        // Fetching all guards
        const [guards] = await pool.execute(
            `SELECT id, name, email 
             FROM users 
             WHERE society_id = ? AND role = 'guard'
             ORDER BY name ASC`,
            [societyId]
        );
        res.status(200).json(guards);
    } 
    catch (error) {
        console.error('Error fetching guards:', error);
        res.status(500).json({ error: 'Server error fetching guards.' });
    }
};

// Society Directory
exports.getResidentDirectory = async (req, res) => {
    const societyId = req.user.societyId;
    try {
        const [members] = await pool.execute(
            `SELECT
                u.id,
                u.name,
                u.email,
                u.role,
                u.flat_id,
                f.building_name,
                f.flat_number
             FROM users u
             LEFT JOIN flats f ON u.flat_id = f.id
             WHERE u.society_id = ?
             ORDER BY
                FIELD(u.role, 'admin', 'guard', 'resident'),
                u.name ASC`,
            [societyId]
        );
        res.status(200).json(members);
    } 
    catch (error) {
        console.error('Error fetching society directory:', error);
        res.status(500).json({
            error: 'Server error fetching society directory.'
        });
    }
};

// Create User
exports.createUser = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    const societyId = req.user.societyId;
    const { name, email, password, role, flatId } = req.body;
    const validRoles = ['admin', 'resident', 'guard'];

    if (!validRoles.includes(role)) {
        return res.status(400).json({
            message: 'Invalid role.'
        });
    }
    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }
    try {
        // Hashing the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);
        let finalFlatId = null;
        if (role === 'resident' && flatId) {
            // Checking if the flat belongs to the current society
            const [flat] = await pool.execute(
                'SELECT id FROM flats WHERE id = ? AND society_id = ?',
                [flatId, societyId]
            );
            if (flat.length === 0) {
                return res.status(404).json({
                    message: 'Flat not found in this society.'
                });
            }
            // Checking if the flat is already occupied
            const [occupied] = await pool.execute(
                'SELECT id FROM users WHERE flat_id = ?',
                [flatId]
            );
            if (occupied.length > 0) {
                return res.status(400).json({
                    message: 'This flat is already assigned to a resident.'
                });
            }
            finalFlatId = flatId;
        }
        // Creating the user account
        const [result] = await pool.execute(
            'INSERT INTO users (society_id, flat_id, name, email, password, role) VALUES (?, ?, ?, ?, ?, ?)',
            [societyId, finalFlatId, name, email, hashedPassword, role]
        );
        res.status(201).json({ message: 'User created successfully', userId: result.insertId });
    } 
    catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already exists.' });
        }
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error creating user.' });
    }
};

// Update User
exports.updateUser = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    const societyId = req.user.societyId;
    const targetUserId = req.params.id;
    const { name, email, password, role, flatId } = req.body;

    if (!name || !email || !role) {
        return res.status(400).json({ message: 'Name, email, and role are required.' });
    }
    const validRoles = ['admin', 'resident', 'guard'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role provided.' });
    }
    try {
        // Checking if the user belongs to the current society
        const [userCheck] = await pool.execute(
            'SELECT id, role FROM users WHERE id = ? AND society_id = ?',
            [targetUserId, societyId]
        );
        if (userCheck.length === 0) {
            return res.status(404).json({ message: 'User not found or does not belong to your society.' });
        }

        // Making sure the last admin cannot be demoted
        if (userCheck[0].role === 'admin' && role !== 'admin') {
            const [adminCount] = await pool.execute(
                'SELECT COUNT(*) as count FROM users WHERE role = "admin" AND society_id = ?',
                [societyId]
            );
            if (adminCount[0].count <= 1) {
                return res.status(400).json({ message: 'Cannot demote the last admin. The society must have at least one admin.' });
            }
        }

        // Validating the selected flat
        let finalFlatId = null;
        if (role === 'resident' && flatId) {
            const [flatCheck] = await pool.execute(
                'SELECT id FROM flats WHERE id = ? AND society_id = ?',
                [flatId, societyId]
            );
            if (flatCheck.length === 0) {
                return res.status(400).json({ message: 'Selected flat is invalid or belongs to another society.' });
            }
            const [occupancyCheck] = await pool.execute(
                'SELECT id FROM users WHERE flat_id = ? AND id != ?',
                [flatId, targetUserId]
            );
            if (occupancyCheck.length > 0) {
                return res.status(400).json({ message: 'This flat is already assigned to another user.' });
            }
            finalFlatId = flatId;
        }

        // Updating the user details
        let query = 'UPDATE users SET name = ?, email = ?, role = ?, flat_id = ?';
        let queryParams = [name, email, role, finalFlatId];
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            queryParams.push(hashedPassword);
        }
        query += ' WHERE id = ? AND society_id = ?';
        queryParams.push(targetUserId, societyId);
        await pool.execute(query, queryParams);
        res.status(200).json({ message: 'User updated successfully.' });
    } 
    catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email is already in use by another account.' });
        }
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error updating user.' });
    }
};

// Delete User
exports.deleteUser = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    const societyId = req.user.societyId;
    const targetUserId = req.params.id;
    try {
        // Checking if the user belongs to the current society
        const [targetUser] = await pool.execute(
            'SELECT role FROM users WHERE id = ? AND society_id = ?',
            [targetUserId, societyId]
        );
        if (targetUser.length === 0) {
            return res.status(404).json({ message: 'User not found or does not belong to your society.' });
        }
        // Making sure the last admin cannot be deleted
        if (targetUser[0].role === 'admin') {
            const [adminCount] = await pool.execute(
                'SELECT COUNT(*) as count FROM users WHERE role = "admin" AND society_id = ?',
                [societyId]
            );
            if (adminCount[0].count <= 1) {
                return res.status(400).json({ message: 'Cannot delete the last admin account of the society.' });
            }
        }
        // Deleting the user
        await pool.execute(
            'DELETE FROM users WHERE id = ? AND society_id = ?',
            [targetUserId, societyId]
        );
        res.status(200).json({ message: 'User deleted successfully.' });
    } 
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error deleting user.' });
    }
};

// Update My Profile
exports.updateMyProfile = async (req, res) => {
    const userId = req.user.id;
    const societyId = req.user.societyId;
    const {name} = req.body;
    if (!name) {
        return res.status(400).json({
            error: 'Name is required.'
        });
    }
    try {
        await pool.execute(
            `UPDATE users
            SET name = ?
            WHERE id = ? AND society_id = ?`,
            [name, userId, societyId]
        );
        res.status(200).json({
            message: 'Profile updated successfully.'
        });
    }
    catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            error: 'Server error updating profile.'
        });
    }
};

// Changing the account password
exports.changePassword = async (req, res) => {
    const userId = req.user.id;
    const societyId = req.user.societyId;
    const {
        currentPassword,
        newPassword
    } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            message: 'Current password and new password are required.'
        });
    }
    try {
        const [users] = await pool.execute(
            `SELECT password
             FROM users
             WHERE id = ? AND society_id = ?`,
            [userId, societyId]
        );
        if (users.length === 0) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }
        const valid = await bcrypt.compare(
            currentPassword,
            users[0].password
        );
        if (!valid) {
            return res.status(400).json({
                message: 'Current password is incorrect.'
            });
        }
        const hashedPassword =
            await bcrypt.hash(newPassword, 10);
        await pool.execute(
            `UPDATE users
             SET password = ?
             WHERE id = ? AND society_id = ?`,
            [
                hashedPassword,
                userId,
                societyId
            ]
        );
        res.json({
            message: 'Password updated successfully.'
        });
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Server error updating password.'
        });
    }
};