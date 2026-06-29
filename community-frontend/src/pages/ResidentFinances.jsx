import React, { useState, useEffect } from 'react';
import api from '../services/api';

// Loading the Razorpay SDK
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const ResidentFinances = () => {
    const [dues, setDues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchDues();
    }, []);

    // Loading the financial records
    const fetchDues = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/finance/my-dues');
            setDues(response.data || []);
            setError('');
        } catch (err) {
            console.error('Error fetching finances:', err);
            setError('Failed to load financial records. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handling the payment process
    const handlePayment = async (dueId) => {
        try {
            setProcessingId(dueId);
            setError('');
            setSuccessMsg('');
            const res = await loadRazorpayScript();
            if (!res) {
                setError('Razorpay SDK failed to load. Are you online?');
                setProcessingId(null);
                return;
            }
            const orderResponse = await api.post(`/finance/pay/order/${dueId}`);
            const { order } = orderResponse.data;
            const options = {
                key: orderResponse.data.key, 
                amount: order.amount,
                currency: order.currency,
                modal: {
                    ondismiss: function () {
                        setProcessingId(null);
                    }
                },
                name: "Community CMS",
                description: "Monthly Maintenance Dues",
                order_id: order.id,
                handler: async function (response) {
                    try {
                        await api.post('/finance/pay/verify', {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            dueId: dueId
                        });
                        
                        setSuccessMsg('Payment processed successfully!');
                        setProcessingId(null);
                        fetchDues(); // Refresh the list to show "Paid"
                    } 
                    catch (verifyErr) {
                        setProcessingId(null);
                        setError('Payment verification failed.');
                    }
                },
                theme: { color: "#3498db" }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
        } catch (err) {
            console.error('Error initiating payment:', err);
            setProcessingId(null);
            setError(
                err.response?.data?.message ||
                "Failed to initiate payment."
            );
        } 
    };
    if (isLoading) {
        return <div style={{ padding: '20px', color: '#666' }}>Loading financial records...</div>;
    }
    return (
        <div style={pageStyle}>
            {/* Displaying the financial summary */}
            <header style={headerStyle}>
                <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>My Finances</h2>
                <p style={{ margin: 0, color: '#666' }}>
                    View your monthly maintenance dues and payment history.
                </p>
            </header>

            {error && <div style={errorBannerStyle}>{error}</div>}
            {successMsg && <div style={successBannerStyle}>{successMsg}</div>}

            {/* Displaying the dues table */}
            {!error && dues.length === 0 ? (
                <div style={emptyStateStyle}>
                    You have no financial records at this time.
                </div>
            ) : (
                <div style={tableContainerStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={tableHeaderRowStyle}>
                                <th style={thStyle}>Amount</th>
                                <th style={thStyle}>Billing Month</th>
                                <th style={thStyle}>Status</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dues.map((due) => (
                                <tr key={due.id} style={tableRowStyle}>

                                    <td style={tdStyle}>₹{due.amount}</td>
                                    <td style={tdStyle}>
                                        {new Date(`${due.month}-01`).toLocaleDateString(undefined, {
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            ...statusBadgeStyle,
                                            backgroundColor: due.status === 'paid' ? '#eafaf1' : '#fdecea',
                                            color: due.status === 'paid' ? '#27ae60' : '#e74c3c'
                                        }}>
                                            {due.status === 'paid' ? 'Paid' : 'Pending'}
                                        </span>
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                                        {due.status !== 'paid' ? (
                                            <button
                                                onClick={() => handlePayment(due.id)}
                                                disabled={processingId === due.id}
                                                style={{
                                                    ...buttonStyle,
                                                    backgroundColor: processingId === due.id ? '#95a5a6' : '#3498db',
                                                    cursor: processingId === due.id ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {processingId === due.id ? 'Processing...' : 'Pay Now'}
                                            </button>
                                        ) : (
                                            <span style={{ color: '#7f8c8d', fontSize: '13px', fontStyle: 'italic' }}>
                                                Settled
                                            </span>
                                        )}
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
    marginBottom: '25px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
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

const emptyStateStyle = {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '8px',
    border: '1px solid #eaeaea',
    color: '#777',
    textAlign: 'center',
    fontSize: '16px'
};

const tableContainerStyle = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #eaeaea',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    overflowX: 'auto'
};

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
};

const tableHeaderRowStyle = {
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #eaeaea'
};

const thStyle = {
    padding: '15px',
    color: '#555',
    fontWeight: '600',
    fontSize: '14px'
};

const tableRowStyle = {
    borderBottom: '1px solid #eaeaea',
    transition: 'background-color 0.2s'
};

const tdStyle = {
    padding: '15px',
    color: '#555',
    fontSize: '14px'
};

const statusBadgeStyle = {
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'inline-block'
};

const buttonStyle = {
    padding: '8px 16px',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 'bold'
};

export default ResidentFinances;