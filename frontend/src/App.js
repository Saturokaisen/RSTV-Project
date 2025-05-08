import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavbarComponent from './components/NavbarComponent';
import NewsPage from './components/NewsPage';
import StocksPerformanceComparison from './components/StocksPerformanceComparison';
import RealTimeStockPrice from './components/RealTimeStockPrice';
import StockPrediction from './components/StockPrediction';
import HomePage from './components/HomePage';
import About from './components/About';


const App = () => {
    return (
        <Router>
            <NavbarComponent />
            <Routes>
                <Route path="/" element={<HomePage />} />
		<Route path="/news" element={<NewsPage />} />
                <Route path="/stocks-performance-comparison" element={<StocksPerformanceComparison />} />
                <Route path="/real-time-stock-price" element={<RealTimeStockPrice />} />
                <Route path="/stock-prediction" element={<StockPrediction />} />
                <Route path="/about" element={<About />} />
            </Routes>
        </Router>
    );
};

export default App;
