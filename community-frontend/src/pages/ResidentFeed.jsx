import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ResidentFeed = () => {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [comments, setComments] = useState({});
    const [agreeingTicket, setAgreeingTicket] = useState(null);

    useEffect(() => {
        fetchTickets();
    }, []);

    // Loading the community feed
    const fetchTickets = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/tickets');
            setTickets(response.data || []);
            setError('');
        } catch (err) {
            console.error('Error fetching tickets:', err);
            setError('Failed to load the community feed.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handling the ticket creation
    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/tickets', { title: newTitle, description: newDescription });
            setNewTitle('');
            setNewDescription('');
            fetchTickets();
        } catch (err) {
            alert('Failed to create ticket. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handling agees on the ticket
    const handleAgree = async (ticketId) => {
        try {
            setAgreeingTicket(ticketId);

            await api.post(`/tickets/${ticketId}/agree`);

            fetchTickets();
        } catch (err) {
            alert(err.response?.data?.message || 'Could not register agreement.');
        } finally {
            setAgreeingTicket(null);
        }
    };

    // Handles the comments on the ticket
    const handleAddComment = async (e, ticketId) => {
        e.preventDefault();
        const text = comments[ticketId];
        if (!text || text.trim() === '') return;

        try {
            await api.post(`/tickets/${ticketId}/comments`, { content: text });
            setComments({ ...comments, [ticketId]: '' }); 
            fetchTickets(); 
        } catch (err) {
            alert('Failed to post comment.');
        }
    };

    if (isLoading) {
        return <div style={{ padding: '20px', color: '#666' }}>Loading feed...</div>;
    }

    return (
        <div style={pageStyle}>
            <header style={headerStyle}>
                <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>Community Helpdesk</h2>
                <p style={{ margin: 0, color: '#666' }}>
                    Raise maintenance requests, report issues, and discuss with your neighbors.
                </p>
            </header>

            {error && <div style={errorBannerStyle}>{error}</div>}

            {/* Displaying the ticket submission form */}
            <div style={{...cardStyle, marginBottom: '30px'}}>
                <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '18px' }}>Raise a New Request</h3>
                <form onSubmit={handleCreateTicket} style={formStyle}>
                    <input 
                        type="text" 
                        placeholder="Brief title of the issue..." 
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        required
                        style={inputStyle}
                    />
                    <textarea 
                        placeholder="Describe the issue in detail..." 
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        required
                        rows="3"
                        style={{ ...inputStyle, resize: 'vertical' }}
                    />
                    <button 
                        type="submit" 
                        disabled={isSubmitting || !newTitle || !newDescription}
                        style={{ ...buttonStyle, alignSelf: 'flex-start', backgroundColor: (isSubmitting || !newTitle || !newDescription) ? '#bdc3c7' : '#3498db' }}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                </form>
            </div>

            {/* Displaying the community requests */}
            <div style={listStyle}>
                {tickets.length === 0 ? (
                    <div style={emptyStateStyle}>No maintenance requests have been raised yet.</div>
                ) : (
                    tickets.map(ticket => (
                        <div key={ticket.id} style={cardStyle}>
                            <div style={cardHeaderStyle}>
                                <div>
                                    <h4 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#2c3e50' }}>{ticket.title}</h4>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#7f8c8d' }}>
                                        Posted by Flat {ticket.flat_number} • {new Date(ticket.created_at).toLocaleDateString(undefined, {day: 'numeric',month: 'short',year: 'numeric'})}
                                    </p>
                                </div>
                                <span style={{
                                    ...statusBadgeStyle,
                                    backgroundColor: ticket.status === 'resolved' ? '#eafaf1' : '#fef9e7',
                                    color: ticket.status === 'resolved' ? '#2ecc71' : '#f39c12'
                                }}>
                                    {ticket.status === 'resolved'? 'Resolved': 'Open'}
                                </span>
                            </div>
                            
                            <p style={{ margin: '15px 0', color: '#444', lineHeight: '1.5' }}>
                                {ticket.description}
                            </p>

                            <button
                                onClick={() => handleAgree(ticket.id)}
                                disabled={agreeingTicket === ticket.id}
                                style={{
                                    ...buttonStyle,
                                    backgroundColor:
                                        agreeingTicket === ticket.id ? '#bdc3c7' : '#3498db'
                                }}
                            >
                                {agreeingTicket === ticket.id
                                    ? 'Agreeing...'
                                    : `Agree (${ticket.agree_count})`}
                            </button>

                            {/* Displaying the discussion */}
                            <div style={commentsSectionStyle}>
                                {(ticket.comments || []).map(comment => (
                                    <div key={comment.id} style={singleCommentStyle}>
                                        <span style={{ fontWeight: 'bold', color: '#333' }}>Flat {comment.flat_number}: </span>
                                        <span style={{ color: '#555' }}>{comment.content}</span>
                                    </div>
                                ))}
                                
                                <form onSubmit={(e) => handleAddComment(e, ticket.id)} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <input 
                                        type="text"
                                        placeholder="Add a comment..."
                                        value={comments[ticket.id] || ''}
                                        onChange={(e) => setComments({ ...comments, [ticket.id]: e.target.value })}
                                        style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: '14px' }}
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!comments[ticket.id]}
                                        style={{ ...buttonStyle, padding: '8px 15px', backgroundColor: !comments[ticket.id] ? '#bdc3c7' : '#2ecc71' }}
                                    >
                                        Reply
                                    </button>
                                </form>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};


const pageStyle = {
  width: '100%',
  flex: 1,
  boxSizing: 'border-box',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle = {
  marginBottom: '20px',
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const cardStyle = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #eaeaea',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const inputStyle = {
  padding: '10px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '15px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const buttonStyle = {
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '10px 20px',
  cursor: 'pointer',
};

const listStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};
const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

const statusBadgeStyle = {
  padding: '4px 10px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 'bold',
};

const commentsSectionStyle = {
  backgroundColor: '#fafafa',
  padding: '15px',
  borderRadius: '6px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const singleCommentStyle = {
  fontSize: '14px',
  padding: '4px 0',
};

const emptyStateStyle = {
  backgroundColor: '#fafafa',
  padding: '30px',
  borderRadius: '8px',
  border: '1px dashed #ccc',
  color: '#777',
  textAlign: 'center',
};

const errorBannerStyle = {
  backgroundColor: '#fdecea',
  color: '#e74c3c',
  padding: '15px',
  borderRadius: '5px',
  marginBottom: '20px',
  borderLeft: '5px solid #e74c3c',
};

export default ResidentFeed;