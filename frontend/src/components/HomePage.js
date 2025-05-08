import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <Container fluid>
            <Row className="justify-content-center mt-5">
                <Col md={8}>
                    <Card className="text-center">
                        <Card.Body>
                            <h1>Welcome to Real Time Stock Visualization</h1>
                            <p>Your one-stop solution for real-time stock prices, performance comparisons, and predictions.</p>
                            <Button variant="primary" onClick={() => navigate('/stocks-performance-comparison')}>Get Started</Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Row className="text-center mt-4">
                <Col>
                    <h2>Features</h2>
                    <p>
			<Button variant="link" onClick={() => navigate('/news')}>News</Button><br />
                        <Button variant="link" onClick={() => navigate('/stocks-performance-comparison')}>Stocks Performance Comparison</Button><br />
                        <Button variant="link" onClick={() => navigate('/real-time-stock-price')}>Real-Time Stock Price</Button><br />
                        <Button variant="link" onClick={() => navigate('/stock-prediction')}>Stock Prediction</Button><br />
                        <Button variant="link" onClick={() => navigate('/about')}>About</Button>
                    </p>
                </Col>
            </Row>
        </Container>
    );
};

export default HomePage;
