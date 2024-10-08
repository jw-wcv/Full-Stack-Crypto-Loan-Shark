import React, { useState, useEffect } from 'react';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, LinearScale, PointElement, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register required chart components and scales
ChartJS.register(
  Title, Tooltip, Legend,
  LinearScale, PointElement, TimeScale
);

interface OutlierPriceChartProps {
  responseData: {
    outliers: {
      price: number;
      date: string;
      tx: string;
      tokenId: string;
    }[];
  };
}

// Define a more specific type for the chart data
interface ChartData {
  datasets: {
    label: string;
    data: { x: Date; y: number }[]; // Specify that data is an array of objects with Date and number
    backgroundColor: string;
  }[];
}

const OutlierPriceChart: React.FC<OutlierPriceChartProps> = ({ responseData }) => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  const options = {
    scales: {
      x: {
        type: 'time' as const, // Explicitly cast to 'time'
        time: {
          unit: 'day' as const, // Explicitly cast to 'day'
        },
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        beginAtZero: false,
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
  

  useEffect(() => {
    if (responseData && Array.isArray(responseData.outliers)) {
      const outliers = responseData.outliers;
      
      const dataPoints = outliers.map(outlier => ({
        x: new Date(outlier.date),
        y: outlier.price
      }));

      setChartData({
        datasets: [{
          label: 'Outlier Transactions',
          data: dataPoints,
          backgroundColor: 'rgb(255, 99, 132)',
        }],
      });
      setLoading(false); // Data is loaded, so set loading to false
    }
  }, [responseData]);

  return (
    <div className="chart-container">
      {loading ? <p>Loading chart...</p> : <Scatter data={chartData!} options={options} />}
    </div>
  );
}

export default OutlierPriceChart;
