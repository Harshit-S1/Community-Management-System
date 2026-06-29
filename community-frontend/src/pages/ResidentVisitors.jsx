import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ResidentVisitors = () => {
    const [visitors, setVisitors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchVisitors();
    }, []);

    // Loading the visitor history
    const fetchVisitors = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/visitors/my-history');
            setVisitors(response.data || []);
            setError('');
        } 
        catch (err) {
            console.error('Error fetching visitors:', err);
            setError('Failed to load visitor history. Please try again later.');
        } 
        finally {
            setIsLoading(false);
        }
    };
    if (isLoading) {
        return <div style={{ padding: '20px', color: '#666' }}>Loading visitor history...</div>;
    }
    return (
        <div style={pageStyle}>
            <header style={headerStyle}>
                <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>My Visitors</h2>
                <p style={{ margin: 0, color: '#666' }}>
                    View the log of all visitors who have checked in to your flat.
                </p>
            </header>

            {error && <div style={errorBannerStyle}>{error}</div>}
            {/* Displaying the visitor history */}
            {!error && visitors.length === 0 ? (
                <div style={emptyStateStyle}>
                    No visitors have been logged for your flat yet.
                </div>
            ) : (
                <div style={tableContainerStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={tableHeaderRowStyle}>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>Phone</th>
                                <th style={thStyle}>Purpose</th>
                                <th style={thStyle}>Entry Time</th>
                                <th style={thStyle}>Exit Time</th>
                                <th style={thStyle}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visitors.map((visitor) => (
                                <tr key={visitor.id} style={tableRowStyle}>
                                    <td style={{...tdStyle, fontWeight: 'bold', color: '#333'}}>
                                        {visitor.visitor_name}
                                    </td>
                                    <td style={tdStyle}>{visitor.phone}</td>
                                    <td style={tdStyle}>{visitor.purpose}</td>
                                    <td style={tdStyle}>
                                        {new Date(visitor.time_in).toLocaleString(undefined, {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        })}
                                    </td>
                                    <td style={tdStyle}>
                                        {visitor.time_out 
                                            ? new Date(visitor.time_out).toLocaleString(undefined, {
                                                dateStyle: 'medium',
                                                timeStyle: 'short'
                                              }) 
                                            : '-'}
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            ...statusBadgeStyle,
                                            backgroundColor: !visitor.time_out ? '#eafaf1' : '#f8f9fa',
                                            color: !visitor.time_out ? '#2ecc71' : '#7f8c8d'
                                        }}>
                                            {!visitor.time_out ? 'Inside' : 'Departed'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const pageStyle = {
    width: '100%',
    flex: 1,
    boxSizing: 'border-box',
    padding: '20px',
    margin: 0,
    display: 'flex',
    flexDirection: 'column'
};

const headerStyle = {
    marginBottom: '30px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

const errorBannerStyle = {
    backgroundColor: '#fdecea',
    color: '#e74c3c',
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '20px',
    borderLeft: '5px solid #e74c3c'
};

const emptyStateStyle = {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '8px',
    border: '1px solid #eaeaea',
    color: '#777',
    textAlign: 'center',
    fontSize: '16px'
};

const tableContainerStyle = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #eaeaea',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    overflowX: 'auto'
};

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
};

const tableHeaderRowStyle = {
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #eaeaea'
};

const thStyle = {
    padding: '15px',
    color: '#555',
    fontWeight: '600',
    fontSize: '14px'
};

const tableRowStyle = {
    borderBottom: '1px solid #eaeaea',
    transition: 'background-color 0.2s'
};

const tdStyle = {
    padding: '15px',
    color: '#555',
    fontSize: '14px'
};

const statusBadgeStyle = {
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'inline-block'
};

export default ResidentVisitors;