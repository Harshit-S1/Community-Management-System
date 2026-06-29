import React, { useState, useEffect } from 'react';
import api from '../services/api';

// Managing financial reports and payment settings
const AdminFinances = () => {
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [paymentSettings, setPaymentSettings] = useState({
        razorpay_key_id: '',
        razorpay_key_secret: ''
    });
    const [paymentConfigured, setPaymentConfigured] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [amount, setAmount] = useState('');
    const [month, setMonth] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [monthlyDues, setMonthlyDues] = useState([]);
    const [isLoadingDues, setIsLoadingDues] = useState(false);

    // Fetching report and payment settings
    useEffect(() => {
        fetchReport();
        fetchPaymentSettings();
    }, []);

    // Fetching finance summary
    const fetchReport = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/finance/report');
            setReport(response.data);
            setError('');
        } 
        catch (err) {
            console.error('Error fetching financial report:', err);
            setError(
                err.response?.data?.error ||
                'Failed to load financial records. Please try again.'
            );
        } 
        finally {
            setIsLoading(false);
        }
    };

    const fetchMonthlyDues = async () => {
        if (!selectedMonth) return;
        try {
            setIsLoadingDues(true);
            const response = await api.get(
                `/finance/dues-status?month=${selectedMonth}`
            );
            setMonthlyDues(response.data);
        } 
        catch (err) {
            console.error(err);
            setError(
                err.response?.data?.error ||
                'Failed to load monthly dues.'
            );
        } 
        finally {
            setIsLoadingDues(false);
        }
    };
    const fetchPaymentSettings = async () => {
        try {
            const res = await api.get('/finance/payment-settings');
            setPaymentSettings({
                razorpay_key_id: res.data.razorpay_key_id,
                razorpay_key_secret: ''
            });
            setPaymentConfigured(res.data.configured);
        } 
        catch (err) {
            console.error('Error loading payment settings:', err);
        }
    };

    // Saving Razorpay settings
    const savePaymentSettings = async () => {
        try {
            setSavingSettings(true);
            await api.put('/finance/payment-settings', paymentSettings);
            setPaymentConfigured(true);
            setPaymentSettings(prev => ({
                ...prev,
                razorpay_key_secret: ''
            }));
            alert('Payment settings updated successfully.');
        } 
        catch (err) {
            console.error('Error saving payment settings:', err);
            alert(
                err.response?.data?.error ||
                'Failed to save payment settings.'
            );
        } 
        finally {
            setSavingSettings(false);
        }
    };

    // Generating monthly dues
    const handleGenerateDues = async (e) => {
        e.preventDefault();
        setIsGenerating(true);
        setError('');
        setSuccessMsg('');
        try {
            await api.post('/finance/generate', {
                month,
                amount: Number(amount)
            });
            setSuccessMsg('Monthly dues generated successfully for all flats!');
            setAmount('');
            setMonth('');
            // Refresh the report to show updated pending flats
            fetchReport();
        } 
        catch (err) {
            console.error('Error generating dues:', err);
            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Failed to generate dues.'
            );
        } 
        finally {
            setIsGenerating(false);
        }
    };

    if (isLoading) {
        return <div style={{ padding: '20px', color: '#666' }}>Loading financial records...</div>;
    }

    return (
        <div style={pageStyle}>
            <header style={headerStyle}>
                <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>Society Finances</h2>
                <p style={{ margin: 0, color: '#666' }}>
                    Manage monthly dues and view revenue collection for your society.
                </p>
            </header>

            {/* Displaying status messages */}
            {error && <div style={errorBannerStyle}>{error}</div>}
            {successMsg && <div style={successBannerStyle}>{successMsg}</div>}

            {/* Displaying financial overview */}
            {report && (
                <div style={statsGridStyle}>
                    <div style={cardStyle}>
                        <h3 style={cardHeaderStyle}>Total Revenue Collected</h3>
                        <div style={{ ...numberStyle, color: '#2ecc71' }}>
                            ₹{report.revenueCollected || 0}
                        </div>
                    </div>
                    <div style={cardStyle}>
                        <h3 style={cardHeaderStyle}>Paid Flats</h3>
                        <div style={numberStyle}>{report.paidFlatsCount || 0}</div>
                    </div>
                    <div style={cardStyle}>
                        <h3 style={cardHeaderStyle}>Pending Flats</h3>
                        <div style={{ ...numberStyle, color: '#e74c3c' }}>
                            {report.pendingFlatsCount || 0}
                        </div>
                    </div>
                </div>
            )}

            {/* Generating monthly dues */}
            <div style={formCardStyle}>
                <h3 style={{ marginTop: 0, color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    Generate Monthly Dues
                </h3>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                    This will generate monthly maintenance dues for every registered flat in your society for the selected month.
                </p>

                <form onSubmit={handleGenerateDues} style={formStyle}>
                    
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Amount (₹)</label>
                        <input 
                            type="number" 
                            required
                            min="1"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g., 1500"
                            style={inputStyle}
                        />
                    </div>

                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Billing Month</label>
                        <input
                            type="month"
                            required
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isGenerating || !amount || !month}
                        style={{
                            ...buttonStyle,
                            backgroundColor: (isGenerating || !amount || !month) ? '#95a5a6' : '#3498db',
                            cursor: (isGenerating || !amount || !month) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isGenerating ? 'Generating...' : 'Generate Dues for All Flats'}
                    </button>
                </form>
            </div>
            
            {/* Managing payment gateway settings */}
            <div style={formCardStyle}>
                <h3 style={{ marginTop: 0 }}>
                    Payment Gateway Settings
                </h3>

                <p
                    style={{
                        fontSize: '14px',
                        color: '#666',
                        marginBottom: '20px'
                    }}
                >
                    Configure the Razorpay account used to collect maintenance payments for this society.
                </p>

                <div style={formStyle}>

                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>
                            Razorpay Key ID
                        </label>

                        <input
                            type="text"
                            value={paymentSettings.razorpay_key_id}
                            onChange={(e) =>
                                setPaymentSettings({
                                    ...paymentSettings,
                                    razorpay_key_id: e.target.value
                                })
                            }
                            style={inputStyle}
                        />
                    </div>

                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>
                            Razorpay Key Secret
                        </label>

                        <input
                            type="password"
                            placeholder={
                                paymentConfigured
                                    ? "Leave blank to keep existing secret"
                                    : ""
                            }
                            value={paymentSettings.razorpay_key_secret}
                            onChange={(e) =>
                                setPaymentSettings({
                                    ...paymentSettings,
                                    razorpay_key_secret: e.target.value
                                })
                            }
                            style={inputStyle}
                        />
                    </div>

                    <button
                        onClick={savePaymentSettings}
                        disabled={savingSettings}
                        style={{
                            ...buttonStyle,
                            backgroundColor: savingSettings
                                ? "#95a5a6"
                                : "#3498db",
                            cursor: savingSettings
                                ? "not-allowed"
                                : "pointer"
                        }}
                    >
                        {savingSettings
                            ? "Saving..."
                            : "Save Payment Settings"}
                    </button>

                </div>
            </div>

            <div style={formCardStyle}>
                <h3 style={{ marginTop: 0 }}>
                    View Monthly Dues
                </h3>

                <div style={formStyle}>

                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>
                            Billing Month
                        </label>

                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <button
                        onClick={fetchMonthlyDues}
                        disabled={!selectedMonth}
                        style={{
                            ...buttonStyle,
                            backgroundColor: !selectedMonth ? '#95a5a6' : '#3498db',
                            cursor: !selectedMonth ? 'not-allowed' : 'pointer'
                        }}
                    >
                        View Dues
                    </button>

                </div>
            </div>
            
            {/* Displaying monthly dues */}
            {monthlyDues.length > 0 && (
                <div style={tableCardStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Flat</th>
                                <th style={thStyle}>Resident</th>
                                <th style={thStyle}>Amount</th>
                                <th style={thStyle}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyDues.map((due) => (
                                <tr key={due.id}>
                                    <td style={tdStyle}>
                                        {due.flat_number}
                                    </td>
                                    <td style={tdStyle}>
                                        {due.resident_name || '-'}
                                    </td>
                                    <td style={tdStyle}>
                                        ₹{due.amount}
                                    </td>
                                    <td style={tdStyle}>
                                        <span
                                            style={{
                                                ...statusBadgeStyle,
                                                backgroundColor:
                                                    due.status === 'paid'
                                                        ? '#eafaf1'
                                                        : '#fdecea',
                                                color:
                                                    due.status === 'paid'
                                                        ? '#27ae60'
                                                        : '#e74c3c'
                                            }}
                                        >
                                            {due.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const pageStyle = {
    width: '100%',
    flex: 1,
    boxSizing: 'border-box',
    padding: '20px',
    margin: 0,
    display: 'flex',
    flexDirection: 'column'
};

const headerStyle = {
    marginBottom: '30px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
    width: '100%'
};

const cardStyle = {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #eaeaea',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
};

const formCardStyle = {
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '8px',
    border: '1px solid #eaeaea',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    maxWidth: '600px' // Keeps the form from stretching too wide on large screens
};

const cardHeaderStyle = {
    margin: '0 0 10px 0',
    fontSize: '16px',
    color: '#555'
};

const numberStyle = {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#3498db',
    margin: 0
};

const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
};

const inputGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
};

const labelStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#444'
};

const inputStyle = {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '15px',
    outline: 'none'
};

const buttonStyle = {
    padding: '12px',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '10px'
};

const errorBannerStyle = {
    backgroundColor: '#fdecea',
    color: '#e74c3c',
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '20px',
    borderLeft: '5px solid #e74c3c'
};

const successBannerStyle = {
    backgroundColor: '#eafaf1',
    color: '#2ecc71',
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '20px',
    borderLeft: '5px solid #2ecc71'
};

const tableCardStyle = {
    backgroundColor: '#fff',
    marginTop: '30px',
    borderRadius: '8px',
    border: '1px solid #eaeaea',
    overflowX: 'auto'
};

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse'
};

const thStyle = {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #ddd',
    textAlign: 'left'
};

const tdStyle = {
    padding: '15px',
    borderBottom: '1px solid #eee'
};

const statusBadgeStyle = {
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
};

export default AdminFinances;