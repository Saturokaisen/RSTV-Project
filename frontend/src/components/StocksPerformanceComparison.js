import React, { useState } from 'react';
import { Button, Form, FormControl, Spinner, Alert } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

// Register chart.js components
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const StocksPerformanceComparison = () => {
    const [tickers, setTickers] = useState('');
    const [start, setStart] = useState('2022-01-01');
    const [end] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Function to generate random color for each line
    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    // Function to prepare chart data
    const getChartData = () => {
        if (!data) return {};

        const labels = Object.keys(data[Object.keys(data)[0]]);  // Extract dates from the first ticker
        const datasets = Object.keys(data).map((ticker) => {
            return {
                label: ticker,
                data: Object.values(data[ticker]),  // Get the performance values for this ticker
                borderColor: getRandomColor(),
                fill: false,
            };
        });

        return { labels, datasets };
    };

    // Function to handle stock comparison
    const handleCompare = async () => {
        setError(null);
        if (!tickers.trim() || !/^[A-Z,]+$/.test(tickers.trim())) {
            setError('Please enter valid tickers separated by commas.');
            return;
        }
        if (new Date(start) > new Date(end)) {
            setError('Start date must be before end date.');
            return;
        }
        setData(null);
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/compare', { tickers: tickers.split(','), start, end });
            // Response will be an object with ticker names as keys and date-to-performance data as values
            setData(response.data);
        } catch {
            setError('Unable to fetch data.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Stocks Performance Comparison</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group controlId="tickers">
                <Form.Label>Enter tickers separated by comma</Form.Label>
                <FormControl 
                    value={tickers}
                    onChange={(e) => setTickers(e.target.value.toUpperCase())}
                    placeholder="e.g. AAPL,GOOGL,AMZN"
                />
            </Form.Group>
            <Form.Group controlId="startDate">
                <Form.Label>Start Date</Form.Label>
                <FormControl 
                    type="date" 
                    value={start} 
                    onChange={(e) => setStart(e.target.value)} 
                />
            </Form.Group>
            <Button variant="primary" onClick={handleCompare} disabled={loading}>Compare</Button>
            {loading && <Spinner animation="border" variant="primary" />}
            {data && (
                <div style={{ width: '100%', height: '400px' }}>
                    <Line data={getChartData()} options={{ responsive: true, plugins: { title: { display: true, text: 'Stock Performance Comparison' } } }} />
                </div>
            )}
        </div>
    );
};

export default StocksPerformanceComparison;
