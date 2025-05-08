import React, { useState } from 'react';
import { Form, FormControl, Button, Spinner, Alert, Dropdown } from 'react-bootstrap';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const StockPrediction = () => {
    const [ticker, setTicker] = useState('');
    const [period, setPeriod] = useState(30);
    const [modelType, setModelType] = useState('prophet');  // Default model is 'prophet'
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handlePredict = async () => {
        setError(null);
        if (!ticker.trim() || !/^[A-Z]+$/.test(ticker.trim())) {
            setError('Please enter a valid ticker.');
            return;
        }
        if (period <= 0) {
            setError('Prediction period must be greater than zero.');
            return;
        }
        setData(null);
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/predict', { ticker, period, model_type: modelType });
            setData(response.data);
        } catch (error) {
            setError('Unable to fetch data.');
        } finally {
            setLoading(false);
        }
    };

    const getChartData = () => {
        if (!data) return {};

        // For historical data, ensuring we have valid dates and values
        const historicalLabels = data.historical_data
            .map(item => {
                const date = new Date(item.ds); 
                return isNaN(date) ? null : date.toLocaleDateString();
            })
            .filter(item => item !== null); 

        const historicalPrices = data.historical_data
            .map(item => item.Close)
            .filter(item => item !== null);

        // For predicted data, ensuring valid dates and values
        const predictionLabels = data.predictions
            .map(item => {
                const date = new Date(item.ds); 
                return isNaN(date) ? null : date.toLocaleDateString();
            })
            .filter(item => item !== null);

        const predictedPrices = data.predictions
            .map(item => item.yhat)
            .filter(item => item !== null);

        // Combine historical and predicted prices for the chart
        const datasets = [
            {
                label: 'Historical Price',
                data: historicalPrices,
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false,
            },
            {
                label: 'Predicted Price',
                data: predictedPrices,
                borderColor: 'rgba(255, 159, 64, 1)',
                fill: false,
            },
        ];

        return {
            labels: [...historicalLabels, ...predictionLabels], 
            datasets,
        };
    };

    return (
        <div>
            <h2>Stock Prediction</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group controlId="tickerPredict">
                <Form.Label>Enter Stock Ticker</Form.Label>
                <FormControl 
                    value={ticker} 
                    onChange={(e) => setTicker(e.target.value.toUpperCase())} 
                />
            </Form.Group>
            <Form.Group controlId="predictionPeriod">
                <Form.Label>Enter Prediction Period (days)</Form.Label>
                <FormControl 
                    type="number" 
                    value={period} 
                    onChange={(e) => setPeriod(Number(e.target.value))} 
                />
            </Form.Group>
            <Form.Group controlId="modelSelect">
                <Form.Label>Select Model</Form.Label>
                <Dropdown>
                    <Dropdown.Toggle variant="success" id="dropdown-basic">
                        {modelType === 'prophet' ? 'Prophet Model' : 'LSTM Model'}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => setModelType('prophet')}>Prophet Model</Dropdown.Item>
                        <Dropdown.Item onClick={() => setModelType('lstm')}>LSTM Model</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </Form.Group>
            <Button variant="primary" onClick={handlePredict} disabled={loading}>
                Predict
            </Button>
            {loading && <Spinner animation="border" variant="primary" />}
            {data && (
                <div style={{ width: '100%', height: '400px' }}>
                    <Line data={getChartData()} options={{ responsive: true }} />
                </div>
            )}
        </div>
    );
};

export default StockPrediction;
