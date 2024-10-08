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

interface PricePerHourChartProps {
  responseData: any; // Adjust type as per your API response type
}

const pricePerHourChart: React.FC<PricePerHourChartProps> = ({ responseData }) => {
    const [chartData, setChartData] = useState<any>(null);
  
    useEffect(() => {
      // Assuming responseData has the direct structure as logged
      if (responseData) {
        const labels = Object.keys(responseData.pricePerHour);
        const data = Object.values(responseData.pricePerHour);
  
        setChartData({
          labels: labels,
          datasets: [{
            label: 'Price per Hour (ETH)',
            data: data,
            backgroundColor: 'rgb(54, 162, 235)',
            borderWidth: 1,
          }],
        });
      }
    }, [responseData]);

  const options = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Hour of the Day',
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Price (ETH)',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="chart-container">
      {chartData ? <Bar data={chartData} options={options} /> : <p>Loading chart...</p>}
    </div>
  );
}

export default pricePerHourChart;
