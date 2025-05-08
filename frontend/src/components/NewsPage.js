import React, { useEffect, useState } from "react";
import axios from "axios";
import './NewsPage.css';
import { Container, Row, Col } from 'react-bootstrap';

const NewsPage = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch news data from Flask API
        axios
            .get("http://localhost:5000/news")  // Adjust with the correct backend URL
            .then((response) => {
                setNews(response.data);
                setLoading(false);
            })
            .catch((error) => {
                setError("Failed to fetch news.");
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div>Loading news...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="news-container">
            <h1 className='mb-8 mt-5'>Latest News</h1>
            <div className="news-grid">
                {news.length > 0 ? (
                    news.map((article) => (
                        <div key={article.id} className="news-card">
                            {article.image && <img src={article.image} alt={article.title} className="news-image" />}
                            <h2>{article.title}</h2>
                            <p className="date">{article.date}</p>
                            <p className="content">{article.content}</p>
                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="read-more">Read more</a>
                        </div>
                    ))
                ) : (
                    <p>No news available</p>
                )}
            </div>
        </div>
    );
};

export default NewsPage;
