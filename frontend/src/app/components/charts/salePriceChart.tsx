import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { LineElement, PointElement } from 'chart.js';
import { Chart as ChartJS, Title, Tooltip, Legend, LinearScale, CategoryScale, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns'; // Import the date-fns adapter
import { ChartOptions } from 'chart.js';


// Register required chart components and scales
ChartJS.register(
  Title, Tooltip, Legend,
  LineElement, PointElement,
  LinearScale, CategoryScale, TimeScale
);

interface SalePriceData {
  sales: {
    price: number;
    date: string; // assuming the date comes as a string
  }[];
}

interface SalePriceChartProps {
  responseData: SalePriceData;
}

const salePriceChart: React.FC<SalePriceChartProps> = ({ responseData }) => {
  const [chartData, setChartData] = useState<any>(null);
  // Define the chart data type
  useEffect(() => {
    // Ensure that the double nested hotTimes object and its hottestHours array exist
    if (responseData && responseData.sales) {
      const prices = responseData.sales.map(sale => sale.price);
      const dates = responseData.sales.map(sale => sale.date); // Date conversion if necessary


      setChartData({
        labels: dates,
        datasets: [{
          label: 'Sale Price',
          data: prices,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        }],
      });
    }
  }, [responseData]);

  const options: ChartOptions<"line"> = {
    scales: {
      x: {
        type: 'time', // 'time' is a specific string literal type expected by Chart.js
        time: {
          unit: 'day',
        },
        title: {
          display: true,
          text: 'Date',
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
      {chartData ? <Line data={chartData} options={options} /> : <p>Loading chart...</p>}
    </div>
  );
}

export default salePriceChart;
