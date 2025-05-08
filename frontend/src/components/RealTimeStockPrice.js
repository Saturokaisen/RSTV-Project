import React, { useState } from 'react';
import { Button, Form, FormControl, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const RealTimeStockPrice = () => {
    const [ticker, setTicker] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRealtime = async () => {
        setError(null);
        if (!ticker.trim() || !/^[A-Z]+$/.test(ticker.trim())) {
            setError('Please enter a valid ticker.');
            return;
        }
        setData(null);
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/realtime', { ticker });
		<div>
		response
		response.data
		<Alert variant="danger">{response}</Alert>
		<Alert variant="danger">{response.data}</Alert>
		</div>
	
            setData(response.data);
        } catch {
            setError('Unable to fetch data.');
        } finally {
            setLoading(false);
        }
    };

    // Function to safely format price to two decimal places
    const formatPrice = (price) => {
        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice)) {
            return 'N/A';  // Return a default value if price is invalid
        }
        return numericPrice.toFixed(2);  // Format the number to two decimal places
    };

    return (
        <div>
            <h2>Real-Time Stock Price</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group controlId="ticker">
                <Form.Label>Enter Stock Ticker</Form.Label>
                <FormControl 
                    value={ticker} 
                    onChange={(e) => setTicker(e.target.value.toUpperCase())} 
                />
            </Form.Group>
            <Button variant="primary" onClick={handleRealtime} disabled={loading}>Get Real-Time Price</Button>
            {loading && <Spinner animation="border" variant="primary" />}         
{data && (
    <table className="table mt-3">
        <thead>
            <tr>
                <th>Time</th>
                <th>Price</th>
            </tr>
        </thead>
        <tbody>
            {data.map((item, index) => {
                return (
                    <tr key={index}>
                        <td>{item.Time}</td>
                        <td>{formatPrice(item.Close)}</td>
                    </tr>
                );
            })}
        </tbody>
    </table>
)}
        </div>
    );
};

export default RealTimeStockPrice;
