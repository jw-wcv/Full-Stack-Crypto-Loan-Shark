import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, LinearScale, CategoryScale, TimeScale, BarElement } from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register required chart components and scales
ChartJS.register(
  Title, Tooltip, Legend,
  LinearScale, CategoryScale, BarElement
);

interface PriceAnalysisProps {
    priceAnalysis: {
      sum: number;
      count: number;
      average: number;
      min: number;
      max: number;
      median: number;
    };
  }

  const priceAnalysisModule: React.FC<PriceAnalysisProps> = ({ priceAnalysis }) => {
    return (
      <div className="price-analysis-module">
        <h3>Price Analysis</h3>
        <div className="stat">
          <span className="label">Sum: </span>
          <span className="value">{priceAnalysis.sum.toFixed(2)} ETH</span>
        </div>
        <div className="stat">
          <span className="label">Count: </span>
          <span className="value">{priceAnalysis.count}</span>
        </div>
        <div className="stat">
          <span className="label">Average: </span>
          <span className="value">{priceAnalysis.average.toFixed(2)} ETH</span>
        </div>
        <div className="stat">
          <span className="label">Minimum: </span>
          <span className="value">{priceAnalysis.min.toFixed(2)} ETH</span>
        </div>
        <div className="stat">
          <span className="label">Maximum: </span>
          <span className="value">{priceAnalysis.max.toFixed(2)} ETH</span>
        </div>
        <div className="stat">
          <span className="label">Median: </span>
          <span className="value">{priceAnalysis.median.toFixed(2)} ETH</span>
        </div>
      </div>
    );
  }
  
  export default priceAnalysisModule;
