const pool = require('../config/db');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Creating a Razorpay order
exports.createOrder = async (req, res) => {
    try {
        const { dueId } = req.params;
        
        // Fetching the due details
        const [due] = await pool.execute(
            `SELECT amount, status
            FROM monthly_dues
            WHERE id = ?
            AND society_id = ?
            AND flat_id = ?`,
            [
                dueId,
                req.user.societyId,
                req.user.flatId
            ]
        );
        if (!due.length) return res.status(404).json({ message: 'Due not found' });
        if (due[0].status === 'paid') {
            return res.status(400).json({
                message: 'This due has already been paid.'
            });
        }

        const options = {
            amount: due[0].amount * 100,
            currency: "INR",
            receipt: `receipt_due_${dueId}`
        };

        // Fetching the society's payment configuration
        const [society] = await pool.execute(
            `SELECT razorpay_key_id, razorpay_key_secret
            FROM societies
            WHERE id = ?`,
            [req.user.societyId]
        );
        if (society.length === 0) {
            return res.status(404).json({
                message: 'Society not found.'
            });
        }
        if (!society[0].razorpay_key_id || !society[0].razorpay_key_secret) {
            return res.status(400).json({
                message: 'Payment gateway is not configured for this society.'
            });
        }
        // Creating the Razorpay order
        const razorpay = new Razorpay({
            key_id: society[0].razorpay_key_id,
            key_secret: society[0].razorpay_key_secret
        });
        const order = await razorpay.orders.create(options);
        res.json({ order, dueId,key: society[0].razorpay_key_id });
    } 
    catch (error) {
        console.error("Error creating payment order:", error);
        res.status(500).json({
            message: "Failed to create payment order"
        });
    }
};

