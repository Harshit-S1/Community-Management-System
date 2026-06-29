import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api'; 

const pageStyle = {
    minHeight: '100vh',
    backgroundColor: '#f4f6f9',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
};

const cardStyle = {
    width: '100%',
    maxWidth: '500px',
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    marginTop: '5px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    boxSizing: 'border-box'
};

const buttonStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '5px'
};

const errorStyle = {
    backgroundColor: '#fdecea',
    color: '#c0392b',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '15px'
};

const successStyle = {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '15px'
};

const Setup = () => {
    const [formData, setFormData] = useState({
        societyName: '',
        address: '', 
        adminName: '',
        adminEmail: '', 
        adminPassword: '' 
    });
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
    
    // Handling the society registration
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            await api.post('/auth/register-society', {
                societyName: formData.societyName,
                address: formData.address,
                adminName: formData.adminName,
                adminEmail: formData.adminEmail,
                adminPassword: formData.adminPassword
            });
            setSuccess('Society and Admin account created successfully! Redirecting to login...');

            // Redirecting the user to the login page
            setTimeout(() => {
                navigate('/login');
            }, 2000);
            
        } 
        catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError('Failed to register the society. Please try again later.');
            }
        } 
        finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                <h2 style={{ textAlign: 'center', color: '#2C3E50' }}>
                    Register New Society
                </h2>
                <p
                    style={{
                        textAlign: 'center',
                        color: '#666',
                        marginBottom: '25px'
                    }}
                >
                    Create a new community workspace and admin account.
                </p>
                {error && <div style={errorStyle}>{error}</div>}
                {success && <div style={successStyle}>{success}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '18px' }}>
                        <label htmlFor="societyName"style={{ fontWeight: 'bold' }}>Society / Community Name</label>
                        <input
                            type="text"
                            id="societyName"
                            name="societyName"
                            value={formData.societyName}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Sunrise Apartments"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '18px' }}>
                        <label htmlFor="address"style={{ fontWeight: 'bold' }}>Society Address</label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            required
                            placeholder="123 Main St, City, State"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '18px' }}>
                        <label htmlFor="adminName"style={{ fontWeight: 'bold' }}>Admin Full Name</label>
                        <input
                            type="text"
                            id="adminName"
                            name="adminName"
                            value={formData.adminName}
                            onChange={handleChange}
                            required
                            placeholder="John Doe"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '18px' }}>
                        <label htmlFor="adminEmail"style={{ fontWeight: 'bold' }}>Admin Email Address</label>
                        <input
                            type="email"
                            id="adminEmail"
                            name="adminEmail"
                            value={formData.adminEmail}
                            onChange={handleChange}
                            required
                            placeholder="admin@example.com"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '18px' }}>
                        <label htmlFor="adminPassword"style={{ fontWeight: 'bold' }}>Admin Password</label>
                        <input
                            type="password"
                            id="adminPassword"
                            name="adminPassword"
                            value={formData.adminPassword}
                            onChange={handleChange}
                            required
                            placeholder="Create a strong password"
                            style={inputStyle}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={buttonStyle}
                    >
                        {isLoading ? 'Registering...' : 'Register Society'}
                    </button>
                </form>
                <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
                    Already have an account? <Link to="/login">Log In Here</Link>
                </div>
            </div>
        </div>
    );
};

export default Setup;