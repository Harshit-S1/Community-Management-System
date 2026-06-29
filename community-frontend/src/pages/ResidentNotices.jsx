import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ResidentNotices = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [polls, setPolls] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [votingOn, setVotingOn] = useState(null);

    useEffect(() => {
        fetchCommunityData();
    }, []);

    // Loading the community notices and polls
    const fetchCommunityData = async () => {
        try {
            setIsLoading(true);
            const [announcementsRes, pollsRes] = await Promise.all([
                api.get('/community/announcements'),
                api.get('/community/polls')
            ]);
            
            setAnnouncements(announcementsRes.data || []);
            setPolls(pollsRes.data || []);
            setError('');
        } catch (err) {
            console.error('Error fetching community notices:', err);
            setError('Failed to load notices and polls. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handling the poll submission
    const handleVote = async (pollId, optionId) => {
        try {
            setVotingOn(pollId);
            await api.post('/community/polls/vote', {
                pollId,
                optionId
            });
            const pollsRes = await api.get('/community/polls');
            setPolls(pollsRes.data || []);
        } catch (err) {
            console.error('Error casting vote:', err);
            alert(err.response?.data?.message || 'Failed to cast vote.');
        } finally {
            setVotingOn(null);
        }
    };

    if (isLoading) {
        return <div style={{ padding: '20px', color: '#666' }}>Loading community notices...</div>;
    }

    return (
        <div style={pageStyle}>
            <header style={headerStyle}>
                <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>Society Notices</h2>
                <p style={{ margin: 0, color: '#666' }}>
                    Stay up to date with announcements and participate in community polls.
                </p>
            </header>

            {error && <div style={errorBannerStyle}>{error}</div>}

            <div style={contentLayout}>
                {/* Displaying the announcements */}
                <div style={sectionStyle}>
                    <h3 style={sectionTitleStyle}>Announcements</h3>
                    {announcements.length === 0 ? (
                        <div style={emptyStateStyle}>No active announcements.</div>
                    ) : (
                        <div style={listStyle}>
                            {announcements.map(notice => (
                                <div key={notice.id} style={cardStyle}>
                                    <div style={cardHeaderStyle}>
                                        <h4 style={{ margin: 0, fontSize: '18px', color: '#2c3e50' }}>{notice.title}</h4>
                                        <span style={dateBadgeStyle}>
                                            {new Date(notice.created_at).toLocaleDateString(undefined, {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <p style={{ margin: '15px 0 0 0', color: '#555', lineHeight: '1.5' }}>
                                        {notice.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Displaying the community polls */}
                <div style={sectionStyle}>
                    <h3 style={sectionTitleStyle}>Community Polls</h3>
                    {polls.length === 0 ? (
                        <div style={emptyStateStyle}>No active polls.</div>
                    ) : (
                        <div style={listStyle}>
                            {polls.map(poll => (
                                <div key={poll.id} style={cardStyle}>
                                    <h4 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#2c3e50' }}>
                                        {poll.question}
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {poll.options?.map(option => {
                                            const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.vote_count || 0), 0);
                                            const percent = totalVotes === 0 ? 0 : Math.round(((option.vote_count || 0) / totalVotes) * 100);
                                            
                                            return (
                                                <div key={option.id} style={pollOptionContainerStyle}>
                                                   <button
                                                        onClick={() => handleVote(poll.id, option.id)}
                                                        disabled={
                                                            votingOn === poll.id ||
                                                            poll.options.some(opt => opt.voted)
                                                        }
                                                        style={{
                                                            ...pollButtonStyle,
                                                            backgroundColor: option.voted ? '#d4edda' : '#f5f6fa',
                                                            border: option.voted
                                                                ? '2px solid #28a745'
                                                                : '1px solid #dcdde1',
                                                            cursor:
                                                                votingOn === poll.id || poll.options.some(opt => opt.voted)
                                                                    ? 'not-allowed'
                                                                    : 'pointer'
                                                        }}
                                                    >
                                                        <span>
                                                            {option.voted ? '✓ ' : ''}
                                                            {option.option_text}
                                                        </span>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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

const contentLayout = {
  display: 'flex',
  gap: '20px',
  flexDirection: 'column',
};

const sectionStyle = {
  flex: 1,
};

const sectionTitleStyle = {
  margin: '0 0 15px 0',
  color: '#444',
  borderBottom: '2px solid #eee',
  paddingBottom: '10px',
};

const listStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
};

const cardStyle = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #eaeaea',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
};
const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

const dateBadgeStyle = {
  backgroundColor: '#f1f2f6',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  color: '#555',
};

const emptyStateStyle = {
  backgroundColor: '#fafafa',
  padding: '20px',
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

const pollOptionContainerStyle = {
  position: 'relative',
  width: '100%',
};

const pollButtonStyle = {
  width: '100%',
  padding: '12px 15px',
  border: '1px solid #dcdde1',
  borderRadius: '6px',
  textAlign: 'left',
  fontSize: '15px',
  color: '#2f3640',
  position: 'relative',
  overflow: 'hidden',
  transition: 'border-color 0.2s',
};

export default ResidentNotices;