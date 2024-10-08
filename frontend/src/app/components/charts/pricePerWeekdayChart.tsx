import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, LinearScale, CategoryScale, TimeScale, BarElement } from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register required chart components and scales
ChartJS.register(
  Title, Tooltip, Legend,
  LinearScale, CategoryScale, TimeScale, BarElement
);

interface PricePerWeekdayChartProps {
  responseData: {
    pricePerWeekday: {
      [key: string]: number; // Expecting keys like "0" for Sunday, "1" for Monday, etc.
    };
  };
}

const pricePerWeekdayChart: React.FC<PricePerWeekdayChartProps> = ({ responseData }) => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (responseData && responseData.pricePerWeekday) {
      // Predefined labels for the days of the week
      const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      // Map these labels to the corresponding data, assuming the keys in responseData.pricePerWeekday are "0" (Sunday) to "6" (Saturday)
      const data = labels.map((_, index) => responseData.pricePerWeekday[index.toString()] || 0);

      setChartData({
        labels: labels,
        datasets: [{
          label: 'Average Price (ETH)',
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
          text: 'Day of the Week',
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
};

export default pricePerWeekdayChart;
