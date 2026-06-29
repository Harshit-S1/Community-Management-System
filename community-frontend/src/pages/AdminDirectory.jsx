import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminDirectory = () => {
    const { user: currentUser, logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [flats, setFlats] = useState([]);
    const [activeTab, setActiveTab] = useState('users'); 
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isFlatModalOpen, setIsFlatModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'resident', flatId: '' });
    const [flatForm, setFlatForm] = useState({ building_name: '', flat_number: '' });

    useEffect(() => {
        fetchAllData();
    }, []);

    // Loading the directory data
    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            const [usersRes, flatsRes] = await Promise.all([
                api.get('/users'),
                api.get('/flats')
            ]);
            setUsers(usersRes.data);
            setFlats(flatsRes.data);
        } 
        catch (err) {
            console.error('Error fetching directory data:', err);
            showMessage('error', 'Failed to load directory data.');
        } 
        finally {
            setIsLoading(false);
        }
    };

    // Displaying status messages
    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    // User Management
    // Opening the user form
    const openUserModal = (user = null) => {
        if (user) {
            setEditingUserId(user.id);
            setUserForm({ name: user.name, email: user.email, password: '', role: user.role, flatId: user.flat_id || '' });
        } 
        else {
            setEditingUserId(null);
            setUserForm({ name: '', email: '', password: '', role: 'resident', flatId: '' });
        }
        setIsUserModalOpen(true);
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUserId) {
                // Update existing user (Do not send password if blank)
                const payload = { ...userForm };
                if (!payload.password) delete payload.password;
                
                await api.put(`/users/${editingUserId}`, payload);
                showMessage('success', 'User updated successfully.');
            }
            else {
                // Register new user using the new Admin-only endpoint
                await api.post('/users', userForm);
                showMessage('success', 'User created successfully.');
            }
            setIsUserModalOpen(false);
            fetchAllData();
        } 
        catch (err) {
            showMessage('error', err.response?.data?.message || 'Failed to save user.');
        }
    };

    const handleDeleteUser = async (id) => {
        const isSelfDeletion = id === currentUser.id;
        const confirmMessage = isSelfDeletion 
            ? 'CRITICAL WARNING: You are about to delete your own Admin account. If you continue, you will be logged out immediately. This action cannot be undone. Are you absolutely sure?' 
            : 'Are you sure you want to delete this user? This action cannot be undone.';
        if (!window.confirm(confirmMessage)) return;
        try {
            await api.delete(`/users/${id}`);
            if (isSelfDeletion) {
                logout();
                return; 
            }
            showMessage('success', 'User deleted successfully.');
            fetchAllData();
        } 
        catch (err) {
            showMessage('error', err.response?.data?.message || 'Failed to delete user.');
        }
    };

    // Flat Management
    // Opening the flat form
    const openFlatModal = () => {
        setFlatForm({ building_name: '', flat_number: '' });
        setIsFlatModalOpen(true);
    };

    const handleFlatSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/flats', flatForm);
            showMessage('success', 'Flat added successfully.');
            setIsFlatModalOpen(false);
            fetchAllData();
        } 
        catch (err) {
            showMessage('error', err.response?.data?.message || 'Failed to add flat.');
        }
    };

    const handleDeleteFlat = async (id, flatNumber) => {
        // Occupancy Check
        const isOccupied = users.some(u => u.flat_number === flatNumber);
        if (isOccupied) {
            showMessage('error', `Cannot delete Flat ${flatNumber}. It is currently occupied.`);
            return;
        }
        if (!window.confirm(`Are you sure you want to delete Flat ${flatNumber}?`)) return;
        try {
            await api.delete(`/flats/${id}`);
            showMessage('success', 'Flat deleted successfully.');
            fetchAllData();
        } 
        catch (err) {
            showMessage('error', err.response?.data?.message || 'Failed to delete flat.');
        }
    };

    // Render Helpers
    if (isLoading && users.length === 0) return <div style={{ padding: '20px' }}>Loading directory...</div>;
    return (
        <div className="admin-directory-container" style={{ padding: '20px' }}>
            <h2>Society Directory</h2>
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

            {/* Displaying the directory management options */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button 
                    onClick={() => setActiveTab('users')}
                    style={activeTab === 'users' ? activeTabStyle : inactiveTabStyle}
                >
                    Manage Users
                </button>
                <button 
                    onClick={() => setActiveTab('flats')}
                    style={activeTab === 'flats' ? activeTabStyle : inactiveTabStyle}
                >
                    Manage Flats
                </button>
            </div>

            {/* Displaying the user management section */}
            {activeTab === 'users' && (
                <div>
                    <button onClick={() => openUserModal()} style={primaryButtonStyle}>+ Add New User</button>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>Email</th>
                                <th style={thStyle}>Role</th>
                                <th style={thStyle}>Flat</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={tdStyle}>{u.name} {u.id === currentUser.id && '(You)'}</td>
                                    <td style={tdStyle}>{u.email}</td>
                                    <td style={tdStyle}>{u.role}</td>
                                    <td style={tdStyle}>
                                        {u.flat_number
                                            ? `${u.building_name} - ${u.flat_number}`
                                            : 'None'}
                                    </td>
                                    <td style={tdStyle}>
                                        <button onClick={() => openUserModal(u)} style={editButtonStyle}>Edit</button>
                                        <button onClick={() => handleDeleteUser(u.id)} style={deleteButtonStyle}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Displaying the flat management section */}
            {activeTab === 'flats' && (
                <div>
                    <button onClick={openFlatModal} style={primaryButtonStyle}>+ Add New Flat</button>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                <th style={thStyle}>ID</th>
                                <th style={thStyle}>Building Name</th>
                                <th style={thStyle}>Flat Number</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {flats.map(f => (
                                <tr key={f.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={tdStyle}>{f.id}</td>
                                    <td style={tdStyle}>{f.building_name || 'N/A'}</td>
                                    <td style={tdStyle}>{f.flat_number}</td>
                                    <td style={tdStyle}>
                                        <button onClick={() => handleDeleteFlat(f.id, f.flat_number)} style={deleteButtonStyle}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Displaying the user form */}
            {isUserModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        <h3>{editingUserId ? 'Edit User' : 'Register New User'}</h3>
                        <form onSubmit={handleUserSubmit}>
                            <div style={formGroupStyle}>
                                <label>Name</label>
                                <input required type="text" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                            </div>
                            <div style={formGroupStyle}>
                                <label>Email</label>
                                <input required type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                            </div>
                            <div style={formGroupStyle}>
                                <label>Password {editingUserId && '(Leave blank to keep current)'}</label>
                                <input required={!editingUserId} type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                            </div>
                            <div style={formGroupStyle}>
                                <label>Role</label>
                                <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                                    <option value="resident">Resident</option>
                                    <option value="guard">Guard</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            {userForm.role === 'resident' && (
                                <div style={formGroupStyle}>
                                    <label>Assign Flat</label>
                                    <select value={userForm.flatId} onChange={e => setUserForm({...userForm, flatId: e.target.value})}>
                                        <option value="">-- Select a Flat --</option>
                                        {flats.map(f => (
                                            <option key={f.id} value={f.id}>{f.building_name ? `${f.building_name} - ` : ''}{f.flat_number}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                <button type="submit" style={primaryButtonStyle}>Save</button>
                                <button
                                    type="button"
                                    onClick={() => setIsUserModalOpen(false)}
                                    style={{
                                        ...primaryButtonStyle,
                                        backgroundColor: '#f5f5f5',
                                        color: '#333'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Displaying the flat form */}
            {isFlatModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        <h3>Add New Flat</h3>
                        <form onSubmit={handleFlatSubmit}>
                            <div style={formGroupStyle}>
                                <label>Building Name (Optional)</label>
                                <input type="text" value={flatForm.building_name} onChange={e => setFlatForm({...flatForm, building_name: e.target.value})} />
                            </div>
                            <div style={formGroupStyle}>
                                <label>Flat Number</label>
                                <input required type="text" value={flatForm.flat_number} onChange={e => setFlatForm({...flatForm, flat_number: e.target.value})} />
                            </div>
                            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                <button type="submit" style={primaryButtonStyle}>Save</button>
                                <button
                                    type="button"
                                    onClick={() => setIsFlatModalOpen(false)}
                                    style={{
                                        ...primaryButtonStyle,
                                        backgroundColor: '#f5f5f5',
                                        color: '#333'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
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
  padding: '8px 16px',
  backgroundColor: '#2ecc71',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  marginBottom: '15px',
};

const editButtonStyle = {
  padding: '4px 8px',
  backgroundColor: '#f39c12',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  marginRight: '5px',
};

const deleteButtonStyle = {
  padding: '4px 8px',
  backgroundColor: '#e74c3c',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  backgroundColor: 'white',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};
const thStyle = {
  padding: '12px',
  textAlign: 'left',
  borderBottom: '2px solid #ddd',
};

const tdStyle = {
  padding: '12px',
  textAlign: 'left',
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const modalStyle = {
  backgroundColor: 'white',
  padding: '25px',
  borderRadius: '8px',
  width: '400px',
  maxWidth: '90%',
};

const formGroupStyle = {
  marginBottom: '15px',
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
};

export default AdminDirectory;