const pool = require('../config/db');

// Deleting a society
const deleteSociety = async (req, res) => {
    // Getting the current society ID
    const societyId = req.user.societyId;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Deleting the society and its associated data
        await connection.query(
            'DELETE FROM societies WHERE id = ?',
            [societyId]
        );
        await connection.commit();
        res.status(200).json({
            message: 'Society and all associated data permanently deleted.'
        });

    } 
    catch (error) {
        await connection.rollback();
        console.error('Error deleting society:', error);
        res.status(500).json({
            message: 'Failed to delete society. Transaction rolled back.'
        });
    } 
    finally {
        connection.release();
    }
};

module.exports = {
    deleteSociety
};