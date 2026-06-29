import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DangerZone from "./DangerZone.jsx";

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Loading the dashboard statistics
        const fetchDashboardStats = async () => {
            try {
                const response = await api.get('/dashboard/stats');
                setStats(response.data);
            } 
            catch (err) {
                console.error("Error fetching dashboard stats:", err);
                setError('Failed to load dashboard statistics.');
            } 
            finally {
                setIsLoading(false);
            }
        };
        fetchDashboardStats();
    }, []);
    if (isLoading) {
        return <div className="dashboard-loading">Loading society statistics...</div>;
    }
    if (error) {
        return <div className="error-message" style={{ color: 'red', padding: '20px' }}>{error}</div>;
    }
    return (
        <div className="admin-dashboard" style={pageStyle}>
            <header className="dashboard-header" style={headerStyle}>
                <h2>Admin Dashboard</h2>
                <p>Welcome back, {user?.name || 'Admin'}! Here is the overview for your society.</p>
            </header>

            {/* Displaying the society overview */}
            {stats && (
                <div className="stats-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '18px',
                    marginBottom: '40px'
                }}>
                    {/* Residents Card */}
                    <div className="stat-card" style={cardStyle}>
                        <h3>Total Residents</h3>
                        <div className="stat-number" style={numberStyle}>{stats.totalResidents}</div>
                    </div>

                    {/* Flats Card */}
                    <div className="stat-card" style={cardStyle}>
                        <h3>Registered Flats</h3>
                        <div className="stat-number" style={numberStyle}>{stats.totalFlats}</div>
                    </div>

                    {/* Visitors Card */}
                    <div className="stat-card" style={cardStyle}>
                        <h3>Visitors Today</h3>
                        <div className="stat-number" style={numberStyle}>{stats.visitorsToday}</div>
                    </div>

                    {/* Tickets Overview Card */}
                    <div className="stat-card" style={{ ...cardStyle, gridColumn: '1 / -1' }}>
                        <h3>Helpdesk Tickets Overview</h3>
                       <div style={ticketRowStyle}>
                            <div style={ticketItemStyle}>
                                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                                    {stats.tickets?.open || 0}
                                </span>
                                <p>Open</p>
                            </div>
                            <div style={ticketItemStyle}>
                                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#2ecc71' }}>
                                    {stats.tickets?.resolved || 0}
                                </span>
                                <p>Resolved</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <DangerZone />
        </div>
    );
};

const pageStyle = {
    width: '100%',
    padding: '10px 0'
};

const headerStyle = {
    marginBottom: '30px'
};

const ticketRowStyle = {
    display: 'flex',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: '15px'
};

const ticketItemStyle = {
    textAlign: 'center',
    flex: 1
};

const cardStyle = {
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    textAlign: 'center'
};

const numberStyle = {
    fontSize: '30px',
    fontWeight: 'bold',
    color: '#3498db',
    marginTop: '10px'
};

export default AdminDashboard;