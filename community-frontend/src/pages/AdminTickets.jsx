import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            // Fetching tickets for the current society
            const response = await api.get('/tickets');
            setTickets(response.data);
            setError('');
        } 
        catch (err) {
            console.error('Error fetching tickets:', err);
            setError(err.response?.data?.message || 'Failed to load tickets.');
        } 
        finally {
            setIsLoading(false);
        }
    };

    const handleResolve = async (ticketId) => {
        try {
            // Resolving the selected ticket
            await api.put(`/tickets/${ticketId}/resolve`);
            // Refreshing the ticket list
            fetchTickets(); 
            // Closing the ticket details modal
            if (selectedTicket && selectedTicket.id === ticketId) {
                closeModal();
            }
        } 
        catch (err) {
            console.error('Error resolving ticket:', err);
            setError(err.response?.data?.message || 'Failed to resolve ticket.');
        }
    };

    const openModal = (ticket) => {
        setSelectedTicket(ticket);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedTicket(null);
        setIsModalOpen(false);
    };

    // Returning styles based on ticket status
    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'open':
                return { backgroundColor: '#fadbd8', color: '#c0392b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' };
            case 'in_progress':
                return { backgroundColor: '#fdebd0', color: '#d35400', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' };
            case 'resolved':
                return { backgroundColor: '#d5f5e3', color: '#27ae60', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' };
            default:
                return { backgroundColor: '#ebedef', color: '#7f8c8d', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' };
        }
    };

    return (
        <div className="admin-tickets-container" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Community Helpdesk Tickets</h2>
                <button 
                    onClick={fetchTickets} 
                    disabled={isLoading}
                    style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                    {isLoading ? 'Refreshing...' : 'Refresh List'}
                </button>
            </div>

            {/* Displaying status messages */}
            {error && <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

            {/* Displaying tickets */}
            <div className="table-responsive" style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                {isLoading && tickets.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>Loading tickets...</div>
                ) : tickets.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>No tickets found in your society.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                <th style={{ padding: '12px' }}>ID</th>
                                <th style={{ padding: '12px' }}>Title</th>
                                <th style={{ padding: '12px' }}>Resident</th>
                                <th style={{ padding: '12px' }}>Flat</th>
                                <th style={{ padding: '12px' }}>Status</th>
                                <th style={{ padding: '12px' }}>Date Submitted</th>
                                <th style={{ padding: '12px' }}>Agreements</th>
                                <th style={{ padding: '12px' }}>Details</th>
                                <th style={{ padding: '12px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map((ticket) => (
                                <tr key={ticket.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                    <td style={{ padding: '12px' }}>#{ticket.id}</td>
                                    <td style={{ padding: '12px', fontWeight: '500' }}>{ticket.title}</td>
                                    
                                    <td style={{ padding: '12px' }}>{ticket.author_name || 'Unknown'}</td> 

                                    <td style={{ padding: '12px' }}>
                                        {ticket.flat_number || 'N/A'}
                                    </td>
                                    
                                    <td style={{ padding: '12px' }}>
                                        <span style={getStatusStyle(ticket.status)}>
                                            {ticket.status?.toUpperCase() || 'OPEN'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {new Date(ticket.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {ticket.agree_count || 0}
                                    </td>
                                    
                                    {/* Displaying ticket details */}
                                    <td style={{ padding: '12px' }}>
                                        <button 
                                            onClick={() => openModal(ticket)}
                                            style={viewButtonStyle}
                                        >
                                            View
                                        </button>
                                    </td>
                                    
                                    {/* Displaying ticket actions */}
                                    <td style={{ padding: '12px' }}>
                                        {ticket.status?.toLowerCase() !== 'resolved' && (
                                            <button 
                                                onClick={() => handleResolve(ticket.id)}
                                                style={resolveButtonStyle}
                                            >
                                                Resolve
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Displaying ticket details modal */}
            {isModalOpen && selectedTicket && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <div style={modalHeaderStyle}>
                            <h3 style={{ margin: 0 }}>Ticket Details</h3>
                            <button onClick={closeModal} style={closeButtonStyle}>&times;</button>
                        </div>
                        
                        <div style={modalBodyStyle}>
                            <div style={infoGridStyle}>
                                <div style={infoItemStyle}>
                                    <strong style={{ color: '#555' }}>Resident:</strong>
                                    <span>{selectedTicket.author_name || 'Unknown'}</span>
                                </div>
                                <div style={infoItemStyle}>
                                    <strong style={{ color: '#555' }}>Flat:</strong>
                                    <span>{selectedTicket.flat_number || 'N/A'}</span>
                                </div>
                                <div style={infoItemStyle}>
                                    <strong style={{ color: '#555' }}>Status:</strong>
                                    <span style={getStatusStyle(selectedTicket.status)}>
                                        {selectedTicket.status?.toUpperCase() || 'OPEN'}
                                    </span>
                                </div>
                                <div style={infoItemStyle}>
                                    <strong style={{ color: '#555' }}>Date:</strong>
                                    <span>{new Date(selectedTicket.created_at).toLocaleDateString()}</span>
                                </div>
                                <div style={infoItemStyle}>
                                    <strong style={{ color: '#555' }}>Agreements:</strong>
                                    <span>{selectedTicket.agree_count || 0}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <strong style={{ color: '#333' }}>Title:</strong>
                                <p style={{ margin: '5px 0', fontSize: '1.1rem', fontWeight: '500' }}>{selectedTicket.title}</p>
                            </div>

                            <div style={{ marginTop: '15px' }}>
                                <strong style={{ color: '#333' }}>Description:</strong>
                                <p style={descriptionBoxStyle}>{selectedTicket.description}</p>
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <strong style={{ color: '#333' }}>Comments ({selectedTicket.comments?.length || 0}):</strong>
                                {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
                                    <div style={commentsContainerStyle}>
                                        {selectedTicket.comments.map(comment => (
                                            <div key={comment.id} style={commentItemStyle}>
                                                <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '4px' }}>
                                                    <strong>{comment.author_name || `Flat ${comment.flat_number}`}</strong> • {new Date(comment.created_at).toLocaleString()}
                                                </div>
                                                <div style={{ color: '#333' }}>{comment.content}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#7f8c8d', fontStyle: 'italic', marginTop: '10px' }}>No comments on this ticket.</p>
                                )}
                            </div>
                        </div>

                        <div style={modalFooterStyle}>
                            {selectedTicket.status?.toLowerCase() !== 'resolved' ? (
                                <button 
                                    onClick={() => handleResolve(selectedTicket.id)}
                                    style={{ ...resolveButtonStyle, padding: '10px 20px', fontSize: '1rem' }}
                                >
                                    Resolve Ticket
                                </button>
                            ) : (
                                <span style={{ color: '#27ae60', fontWeight: 'bold' }}>
                                    ✓ This ticket has been resolved.
                                </span>
                            )}
                            <button onClick={closeModal} style={cancelButtonStyle}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const viewButtonStyle = {
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem'
};

const resolveButtonStyle = {
    padding: '6px 12px',
    backgroundColor: '#2ecc71',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem'
};

const cancelButtonStyle = {
    padding: '10px 20px',
    backgroundColor: '#ecf0f1',
    color: '#333',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem'
};

// Modal Styles
const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
};

const modalContentStyle = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
};

const modalHeaderStyle = {
    padding: '20px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};

const closeButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#7f8c8d'
};

const modalBodyStyle = {
    padding: '20px',
    overflowY: 'auto',
    flex: 1
};

const infoGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '6px',
    border: '1px solid #eee'
};

const infoItemStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
};

const descriptionBoxStyle = {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '6px',
    border: '1px solid #eee',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.5',
    color: '#444',
    margin: '10px 0 0 0'
};

const commentsContainerStyle = {
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
};

const commentItemStyle = {
    backgroundColor: '#fdfdfd',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #eee',
    borderLeft: '4px solid #3498db'
};

const modalFooterStyle = {
    padding: '20px',
    borderTop: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px'
};

export default AdminTickets;