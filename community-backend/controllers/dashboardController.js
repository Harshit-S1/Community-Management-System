const pool = require('../config/db');

exports.getDashboardStats = async (req, res) => {
    // Allowing only admins to access the dashboard
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin privileges required.' });
    }

    // Getting the current society ID
    const societyId = req.user.societyId;

    try {
        // Fetching the dashboard statistics
        const [ticketStats] = await pool.execute(`
            SELECT status, COUNT(*) as count
            FROM tickets
            WHERE society_id = ?
            GROUP BY status
        `, [societyId]);

        const tickets = {
            open: 0,
            in_progress: 0,
            resolved: 0,
            total: 0
        };

        ticketStats.forEach(row => {
            const status = row.status.toLowerCase();
            if (tickets[status] !== undefined) {
                tickets[status] = row.count;
            }
            tickets.total += row.count;
        });

        const [visitorStats] = await pool.execute(`
            SELECT COUNT(*) as count
            FROM visitors
            WHERE society_id = ? AND DATE(entry_time) = CURDATE()
        `, [societyId]);
        const visitorsToday = visitorStats[0].count;

        const [residentStats] = await pool.execute(`
            SELECT COUNT(*) as count
            FROM users
            WHERE society_id = ? AND role = 'resident'
        `, [societyId]);
        const totalResidents = residentStats[0].count;

        const [flatStats] = await pool.execute(`
            SELECT COUNT(*) as count
            FROM flats
            WHERE society_id = ?
        `, [societyId]);
        const totalFlats = flatStats[0].count;

        // Sending all dashboard statistics
        res.status(200).json({
            tickets,
            visitorsToday,
            totalResidents,
            totalFlats
        });

    } 
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Server error fetching dashboard stats' });
    }
};