// Verifying a completed payment
exports.verifyPayment = async (req, res) => {
    try {
        const [society] = await pool.execute(
            `SELECT razorpay_key_secret
            FROM societies
            WHERE id = ?`,
            [req.user.societyId]
        );
        if (society.length === 0) {
            return res.status(404).json({
                message: "Society not found."
            });
        }
        if (!society[0].razorpay_key_secret) {
            return res.status(400).json({
                message: "Payment gateway is not configured for this society."
            });
        }
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dueId } = req.body;

        // Verifying the payment signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", society[0].razorpay_key_secret)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            // Updating the payment records
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();
                const [due] = await connection.execute(
                    `SELECT amount, status
                    FROM monthly_dues
                    WHERE id = ?
                    AND society_id = ?
                    AND flat_id = ?`,
                    [
                        dueId,
                        req.user.societyId,
                        req.user.flatId
                    ]
                );
                if (due.length === 0) {
                    throw new Error("Due not found.");
                }
                if (due[0].status === 'paid') {
                    throw new Error("This due has already been paid.");
                }
                await connection.execute(
                    `UPDATE monthly_dues
                    SET status='paid'
                    WHERE id=?`,
                    [dueId]
                );
                await connection.execute(
                    `INSERT INTO payments
                    (
                        society_id,
                        due_id,
                        amount_paid,
                        razorpay_order_id,
                        razorpay_payment_id
                    )
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        req.user.societyId,
                        dueId,
                        due[0].amount,
                        razorpay_order_id,
                        razorpay_payment_id
                    ]
                );

                await connection.commit();
                res.json({
                    success: true,
                    message: "Payment verified successfully"
                });
            } 
            catch (error) {
                await connection.rollback();
                throw error;
            } 
            finally {
                connection.release();
            }
        } 
        else {
            res.status(400).json({ success: false, message: "Invalid payment signature" });
        }
    } 
    catch (error) {
        res.status(500).json({ message: 'Payment verification failed' });
    }
};


// Generating Monthly Dues 
exports.generateMonthlyDues = async (req, res) => {
    // Allowing only admins to generate dues
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { month, amount } = req.body; // month format: 'YYYY-MM'
    const societyId = req.user.societyId;

    if (!month || !amount) {
        return res.status(400).json({ error: 'Month and amount are required.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Fetching all occupied flats
        const [flats] = await connection.execute(
            `
            SELECT DISTINCT f.id
            FROM flats f
            INNER JOIN users u
                ON u.flat_id = f.id
            WHERE
                f.society_id = ?
                AND u.role = 'resident'
            `,
            [societyId]
        );

        if (flats.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'No flats found in this society to generate dues for.' });
        }
        // Creating dues for each flat
        const duePromises = flats.map(flat => 
            connection.execute(
                'INSERT INTO monthly_dues (society_id, flat_id, month, amount) VALUES (?, ?, ?, ?)',
                [societyId, flat.id, month, amount]
            )
        );
        
        await Promise.all(duePromises);
        await connection.commit();
        res.status(201).json({ message: `Dues successfully generated for ${flats.length} occupied flats.` });
    } 
    catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Dues for this month have already been generated.' });
        }
        console.error('Error generating dues:', error);
        res.status(500).json({ error: 'Server error generating monthly dues.' });
    } 
    finally {
        connection.release();
    }
};

// Financial Report
exports.getFinancialReport = async (req, res) => {
    // Allowing only admins to view the financial report
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const societyId = req.user.societyId;

    try {
        // Fetching the financial summary
        const [revenueResult] = await pool.execute(
            'SELECT SUM(amount_paid) as total_revenue FROM payments WHERE society_id = ?',
            [societyId]
        );
        const totalRevenue = revenueResult[0].total_revenue || 0;

        const [paidFlatsResult] = await pool.execute(
            "SELECT COUNT(*) as paid_count FROM monthly_dues WHERE society_id = ? AND status = 'paid'",
            [societyId]
        );
        const [pendingFlatsResult] = await pool.execute(
            "SELECT COUNT(*) as pending_count FROM monthly_dues WHERE society_id = ? AND status = 'pending'",
            [societyId]
        );

        res.status(200).json({
            revenueCollected: parseFloat(totalRevenue),
            paidFlatsCount: paidFlatsResult[0].paid_count,
            pendingFlatsCount: pendingFlatsResult[0].pending_count
        });
    } 
    catch (error) {
        console.error('Error fetching financial report:', error);
        res.status(500).json({ error: 'Server error fetching financial report.' });
    }
};

// Dues for resident
exports.getMyDues = async (req, res) => {
    // Allowing only residents to view their dues
    if (req.user.role !== 'resident') {
        return res.status(403).json({ error: 'Access denied. Resident privileges required.' });
    }

    const societyId = req.user.societyId;
    const flatId = req.user.flatId; 
    // Making sure the resident has an assigned flat
    if (!flatId) {
        return res.status(400).json({ error: 'No flat assigned to this resident account.' });
    }
    try {
        // Fetching the resident's dues
        const [dues] = await pool.execute(
            `SELECT id, month, amount, status, created_at 
             FROM monthly_dues 
             WHERE society_id = ? AND flat_id = ?
             ORDER BY month DESC`,
            [societyId, flatId]
        );
        res.status(200).json(dues);
    } 
    catch (error) {
        console.error('Error fetching personal dues:', error);
        res.status(500).json({ error: 'Server error fetching your dues.' });
    }
};

// Fetching the monthly dues status
exports.getMonthlyDuesStatus = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Admin privileges required.'
        });
    }

    const societyId = req.user.societyId;
    const { month } = req.query;
    if (!month) {
        return res.status(400).json({
            error: 'Month is required.'
        });
    }
    const [rows] = await pool.execute(
        `SELECT
            md.id,
            md.month,
            md.amount,
            md.status,
            f.flat_number,
            u.name AS resident_name
        FROM monthly_dues md
        JOIN flats f
            ON md.flat_id = f.id
        LEFT JOIN users u
            ON u.flat_id = f.id
            AND u.role='resident'
        WHERE md.society_id = ?
        AND md.month = ?
        ORDER BY f.flat_number
        `,
        [societyId, month]
    );
    res.json(rows);
};

// Fetching the payment settings
exports.getPaymentSettings = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Admin privileges required.'
        });
    }
    const [society] = await pool.execute(
        `SELECT
            razorpay_key_id,
            razorpay_key_secret
        FROM societies
        WHERE id = ?
        `,
        [req.user.societyId]
    );
    if (society.length === 0) {
        return res.status(404).json({
            error: 'Society not found.'
        });
    }
    res.json({
        razorpay_key_id: society[0].razorpay_key_id || '',
        configured: !!society[0].razorpay_key_secret
    });
};

// Updating the payment settings
exports.updatePaymentSettings = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Admin privileges required.'
        });
    }
    const {
        razorpay_key_id,
        razorpay_key_secret
    } = req.body;
    if (!razorpay_key_id) {
        return res.status(400).json({
            error: 'Razorpay Key ID is required.'
        });
    }
    const [society] = await pool.execute(
        `SELECT razorpay_key_secret
        FROM societies
        WHERE id = ?
        `,
        [req.user.societyId]
    );
    if (society.length === 0) {
        return res.status(404).json({
            error: 'Society not found.'
        });
    }
    const secretToSave =
        razorpay_key_secret?.trim()
            ? razorpay_key_secret
            : society[0].razorpay_key_secret;

    await pool.execute(
        `UPDATE societies
        SET
            razorpay_key_id = ?,
            razorpay_key_secret = ?
        WHERE id = ?
        `,
        [
            razorpay_key_id,
            secretToSave,
            req.user.societyId
        ]
    );
    res.json({
        message: 'Payment settings updated successfully.'
    });
};