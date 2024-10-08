import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, LinearScale, CategoryScale, BarElement } from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register required chart components and scales
ChartJS.register(Title, Tooltip, Legend, LinearScale, CategoryScale, BarElement);

interface HottestHour {
  sales: number;
  volume: number | null;
  hour: number;
}

interface HottestHoursData {
  hottestHours: HottestHour[];
}

interface HotTimes {
  hotTimes: HottestHoursData; // Nested structure for hotTimes
}

interface HottestHoursChartProps {
  responseData: {
    hotTimes: HotTimes; // Additional nesting level for hotTimes
  };
}

const hottestHoursChart: React.FC<HottestHoursChartProps> = ({ responseData }) => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    // Ensure that the double nested hotTimes object and its hottestHours array exist
    if (responseData && responseData.hotTimes && responseData.hotTimes.hotTimes && responseData.hotTimes.hotTimes.hottestHours) {
      const labels = responseData.hotTimes.hotTimes.hottestHours.map(item => `Hour ${item.hour}`);
      const salesData = responseData.hotTimes.hotTimes.hottestHours.map(item => item.sales);

      setChartData({
        labels: labels,
        datasets: [{
          label: 'Sales per Hour',
          data: salesData,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
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
          text: 'Number of Sales',
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

export default hottestHoursChart;
