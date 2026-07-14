const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db'); 
const cron = require('node-cron');
const userRoutes = require('./routes/userRoutes');
const flatRoutes = require('./routes/flatRoutes');
const societyRoutes = require('./routes/societyRoutes');
const app = express();

app.use(cors()); 
app.use(express.json()); 

// Import Routes
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const communityRoutes = require('./routes/communityRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const financeRoutes = require('./routes/financeRoutes'); 

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/finance', financeRoutes); 
app.use('/api/flats', flatRoutes);
app.use('/api/societies', societyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Server and Database are up and running!' });
});

// Cleaning up old visitor records every day
cron.schedule('0 0 * * *', async () => {
    try {
        // Removing visitor records older than one month
        // db.query returns an array with elements - result and fields
        const [result] = await db.query(`
            DELETE FROM visitors
            WHERE exit_time IS NOT NULL
            AND exit_time < NOW() - INTERVAL 1 MONTH
        `);
        console.log(`[CRON] Cleaned up ${result.affectedRows} old visitor records.`);
    } 
    catch (err) {
        console.error('[CRON] Error cleaning up visitor records:', err);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
