import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const {login} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Retrieving the previously requested route
    const from = location.state?.from?.pathname || null;
    // Handling the login form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const result = await login(email, password);
            if (!result.success) {
                setError(result.error);
                return;
            }
            // Redirecting the user to the requested page
            if (from) {
                navigate(from, { replace: true });
                return;
            }
            switch (result.role) {
                case 'admin':
                    navigate('/admin/dashboard', { replace: true });
                    break;
                case 'resident':
                    navigate('/resident/feed', { replace: true });
                    break;
                case 'guard':
                    navigate('/guard/dashboard', { replace: true });
                    break;
                default:
                    setError('Invalid role detected.');
            }
        }
        catch (err) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Failed to log in. Please try again later.');
            }
        }
        finally {
            setIsLoading(false);
        }
    };

    return (
       <div style={pageStyle}>
           <div style={cardStyle}>
                <h2
                    style={{
                        textAlign: 'center',
                        color: '#2C3E50',
                        marginBottom: '8px'
                    }}
                >
                    Community Management System
                </h2>

                <p
                    style={{
                        textAlign: 'center',
                        color: '#666',
                        marginBottom: '30px'
                    }}
                >
                    Please log in to your account
                </p>

                {error && (
                    <div style={errorStyle}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '18px' }}>
                        <label
                            htmlFor="email"
                            style={{ fontWeight: 'bold' }}
                        >
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            placeholder="name@example.com"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '22px' }}>
                        <label
                            htmlFor="password"
                            style={{ fontWeight: 'bold' }}
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            placeholder="••••••••"
                            style={inputStyle}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={buttonStyle}
                    >
                        {isLoading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>
                
                <div
                    style={{
                        marginTop: '25px',
                        textAlign: 'center',
                        fontSize: '14px',
                        color: '#555'
                    }}
                >
                    <p style={{ marginBottom: '10px' }}>
                        Need to register your society?
                    </p>

                    <Link
                        to="/setup"
                        style={{
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontWeight: '600'
                        }}
                    >
                        Go to Setup
                    </Link>
                </div>
            </div>
        </div>
    );
};

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
    maxWidth: '420px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '30px',
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
    color: 'white',
    border: 'none',
    borderRadius: '5px'
};

const errorStyle = {
    backgroundColor: '#fdecea',
    color: '#c0392b',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '20px'
};

export default Login;