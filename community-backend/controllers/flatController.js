const db = require('../config/db');

// Fetching all flats
exports.getAllFlats = async (req, res) => {
    try {
        const societyId = req.user.societyId;
        // Fetching flats for the current society
        const [flats] = await db.query(
            `SELECT
                f.id,
                f.building_name,
                f.flat_number,
                u.id AS user_id,
                u.name AS resident_name
            FROM flats f
            LEFT JOIN users u
                ON f.id = u.flat_id
            WHERE f.society_id = ?
            ORDER BY f.building_name, f.flat_number`,
            [societyId]
        );
        res.status(200).json(flats);
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error while fetching flats'});
    }
};

// Creating a new flat
exports.createFlat = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({message: 'Access denied'});
        const societyId = req.user.societyId;
        const { building_name, flat_number } = req.body;
        
        // Storing the flat in the current society
        await db.query(
            'INSERT INTO flats (society_id, building_name, flat_number) VALUES (?, ?, ?)', 
            [societyId, building_name, flat_number]
        );
        res.status(201).json({message: 'New unit added successfully'});
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error while adding unit. It might already exist in this society.'});
    }
};

// Deleting a flat
exports.deleteFlat = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({message: 'Access denied'});
        const societyId = req.user.societyId;
        const flatId = req.params.id;

        // Checking if the flat belongs to the current society
        const [flatCheck] = await db.query(
            'SELECT society_id FROM flats WHERE id = ?',
            [flatId]
        );
        if (flatCheck.length === 0) {
            return res.status(404).json({message: 'Unit not found'});
        }       
        if (flatCheck[0].society_id !== societyId) {
            return res.status(403).json({message: 'Unauthorized: This unit belongs to a different society.'});
        }

        // Checking if the flat is occupied
        const [resident] = await db.query(
            'SELECT id FROM users WHERE flat_id = ?',
            [flatId]
        );
        if (resident.length > 0) {
            return res.status(400).json({
                message: 'Cannot delete an occupied unit. Remove the resident first.'
            });
        }

        // Deleting the flat
        await db.query('DELETE FROM flats WHERE id = ? AND society_id = ?', [flatId, societyId]);
        res.status(200).json({message: 'Unit deleted successfully'});
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error while deleting unit'});
    }
};