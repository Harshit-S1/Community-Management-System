import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const styles = {
    container: {
        width: '100%',
        marginTop: '20px'
    },
    card: {
        background: '#fef2f2',
        border: '2px solid #dc2626',
        borderRadius: '10px',
        padding: '16px',
        width: '100%',
        boxSizing: 'border-box'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px'
    },
    icon: {
        width: '32px',
        height: '32px',
        color: '#dc2626',
        marginRight: '12px',
        flexShrink: 0
    },
    title: {
        margin: 0,
        color: '#b91c1c',
        fontSize: '22px'
    },
    warning: {
        color: '#7f1d1d',
        lineHeight: '1.6',
        marginBottom: '18px'
    },
    error: {
        background: '#fff',
        borderLeft: '4px solid #dc2626',
        padding: '12px',
        marginBottom: '20px',
        color: '#b91c1c'
    },
    box: {
        background: '#fff',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '20px'
    },
    label: {
        display: 'block',
        marginBottom: '10px',
        fontWeight: 'bold'
    },
    deleteText: {
        color: '#dc2626',
        fontWeight: 'bold'
    },
    input: {
        width: '260px',
        maxWidth: '100%',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        marginBottom: '20px'
    },
    button: {
        padding: '12px 22px',
        border: 'none',
        borderRadius: '6px',
        color: '#fff',
        fontWeight: 'bold',
        cursor: 'pointer',
        background: '#dc2626'
    },
    disabledButton: {
        background: '#9ca3af',
        cursor: 'not-allowed'
    }
};

const DangerZone = () => {
    const {logout} = useAuth();
    const navigate = useNavigate();
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');

    // Handling the society deletion
    const handleDeleteSociety = async () => {
        if (confirmText !== 'DELETE') {
            setError('Please type DELETE to confirm.');
            return;
        }
        const confirmFinal = window.confirm("Are you absolutely sure? This cannot be undone.");
        if (!confirmFinal) return;
        setIsDeleting(true);
        try {
            await api.delete('/societies');
            logout();
            navigate('/login');
        } 
        catch (err) {
            console.error("Deletion failed:", err);
            setError(err.response?.data?.message || 'Failed to delete society.');
            setIsDeleting(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 style={styles.title}>
                        ⚠ Danger Zone
                    </h2>
                </div>
                
                <p style={styles.warning}>
                    <strong>Warning:</strong> This action permanently deletes your society,
                    including all residents, tickets, visitor logs and financial records.
                    This action cannot be undone.
                </p>
                
                {error && (
                    <div style={styles.error}>
                        {error}
                    </div>
                )}
                
                <div style={styles.box}>
                    <label style={styles.label}>
                        Type <span style={styles.deleteText}>DELETE</span> to confirm:
                    </label>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => {
                            setConfirmText(e.target.value);
                            setError('');
                        }}
                        placeholder="DELETE"
                        style={styles.input}
                    />
                    <br />
                    <button
                        onClick={handleDeleteSociety}
                        disabled={isDeleting || confirmText !== 'DELETE'}
                        style={{
                            ...styles.button,
                            ...(isDeleting || confirmText !== 'DELETE'
                                ? styles.disabledButton
                                : {})
                        }}
                    >
                        {isDeleting
                            ? 'Deleting Society...'
                            : 'Delete Society Permanently'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DangerZone;