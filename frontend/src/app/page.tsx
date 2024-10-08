'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Card from './components/Card';
import Navbar from './components/Navbar';

import SalePriceChart from './components/charts/salePriceChart';
import OutlierPriceChart from './components/charts/outlierPriceChart';
import PricePerWeekdayChart from './components/charts/pricePerWeekdayChart';
import PricePerHourChart from './components/charts/pricePerHourChart';
import PriceAnalysisModule from './components/modules/priceAnalysisModule';
import WeekVsWeekendModule from './components/modules/weekVsWeekendModule';
import FrequentPriceRangeModule from './components/modules/frequentPriceRangeModule';
import HottestHoursChart from './components/charts/hottestHoursChart';

export default function Home() {
  const [responseData, setResponseData] = useState<any>(null); // Adjust type as per your API response type
  const [contractAddress, setContractAddress] = useState('0x5946aeaab44e65eb370ffaa6a7ef2218cff9b47d');
  const [timeSpan, setTimeSpan] = useState(3);

  const handleContractAddressChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setContractAddress(event.target.value);
  }, []);

  const handleTimeSpanChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setTimeSpan(Number(event.target.value));
  }, []);

  // Load data function
  const loadData = useCallback(async () => {
    try {
      const response = await axios.post('http://localhost:3000/collection', {
        collectionAddress: contractAddress,
        timeSpan: timeSpan
      });
      const data = response.data;
  
      if (data) {
        setResponseData(data);
        console.log(data);
      } else {
        console.error('Invalid response format:', data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [contractAddress, timeSpan]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div>
      <main className="main-content p-4" style={{ backgroundColor: '#f0f0f0' }}>
        <div className="input-section" style={{ marginBottom: '20px' }}>
          <Card>
            <label htmlFor="contractAddress">Contract Address:</label>
            <input
              type="text"
              value={contractAddress}
              onChange={handleContractAddressChange}
              placeholder="Enter Contract Address"
            />
            <label htmlFor="timespan">Timespan:</label>
            <input
              type="number"
              value={timeSpan}
              onChange={handleTimeSpanChange}
              placeholder="Enter Time Span"
            />
          </Card>
        </div>

        <div className="modules-section" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
          {responseData && (
            <>
              <Card>
                <PriceAnalysisModule priceAnalysis={responseData.priceAnalysis} />
              </Card>
              <Card>
                <WeekVsWeekendModule priceAnalysis={responseData.weekVsWeekend} />
              </Card>
              <Card>
                <FrequentPriceRangeModule priceAnalysis={responseData.frequentPriceRange} />
              </Card>
              {/* ... other modules wrapped in Card components */}
            </>
          )}
        </div>

        <div className="charts-section" style={{ marginTop: '20px' }}>
          <Card>
            <SalePriceChart responseData={responseData} />
          </Card>
          <Card>
            <OutlierPriceChart responseData={responseData} />
          </Card>
          <Card>
            <PricePerWeekdayChart responseData={responseData} />
          </Card>
          <Card>
            <PricePerHourChart responseData={responseData} />
          </Card>
          <Card>
            <HottestHoursChart responseData={responseData} />
          </Card>
          {/* ... other charts wrapped in Card components */}
        </div>
      </main>
    </div>
  );
}