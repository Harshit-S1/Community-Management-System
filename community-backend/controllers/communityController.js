const pool = require('../config/db');

// ANNOUNCEMENTS
// Creating a new announcement
exports.createAnnouncement = async (req, res) => {
    // Allowing only admins to create announcements
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Access denied. Admin privileges required.'
        });
    }
    const { title, content } = req.body;
    const societyId = req.user.societyId;
    const createdBy = req.user.id;
    try {
        const [result] = await pool.execute(
            'INSERT INTO announcements (society_id, title, content, created_by) VALUES (?, ?, ?, ?)',
            [societyId, title, content, createdBy]
        );
        res.status(201).json({ message: 'Announcement created successfully', id: result.insertId });
    } 
    catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ error: 'Server error creating announcement' });
    }
};

// Fetching all announcements
exports.getAnnouncements = async (req, res) => {
    const societyId = req.user.societyId;
    try {
        const [announcements] = await pool.execute(
            `SELECT a.*, u.name as creator_name
             FROM announcements a
             JOIN users u ON a.created_by = u.id
             WHERE a.society_id = ?
             ORDER BY a.created_at DESC`,
            [societyId]
        );
        res.status(200).json(announcements);
    } 
    catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ error: 'Server error fetching announcements' });
    }
};

// POLLS
// Creating a new poll
exports.createPoll = async (req, res) => {
    // Allowing only admins to create polls
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Access denied. Admin privileges required.'
        });
    }
    const { question, options } = req.body; 
    const societyId = req.user.societyId;
    const createdBy = req.user.id;

    if (!options || options.length < 2) {
        return res.status(400).json({ error: 'At least two options are required.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Creating the poll
        const [pollResult] = await connection.execute(
            'INSERT INTO polls (society_id, question, created_by) VALUES (?, ?, ?)',
            [societyId, question, createdBy]
        );
        const pollId = pollResult.insertId;

        // Storing the poll options
        const optionPromises = options.map(opt =>
            connection.execute(
                'INSERT INTO poll_options (poll_id, option_text) VALUES (?, ?)',
                [pollId, opt]
            )
        );
        await Promise.all(optionPromises);

        await connection.commit();
        res.status(201).json({ message: 'Poll created successfully', id: pollId });
    } 
    catch (error) {
        await connection.rollback();
        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Server error creating poll' });
    } 
    finally {
        connection.release();
    }
};

// Fetching all polls
exports.getPolls = async (req, res) => {
    const societyId = req.user.societyId;

    try {
        // Fetching polls for the current society
        const [polls] = await pool.execute(
            `SELECT p.*, u.name as creator_name
             FROM polls p
             JOIN users u ON p.created_by = u.id
             WHERE p.society_id = ?
             ORDER BY p.created_at DESC`,
            [societyId]
        );

        if (polls.length === 0) return res.status(200).json([]);

        // Fetching the poll options and vote counts
        const pollIds = polls.map(p => p.id);
        const placeholders = pollIds.map(() => '?').join(',');

        const [options] = await pool.execute(
            `SELECT
                o.id,
                o.poll_id,
                o.option_text,
                COUNT(v.id) AS vote_count,
                MAX(CASE WHEN v.user_id = ? THEN 1 ELSE 0 END) AS voted
            FROM poll_options o
            LEFT JOIN poll_votes v
                ON o.id = v.option_id
            WHERE o.poll_id IN (${placeholders})
            GROUP BY o.id`,
            [req.user.id, ...pollIds]
        );

        // Grouping the options with their polls
        const formattedPolls = polls.map(poll => ({
            ...poll,
            options: options.filter(opt => opt.poll_id === poll.id)
        }));

        res.status(200).json(formattedPolls);
    } 
    catch (error) {
        console.error('Error fetching polls:', error);
        res.status(500).json({ error: 'Server error fetching polls' });
    }
};

// Recording a vote for a poll
exports.votePoll = async (req, res) => {
    const { pollId, optionId } = req.body;
    const userId = req.user.id;
    const societyId = req.user.societyId;

    try {
        // Verifying that the poll belongs to the current society
        const [pollCheck] = await pool.execute(
            'SELECT id FROM polls WHERE id = ? AND society_id = ?',
            [pollId, societyId]
        );

        if (pollCheck.length === 0) {
            return res.status(403).json({ error: 'Access denied or poll not found in your society.' });
        }

        // Recording the user's vote
        await pool.execute(
            'INSERT INTO poll_votes (poll_id, user_id, option_id) VALUES (?, ?, ?)',
            [pollId, userId, optionId]
        );
        res.status(200).json({ message: 'Vote recorded successfully.' });
    } 
    catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                error: 'You have already voted on this poll.',
                message: 'You have already voted on this poll.'
            });
        }
        console.error('Error recording vote:', error);
        res.status(500).json({ error: 'Server error recording vote' });
    }
};