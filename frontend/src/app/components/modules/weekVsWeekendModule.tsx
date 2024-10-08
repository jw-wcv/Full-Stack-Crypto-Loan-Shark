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

interface WeekVsWeekdayAnalysisProps {
    priceAnalysis: {
      weekday: number;
      weekend: number;
    };
  }

  const weekVsWeekendModule: React.FC<WeekVsWeekdayAnalysisProps> = ({ priceAnalysis }) => {
    return (
      <div className="price-analysis-module">
        <h3>Week vs Weekday Analysis</h3>
        <div className="stat">
          <span className="label">Weekday: </span>
          <span className="value">{priceAnalysis.weekday ? `${priceAnalysis.weekday} ETH` : 'N/A'}</span>
        </div>
        <div className="stat">
          <span className="label">Weekend: </span>
          <span className="value">{priceAnalysis.weekend ? `${priceAnalysis.weekend} ETH` : 'N/A'}</span>
        </div>
      </div>
    );
  }
  
  export default weekVsWeekendModule;
