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

interface FrequentPriceRangeProps {
    priceAnalysis: {
      max: number;
      min: number;
    };
  }

  const frequentPriceRangeModule: React.FC<FrequentPriceRangeProps> = ({ priceAnalysis }) => {
    return (
      <div className="price-analysis-module">
        <h3>Frequent Price Range</h3>
        <div className="stat">
          <span className="label">Max: </span>
          <span className="value">{priceAnalysis.max ? `${priceAnalysis.max} ETH` : 'N/A'}</span>
        </div>
        <div className="stat">
          <span className="label">Min: </span>
          <span className="value">{priceAnalysis.min ? `${priceAnalysis.min} ETH` : 'N/A'}</span>
        </div>
      </div>
    );
  }
  
  export default frequentPriceRangeModule;
