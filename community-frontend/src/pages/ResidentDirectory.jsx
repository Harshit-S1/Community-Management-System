import { useState, useEffect } from 'react';
import api from '../services/api';

const ResidentDirectory = () => {
    const [residents, setResidents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    useEffect(() => {
        fetchDirectory();
    }, []);

    // Loading the resident directory
    const fetchDirectory = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api.get('/users/directory');
            setResidents(response.data);
        }
        catch (err) {
            console.error("Failed to fetch directory:", err);
            setError('Failed to load the resident directory. Please try again later.');
        }
        finally {
            setIsLoading(false);
        }
    };

    const filteredResidents = residents.filter(resident => {
        const nameMatch = resident.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const flatMatch = resident.flat_number?.toLowerCase().includes(searchTerm.toLowerCase());
        return nameMatch || flatMatch;
    });

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '2px solid #eee',
                    paddingBottom: '10px',
                    marginBottom: '20px',
                }}
            >
                <h1 style={{ margin: 0, color: '#2c3e50' }}>Society Directory</h1>
                <input 
                    type="text" 
                    placeholder="Search for members..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '250px' }}
                />
            </div>
            
            {error && (
                <div
                    style={{
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '20px',
                    }}
                >
                    {error}
                </div>
            )}

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                    Loading directory...
                </div>
            ) : filteredResidents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                    No residents found.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {filteredResidents.map(resident => (
                        <div
                            key={resident.id}
                            style={{
                                backgroundColor: '#fff',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                padding: '20px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                <div style={{ 
                                    width: '50px', 
                                    height: '50px', 
                                    backgroundColor: '#3498db', 
                                    color: 'white', 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold'
                                }}>
                                    {resident.name ? resident.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>
                                        {resident.name}
                                    </h3>

                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <span
                                            style={{
                                                backgroundColor: '#e8f4f8',
                                                color: '#2980b9',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {resident.role.charAt(0).toUpperCase() + resident.role.slice(1)}
                                        </span>

                                        <span
                                            style={{
                                                backgroundColor: '#f5f5f5',
                                                color: '#555',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            Flat: {
                                                resident.flat_number
                                                    ? `${resident.building_name} - ${resident.flat_number}`
                                                    : 'N/A'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ color: '#7f8c8d', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div>
                                    <strong>Email:</strong> {resident.email || 'Private'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ResidentDirectory;