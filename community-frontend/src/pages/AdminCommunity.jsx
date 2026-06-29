import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminCommunity = () => {
    const [activeTab, setActiveTab] = useState('announcements'); // 'announcements' or 'polls'
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [announcements, setAnnouncements] = useState([]);
    const [polls, setPolls] = useState([]);
    const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });
    const [pollForm, setPollForm] = useState({ question: '', options: ['', ''] }); // Require at least 2 options

    useEffect(() => {
        if (activeTab === 'announcements') {
            fetchAnnouncements();
        } else {
            fetchPolls();
        }
    }, [activeTab]);

    // Displaying status messages
    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    // Announcements Part
    // Loading the announcements
    const fetchAnnouncements = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/community/announcements');
            setAnnouncements(response.data);
        } 
        catch (err) {
            console.error('Error fetching announcements:', err);
            showMessage('error', 'Failed to load announcements.');
        } 
        finally {
            setIsLoading(false);
        }
    };

    // Handling the announcement submission
    const handleAnnouncementSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/community/announcements', announcementForm);
            showMessage('success', 'Announcement posted successfully.');
            setAnnouncementForm({ title: '', content: '' });
            fetchAnnouncements();
        } 
        catch (err) {
            showMessage('error', err.response?.data?.message || 'Failed to post announcement.');
        }
    };

    // Polls part
    // Loading the polls
    const fetchPolls = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/community/polls');
            setPolls(response.data);
        } 
        catch (err) {
            console.error('Error fetching polls:', err);
            showMessage('error', 'Failed to load polls.');
        } 
        finally {
            setIsLoading(false);
        }
    };

    const handlePollOptionChange = (index, value) => {
        const newOptions = [...pollForm.options];
        newOptions[index] = value;
        setPollForm({ ...pollForm, options: newOptions });
    };

    const addPollOption = () => {
        setPollForm({ ...pollForm, options: [...pollForm.options, ''] });
    };

    const removePollOption = (index) => {
        if (pollForm.options.length <= 2) return; // Enforce minimum 2 options
        const newOptions = pollForm.options.filter((_, i) => i !== index);
        setPollForm({ ...pollForm, options: newOptions });
    };

    // Handling the poll submission
    const handlePollSubmit = async (e) => {
        e.preventDefault();
        const validOptions = pollForm.options.filter(opt => opt.trim() !== '');
        if (validOptions.length < 2) {
            showMessage('error', 'A poll requires at least two valid options.');
            return;
        }
        try {
            await api.post('/community/polls', {
                question: pollForm.question,
                options: validOptions
            });
            showMessage('success', 'Poll created successfully.');
            setPollForm({ question: '', options: ['', ''] });
            fetchPolls();
        } 
        catch (err) {
            showMessage('error', err.response?.data?.message || 'Failed to create poll.');
        }
    };

    return (
        <div className="admin-community-container" style={{ padding: '20px' }}>
            <h2>Community Hub</h2>
            <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>Manage society announcements and polls.</p>

            {message.text && (
                <div style={{
                    padding: '10px',
                    marginBottom: '15px',
                    borderRadius: '4px',
                    backgroundColor: message.type === 'error' ? '#fadbd8' : '#d5f5e3',
                    color: message.type === 'error' ? '#c0392b' : '#27ae60'
                }}>
                    {message.text}
                </div>
            )}

            {/* Displaying the community controls */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button
                    onClick={() => setActiveTab('announcements')}
                    style={activeTab === 'announcements' ? activeTabStyle : inactiveTabStyle}
                >
                    Announcements
                </button>
                <button
                    onClick={() => setActiveTab('polls')}
                    style={activeTab === 'polls' ? activeTabStyle : inactiveTabStyle}
                >
                    Polls
                </button>
            </div>

            {/* Displaying the announcements */}
            {activeTab === 'announcements' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                    {/* Create Announcement Form */}
                    <div style={cardStyle}>
                        <h3>Post Announcement</h3>
                        <form onSubmit={handleAnnouncementSubmit} style={{ marginTop: '15px' }}>
                            <div style={formGroupStyle}>
                                <label>Title</label>
                                <input
                                    required
                                    type="text"
                                    value={announcementForm.title}
                                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={formGroupStyle}>
                                <label>Content</label>
                                <textarea
                                    required
                                    rows="4"
                                    value={announcementForm.content}
                                    onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                                    style={inputStyle}
                                ></textarea>
                            </div>
                            <button type="submit" style={primaryButtonStyle}>Post Announcement</button>
                        </form>
                    </div>

                    {/* Announcement List */}
                    <div style={cardStyle}>
                        <h3>Recent Announcements</h3>
                        {isLoading ? <p>Loading...</p> : announcements.length === 0 ? <p style={{ color: '#7f8c8d' }}>No announcements found.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                                {announcements.map((announcement) => (
                                    <div key={announcement.id} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '4px' }}>
                                        <h4 style={{ margin: '0 0 5px 0' }}>{announcement.title}</h4>
                                        <small style={{ color: '#7f8c8d' }}>
                                            By {announcement.creator_name} on {new Date(announcement.created_at).toLocaleDateString()}
                                        </small>
                                        <p style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>{announcement.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Displaying the community polls */}
            {activeTab === 'polls' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                    {/* Create Poll Form */}
                    <div style={cardStyle}>
                        <h3>Create New Poll</h3>
                        <form onSubmit={handlePollSubmit} style={{ marginTop: '15px' }}>
                            <div style={formGroupStyle}>
                                <label>Poll Question</label>
                                <input
                                    required
                                    type="text"
                                    value={pollForm.question}
                                    onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })}
                                    style={inputStyle}
                                    placeholder="What should we do?"
                                />
                            </div>
                            
                            <div style={formGroupStyle}>
                                <label>Options</label>
                                {pollForm.options.map((opt, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                                        <input
                                            required
                                            type="text"
                                            value={opt}
                                            onChange={(e) => handlePollOptionChange(index, e.target.value)}
                                            style={{ ...inputStyle, marginBottom: 0 }}
                                            placeholder={`Option ${index + 1}`}
                                        />
                                        {pollForm.options.length > 2 && (
                                            <button 
                                                type="button" 
                                                onClick={() => removePollOption(index)}
                                                style={{ padding: '8px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                X
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button 
                                    type="button" 
                                    onClick={addPollOption}
                                    style={{ padding: '8px', backgroundColor: '#ecf0f1', border: '1px solid #bdc3c7', borderRadius: '4px', cursor: 'pointer', marginTop: '5px' }}
                                >
                                    + Add Option
                                </button>
                            </div>
                            
                            <button type="submit" style={{ ...primaryButtonStyle, marginTop: '10px' }}>Create Poll</button>
                        </form>
                    </div>

                    {/* Polls List (Results) */}
                    <div style={cardStyle}>
                        <h3>Active Polls & Results</h3>
                        {isLoading ? <p>Loading...</p> : polls.length === 0 ? <p style={{ color: '#7f8c8d' }}>No polls found.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '15px' }}>
                                {polls.map((poll) => {
                                    const totalVotes = poll.options.reduce((sum, opt) => sum + Number(opt.vote_count), 0);
                                    
                                    return (
                                        <div key={poll.id} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '4px' }}>
                                            <h4 style={{ margin: '0 0 5px 0' }}>{poll.question}</h4>
                                            <small style={{ color: '#7f8c8d', display: 'block', marginBottom: '15px' }}>
                                                Created by {poll.creator_name} • {totalVotes} total votes
                                            </small>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {poll.options.map(opt => {
                                                    const percentage = totalVotes === 0 ? 0 : Math.round((Number(opt.vote_count) / totalVotes) * 100);
                                                    return (
                                                        <div key={opt.id}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '14px' }}>
                                                                <span>{opt.option_text}</span>
                                                                <span>{opt.vote_count} votes ({percentage}%)</span>
                                                            </div>
                                                            <div style={{ width: '100%', backgroundColor: '#ecf0f1', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                                                                <div style={{ width: `${percentage}%`, backgroundColor: '#3498db', height: '100%' }}></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
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

const primaryButtonStyle = {
  padding: '10px 15px',
  backgroundColor: '#2ecc71',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  width: '100%',
};

const cardStyle = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const formGroupStyle = {
  marginBottom: '15px',
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
};

const inputStyle = {
  padding: '10px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  width: '100%',
};

export default AdminCommunity;