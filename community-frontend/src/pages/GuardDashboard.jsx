import { useState, useEffect } from 'react';
import api from '../services/api';

const GuardDashboard = () => {
    const [activeVisitors, setActiveVisitors] = useState([]);
    const [flats, setFlats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Managing the visitor entry form
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        flatNumber: '',
        reason: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Loading the initial dashboard data
    useEffect(() => {
        fetchActiveVisitors();
        fetchFlats();
    }, []);

    const fetchActiveVisitors = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/visitors/active');
            setActiveVisitors(response.data);
            setError('');
        } 
        catch (err) {
            console.error("Failed to fetch visitors:", err);
            setError('Failed to load active visitors. Please try again.');
        } 
        finally {
            setIsLoading(false);
        }
    };

    const fetchFlats = async () => {
        try {
            const response = await api.get('/flats');
            setFlats(response.data);
        } 
        catch (err) {
            console.error('Failed to fetch flats:', err);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleLogEntry = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await api.post('/visitors/entry',{
                flatId: parseInt(formData.flatNumber),
                visitorName: formData.name,
                phone: formData.phone,
                purpose: formData.reason
            });
            setFormData({ name: '', phone: '', flatNumber: '', reason: '' });
            fetchActiveVisitors();
        } 
        catch (err) {
            console.error("Failed to log entry:", err);
            setError(err.response?.data?.message || 'Failed to log visitor entry.');
        } 
        finally {
            setIsSubmitting(false);
        }
    };

    const handleLogExit = async (visitorId) => {
        try {
            await api.put(`/visitors/exit/${visitorId}`);
            setActiveVisitors(activeVisitors.filter(v => v.id !== visitorId));
        } 
        catch (err) {
            console.error("Failed to log exit:", err);
            setError('Failed to log visitor exit. Please try again.');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1>Guard Dashboard</h1>
            {error && (
                <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
                    {error}
                </div>
            )}
            <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                {/* Displaying the visitor entry form */}
                <div style={{ flex: '1', minWidth: '300px', backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
                    <h2>Log Visitor Entry</h2>
                    <form onSubmit={handleLogEntry} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Visitor Name *</label>
                            <input 
                                type="text" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleInputChange} 
                                required 
                                style={{ width: '100%', padding: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Phone Number *</label>
                            <input 
                                type="tel" 
                                name="phone" 
                                value={formData.phone} 
                                onChange={handleInputChange} 
                                required 
                                style={{ width: '100%', padding: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                Flat Number *
                            </label>

                            <select
                                name="flatNumber"
                                value={formData.flatNumber}
                                onChange={handleInputChange}
                                required
                                style={{ width: '100%', padding: '8px' }}
                            >
                                <option value="">Select Flat</option>

                                {flats.map(flat => (
                                    <option key={flat.id} value={flat.id}>
                                        {flat.building_name} - {flat.flat_number}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Reason for Visit</label>
                            <input 
                                type="text" 
                                name="reason" 
                                value={formData.reason} 
                                onChange={handleInputChange} 
                                style={{ width: '100%', padding: '8px' }}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            style={{ 
                                padding: '10px', 
                                backgroundColor: isSubmitting ? '#9e9e9e' : '#4caf50', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px', 
                                cursor: isSubmitting ? 'not-allowed' : 'pointer' 
                            }}
                        >
                            {isSubmitting ? 'Logging...' : 'Log Entry'}
                        </button>
                    </form>
                </div>

                {/* Displaying the active visitors */}
                <div style={{ flex: '2', minWidth: '400px' }}>
                    <h2>Active Visitors</h2>
                    {isLoading ? (
                        <p>Loading active visitors...</p>
                    ) : activeVisitors.length === 0 ? (
                        <p>No active visitors at the moment.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#eeeeee' }}>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Name</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Phone</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Flat</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Entry Time</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeVisitors.map((visitor) => (
                                    <tr key={visitor.id}>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{visitor.visitor_name}</td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{visitor.phone}</td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{visitor.building_name} - {visitor.flat_number}</td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                                            {new Date(visitor.time_in).toLocaleTimeString()}
                                        </td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                                            <button 
                                                onClick={() => handleLogExit(visitor.id)}
                                                style={{ 
                                                    padding: '6px 12px', 
                                                    backgroundColor: '#f44336', 
                                                    color: 'white', 
                                                    border: 'none', 
                                                    borderRadius: '4px', 
                                                    cursor: 'pointer' 
                                                }}
                                            >
                                                Mark Exit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuardDashboard;