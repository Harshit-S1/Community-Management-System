import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminVisitors = () => {
    const [visitors, setVisitors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); 

    useEffect(() => {
        fetchVisitors();
    }, []);

   const fetchVisitors = async () => {
        setIsLoading(true);
        try {
            // Fetching visitor logs
            const response = await api.get('/visitors/all');
            setVisitors(response.data);
            setError('');
        } 
        catch (err) {
            console.error('Error fetching visitors:', err);
            setError(err.response?.data?.message || 'Failed to load visitor logs.');
        } 
        finally {
            setIsLoading(false);
        }
    };

    // Filtering visitors
    const displayedVisitors = visitors.filter(visitor => {
        if (filter === 'active') {
            return !visitor.time_out; 
        }
        return true;
    });

    return (
        <div className="admin-visitors-container" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2>Visitor Logs</h2>
                    <p style={{ color: '#7f8c8d', margin: '5px 0 0 0' }}>Monitor all entries and exits in your society.</p>
                </div>
                <button 
                    onClick={fetchVisitors} 
                    disabled={isLoading}
                    style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        backgroundColor: '#ecf0f1',
                        border: '1px solid #bdc3c7',
                        borderRadius: '4px',
                    }}
                >
                    {isLoading ? 'Refreshing...' : 'Refresh Logs'}
                </button>
            </div>

            {error && (
                <div
                    className="error-message"
                    style={{
                    color: '#c0392b',
                    backgroundColor: '#fadbd8',
                    padding: '10px',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    }}
                >
                    {error}
                </div>
            )}

            {/* Displaying filter options */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button 
                    onClick={() => setFilter('all')}
                    style={filter === 'all' ? activeTabStyle : inactiveTabStyle}
                >
                    All Visitors
                </button>
                <button 
                    onClick={() => setFilter('active')}
                    style={filter === 'active' ? activeTabStyle : inactiveTabStyle}
                >
                    Currently Inside
                </button>
            </div>

            {/* Displaying visitor logs */}
            <div
                className="table-responsive"
                style={{
                    overflowX: 'auto',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
            >
                {isLoading && visitors.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>Loading visitor logs...</div>
                ) : displayedVisitors.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                        {filter === 'active' ? 'No active visitors currently in the society.' : 'No visitor logs found.'}
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                <th style={{ padding: '12px' }}>Name</th>
                                <th style={{ padding: '12px' }}>Visiting Flat</th>
                                <th style={{ padding: '12px' }}>Purpose</th> 
                                <th style={{ padding: '12px' }}>Entry Time</th>
                                <th style={{ padding: '12px' }}>Exit Time</th>
                                <th style={{ padding: '12px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedVisitors.map((visitor) => (
                                <tr key={visitor.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                    <td style={{ padding: '12px', fontWeight: '500' }}>{visitor.visitor_name}</td>
                                    <td style={{ padding: '12px' }}>
                                        {visitor.building_name ? `${visitor.building_name} - ` : ''}{visitor.flat_number || 'Unknown'}
                                    </td>
                                    <td style={{ padding: '12px' }}>{visitor.purpose || 'N/A'}</td>
                                    <td style={{ padding: '12px' }}>
                                        {new Date(visitor.time_in).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {visitor.time_out ? new Date(visitor.time_out).toLocaleString() : '--'}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {visitor.time_out ? (
                                        <span
                                            style={{
                                            backgroundColor: '#ebedef',
                                            color: '#7f8c8d',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem',
                                            }}
                                        >
                                            Exited
                                        </span>
                                        ) : (
                                        <span
                                            style={{
                                            backgroundColor: '#d5f5e3',
                                            color: '#27ae60',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem',
                                            }}
                                        >
                                            Inside
                                        </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const activeTabStyle = {
  padding: '8px 16px',
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const inactiveTabStyle = {
  padding: '8px 16px',
  backgroundColor: '#ecf0f1',
  color: '#333',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

export default AdminVisitors;