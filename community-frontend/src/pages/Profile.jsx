import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');

    useEffect(() => {
    // Loading the profile details
    const fetchProfile = async () => {
            try {
                const response = await api.get('/users/me');
                setProfile(response.data);
                setLoading(false);
            } 
            catch (err) {
                console.error('Failed to load profile', err);
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // Handling the password update
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordMessage('');

        if (newPassword !== confirmPassword) {
            return setPasswordMessage('New passwords do not match.');
        }

        try {
           const response = await api.put('/users/me/password', {
                currentPassword,
                newPassword
            });
            
            setPasswordMessage(response.data.message); 
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPasswordMessage(err.response?.data?.message || 'Failed to change password');
        }
    };

    if (loading) return <h3>Loading profile...</h3>;
    if (!profile) return <h3 style={{ color: '#E74C3C' }}>Failed to load profile data.</h3>;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '30px', color: '#2C3E50' }}>My Profile</h2>
            
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                
                {/* Displaying the user's profile summary */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', borderBottom: '1px solid #ECF0F1', paddingBottom: '20px' }}>
                    <div style={{ 
                        width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#3498DB', 
                        color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', 
                        fontSize: '32px', fontWeight: 'bold' 
                    }}>
                        {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 5px 0', color: '#2C3E50', fontSize: '24px' }}>{profile.name}</h3>
                        <span style={{ 
                            padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                            backgroundColor: profile.role === 'admin' ? '#FADBD8' : profile.role === 'guard' ? '#FCF3CF' : '#D5F5E3',
                            color: profile.role === 'admin' ? '#C0392B' : profile.role === 'guard' ? '#F39C12' : '#27AE60'
                        }}>
                            {profile.role.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Displaying the profile details */}
                <div style={{display: 'grid',gridTemplateColumns: '1fr 1fr',gap: '20px 40px'}}>

                    <div>
                        <label style={{ display: 'block', color: '#7F8C8D', fontSize: '14px', marginBottom: '5px' }}>
                            Full Name
                        </label>
                        <p style={{ margin: 0, fontSize: '16px', color: '#2C3E50', fontWeight: '500' }}>
                            {profile.name}
                        </p>
                    </div>

                    <div>
                        <label style={{ display: 'block', color: '#7F8C8D', fontSize: '14px', marginBottom: '5px' }}>
                            Email Address
                        </label>
                        <p style={{ margin: 0, fontSize: '16px', color: '#2C3E50', fontWeight: '500' }}>
                            {profile.email}
                        </p>
                    </div>

                    <div>
                        <label style={{ display: 'block', color: '#7F8C8D', fontSize: '14px', marginBottom: '5px' }}>
                            Role
                        </label>
                        <p style={{ margin: 0, fontSize: '16px', color: '#2C3E50', fontWeight: '500', textTransform: 'capitalize' }}>
                            {profile.role}
                        </p>
                    </div>

                    <div>
                        <label style={{ display: 'block', color: '#7F8C8D', fontSize: '14px', marginBottom: '5px' }}>
                            Society
                        </label>
                        <p style={{ margin: 0, fontSize: '16px', color: '#2C3E50', fontWeight: '500' }}>
                            {profile.society_name}
                        </p>
                    </div>

                    {profile.flat_number && (
                        <div>
                            <label style={{ display: 'block', color: '#7F8C8D', fontSize: '14px', marginBottom: '5px' }}>
                                Flat Number
                            </label>
                            <p style={{ margin: 0, fontSize: '16px', color: '#2C3E50', fontWeight: '500' }}>
                                {profile.flat_number
                                ? `${profile.building_name} - ${profile.flat_number}`
                                : 'N/A'}
                            </p>
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', color: '#7F8C8D', fontSize: '14px', marginBottom: '5px' }}>
                            Member Since
                        </label>
                        <p style={{ margin: 0, fontSize: '16px', color: '#2C3E50', fontWeight: '500' }}>
                            {new Date(profile.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                </div>
            </div>

            {/* Displaying the password update form */}
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '15px', color: '#34495E' }}>Change Password</h3>
                
                {passwordMessage && (
                    <p style={{ color: passwordMessage.includes('successfully') ? '#27AE60' : '#E74C3C', marginBottom: '15px', fontWeight: 'bold' }}>
                        {passwordMessage}
                    </p>
                )}
                
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#7F8C8D' }}>Current Password</label>
                        <input 
                            type="password" 
                            value={currentPassword} 
                            onChange={(e) => setCurrentPassword(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '10px', border: '1px solid #BDC3C7', borderRadius: '4px', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#7F8C8D' }}>New Password</label>
                        <input 
                            type="password" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '10px', border: '1px solid #BDC3C7', borderRadius: '4px', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#7F8C8D' }}>Confirm New Password</label>
                        <input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '10px', border: '1px solid #BDC3C7', borderRadius: '4px', boxSizing: 'border-box' }}
                        />
                    </div>
                    <button type="submit" style={{ padding: '12px', backgroundColor: '#34495E', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                        Update Password
                    </button>
                </form>
            </div>

        </div>
    );
};

export default Profile;