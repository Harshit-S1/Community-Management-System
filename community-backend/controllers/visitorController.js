const db = require('../config/db');

// Logging a visitor's entry
exports.logEntry = async (req, res) => {
    try {
        const { flatId, visitorName, phone = 'N/A', purpose } = req.body;
        const guardId = req.user.id; 
        const societyId = req.user.societyId; 

        // Checking if the flat belongs to the current society
        const [flatCheck] = await db.query(
            `SELECT
                f.id,
                u.id AS resident_id
            FROM flats f
            LEFT JOIN users u
                ON f.id = u.flat_id
                AND u.role = 'resident'
            WHERE
                f.id = ?
                AND f.society_id = ?
            `,
            [flatId, societyId]
        );
        if (flatCheck.length === 0) {
            return res.status(403).json({
                message: 'Unauthorized: Flat not found in your society.'
            });
        }
        if (!flatCheck[0].resident_id) {
            return res.status(400).json({
                message: 'Cannot log visitor. No resident is assigned to this flat.'
            });
        }
        // Recording the visitor entry
        const [result] = await db.query(
            'INSERT INTO visitors (society_id, flat_id, guard_id, name, phone, purpose) VALUES (?, ?, ?, ?, ?, ?)',
            [societyId, flatId, guardId, visitorName, phone, purpose]
        );
        res.status(201).json({ 
            message: 'Visitor entry logged successfully',
            visitorId: result.insertId
        });
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while logging entry' });
    }
};

// Logging a visitor's exit
exports.logExit = async (req, res) => {
    try {
        const visitorId = req.params.id;
        const societyId = req.user.societyId;
        // Updating the visitor's exit details
        const [result] = await db.query(
            'UPDATE visitors SET exit_time = CURRENT_TIMESTAMP, status = "left" WHERE id = ? AND society_id = ?',
            [visitorId, societyId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Visitor not found or unauthorized' });
        }
        res.status(200).json({ message: 'Visitor exit logged successfully' });
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while logging exit' });
    }
};

// Fetching active visitors
exports.getActiveVisitors = async (req, res) => {
    try {
        const societyId = req.user.societyId;
        const [visitors] = await db.query(`
            SELECT v.id, v.name as visitor_name, v.phone, v.purpose, v.entry_time as time_in, f.building_name, f.flat_number
            FROM visitors v
            JOIN flats f ON v.flat_id = f.id
            WHERE v.society_id = ? AND v.status = 'inside'
            ORDER BY v.entry_time DESC
        `, [societyId]);
        res.status(200).json(visitors);
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching active visitors' });
    }
};

// Fetching a resident's visitor history
exports.getResidentVisitorHistory = async (req, res) => {
    try {
        const { role, flatId, societyId } = req.user; 
        if (role !== 'resident') {
            return res.status(403).json({ message: 'Access denied: Residents only' });
        }
        if (!flatId) {
            return res.status(400).json({ message: 'No flat associated with your account.' });
        }
        const [visitors] = await db.query(`
            SELECT id, name as visitor_name,phone, purpose, entry_time as time_in, exit_time as time_out 
            FROM visitors 
            WHERE flat_id = ? AND society_id = ?
            ORDER BY entry_time DESC
        `, [flatId, societyId]);
        res.status(200).json(visitors);
    } 
    catch (error) {
        console.error('Error fetching visitor history:', error);
        res.status(500).json({ message: 'Server error while fetching visitor history.' });
    }
};

// Fetching all visitor records
exports.getAllVisitors = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }
        const societyId = req.user.societyId;
        const [visitors] = await db.query(`
            SELECT v.id, v.name as visitor_name, v.purpose, v.entry_time as time_in, v.exit_time as time_out, 
                   f.building_name, f.flat_number 
            FROM visitors v
            JOIN flats f ON v.flat_id = f.id
            WHERE v.society_id = ?
            ORDER BY v.entry_time DESC
        `, [societyId]);
        res.status(200).json(visitors);
    } 
    catch (error) {
        console.error('Error fetching all visitors:', error);
        res.status(500).json({ message: 'Server error while fetching visitors' });
    }
};