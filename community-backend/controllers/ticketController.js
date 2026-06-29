const db = require('../config/db');

// Creating a new ticket
exports.createTicket = async (req, res) => {
    try {
        const {title, description} = req.body;
        const authorId = req.user.id; 
        const societyId = req.user.societyId; 

        // Storing the ticket in the current society
        const [result] = await db.query(
            'INSERT INTO tickets (society_id, author_id, title, description) VALUES (?, ?, ?, ?)',
            [societyId, authorId, title, description]
        );
        res.status(201).json({ 
            message: 'Ticket created successfully', 
            ticketId: result.insertId 
        });
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while creating ticket' });
    }
};

// Fetching all tickets
exports.getAllTickets = async (req, res) => {
    try {
        const societyId = req.user.societyId;

        // Fetching tickets for the current society
        const [tickets] = await db.query(`
            SELECT
                t.id,
                t.title,
                t.description,
                t.status,
                t.agree_count,
                t.created_at,
                u.name as author_name,
                f.flat_number
            FROM tickets t
            JOIN users u
                ON t.author_id = u.id
            LEFT JOIN flats f
                ON u.flat_id = f.id
            WHERE t.society_id = ?
            ORDER BY t.created_at DESC
        `, [societyId]);
        
        // Fetching the comments for each ticket
        for (const ticket of tickets) {
            const [comments] = await db.query(`
                SELECT
                    tc.id,
                    tc.content,
                    tc.created_at,
                    u.name as author_name,
                    f.flat_number
                FROM ticket_comments tc
                JOIN users u
                    ON tc.user_id = u.id
                LEFT JOIN flats f
                    ON u.flat_id = f.id
                WHERE tc.ticket_id = ?
                ORDER BY tc.created_at ASC
            `, [ticket.id]);
            ticket.comments = comments;
        }
        res.status(200).json(tickets);
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching tickets' });
    }
};

// Adding a comment to a ticket
exports.addComment = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const userId = req.user.id; 
        const societyId = req.user.societyId;
        const {content} = req.body;

        // Checking if the ticket belongs to the current society
        const [ticketCheck] = await db.query('SELECT id FROM tickets WHERE id = ? AND society_id = ?', [ticketId, societyId]);
        if (ticketCheck.length === 0) {
            return res.status(403).json({message: 'Unauthorized: Ticket not found in your society'});
        }
        await db.query(
            'INSERT INTO ticket_comments (ticket_id, user_id, content) VALUES (?, ?, ?)',
            [ticketId, userId, content]
        );
        res.status(201).json({message: 'Comment added successfully'});
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error while adding comment'});
    }
};

// Recording an agreement for a ticket
exports.agreeTicket = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const userId = req.user.id;
        const societyId = req.user.societyId;

        // Checking if the ticket belongs to the current society
        const [ticketCheck] = await db.query('SELECT id FROM tickets WHERE id = ? AND society_id = ?', [ticketId, societyId]);
        if (ticketCheck.length === 0) {
            return res.status(403).json({message: 'Unauthorized: Ticket not found in your society'});
        }

        // Recording the user's agreement
        try {
            await db.query(
                'INSERT INTO ticket_agreements (ticket_id, user_id) VALUES (?, ?)',
                [ticketId, userId]
            );
        } 
        catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({message: 'You have already agreed to this ticket'});
            }
            throw err; 
        }
        await db.query(
            'UPDATE tickets SET agree_count = agree_count + 1 WHERE id = ?',
            [ticketId]
        );
        res.status(200).json({message: 'Agreement recorded successfully'});
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error while recording agreement'});
    }
};

// Resolving a ticket
exports.resolveTicket = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }
        const ticketId = req.params.id;
        const societyId = req.user.societyId;

        // Updating the ticket status
        const [result] = await db.query(
            'UPDATE tickets SET status = "resolved" WHERE id = ? AND society_id = ?',
            [ticketId, societyId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Ticket not found or unauthorized' });
        }
        res.status(200).json({ message: 'Ticket resolved successfully' });
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while resolving ticket' });
    }
};