import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const About = () => {
    return (
        <Container fluid>
            <Row className="justify-content-center mt-5">
                <Col md={8}>
                    <h1>About RSTV</h1>
                    <p>
                        Real Time Stock Visualizatiom is your one-stop solution for real-time stock prices, performance comparisons, and predictions.
                    </p>
                    <p>
                        Our platform leverages advanced algorithms and real-time data to help you make informed investment decisions.
                    </p>
                    <p>
                        Whether you are a beginner or an experienced investor, RSTV provides you with the tools you need to succeed.
                    </p>
<p>
                        Developed by Husain Ratlamwala, Hatim Bahrainwala and Imanshu Kumar Singh.
                    </p>
                </Col>
            </Row>
        </Container>
    );
};

export default About;
