import axios from 'axios';
import Moralis from 'moralis';
import { config as dotenvConfig } from 'dotenv';
import moment from 'moment';
import Web3 from 'web3';


dotenvConfig();


async function fetchCollectionData(collectionAddress, timespan) {
    try {
      //const data = await fetchNFTTrades(collectionAddress);
      //const data = await getHistoricalNFTTrades(collectionAddress, 1);
      const sales = await getSales(collectionAddress, timespan);

      const priceAnalysis = analyzePrices(sales);
      const movingAverages = getMovingAverages(sales);
      const hotTimes = getHotActivityTimes(sales);
      const priceByDate = extractByDay(sales);
      const pricePerHour = averagePricePerHour(sales);
      const frequentPriceRange = mostFrequentPriceRange(sales, 10);
      const pricePerWeekday = averagePricePerWeekday(sales);
      const weekVsWeekend = averagePriceWeekdayVsWeekend(sales);
      const outliers = findOutliersIQR(sales);
      const velocityAndTrend = getSalesVelocityTrend(sales);

      const rsi = calculateRSI(sales);
      const macd = calculateMACD(sales);

      let signals = {
        "priceAnalysis": priceAnalysis,
        "movingAverages": movingAverages,
        "velocityAndTrend": velocityAndTrend,
        "rsi": rsi,
        "macd": macd,
        "hotTimes": hotTimes,
        "priceByDate": priceByDate,
        "pricePerHour": pricePerHour,
        "frequentPriceRange": frequentPriceRange,
        "pricePerWeekday": pricePerWeekday,
        "weekVsWeekend": weekVsWeekend,
        "outliers": outliers,
        "sales": sales
      }
      
      return signals;
    } catch (error) {
      console.error('Error getting collection data:', error.message);
      return null;
    }
}

//get historical trades for a specific collection address in the designated interval 
async function getHistoricalNFTTrades(collectionAddress, timespan) {
    // Calculate date range for the timespan
    const toDate = moment();
    const fromDate = moment().subtract(timespan, 'days');

    const fromDateStr = fromDate.format('YYYY-MM-DD');
    const toDateStr = toDate.format('YYYY-MM-DD');

    console.log('From date:', fromDateStr);
    console.log('To date:', toDateStr);
  
    let trades = [];
    let nextPageCursor = null;
  
    // Iterate through pages of data and collect trades
    while (true) {
      const response = await Moralis.EvmApi.nft.getNFTTrades({
        chain: '0x1',
        marketplace: 'opensea',
        address: collectionAddress,
        from_date: fromDateStr,
        to_date: toDateStr,
        limit: 200,
        cursor: nextPageCursor,
      });

      trades = trades.concat(response.result);
      nextPageCursor = response.json.cursor;
      console.log(nextPageCursor);
      console.log(`Fetched ${response.result.length} trades, total trades: ${trades.length}`);
  
      // Break the loop if the result array is empty
      if (response.result.length === 0 || !nextPageCursor) {
        break;
      }
    }
    //console.log(trades);
    return trades;
  }

// Get sales for a specific collection address in the designated interval
async function getSales(collectionAddress, timespan) {
    try {
      // Calculate date range for the timespan
      const toDate = moment();
      const fromDate = moment().subtract(timespan, 'days');
  
      const fromDateStr = fromDate.format('YYYY-MM-DD');
      const toDateStr = toDate.format('YYYY-MM-DD');
  
      console.log('From date:', fromDateStr);
      console.log('To date:', toDateStr);
  
      let sales = [];
      let prices = [];
      let pricesDates = [];
      let dates = [];
      let results = []
      let nextPageCursor = null;
      let pricesDatesTxs = [];
      let txs = [];
  
      while (true) {
        const response = await Moralis.EvmApi.nft.getNFTContractTransfers({
          "chain": "0x1",
          "format": "decimal",
          "limit": 100,
          //"disableTotal": false,
          "cursor": nextPageCursor,
          "fromDate": fromDateStr,
          "toDate": toDateStr,
          "address": collectionAddress
        });
        results = results.concat(response.result);
        nextPageCursor = response.jsonResponse.cursor;
        console.log(`Fetched ${response.result.length} results, total results: ${results.length}`);
        if (response.result.length === 0 || !nextPageCursor) {
          break;
        }
      }

        results.forEach(element => {
        if (element.value.rawValue.value != 0n) {
            console.log(element);
            sales.push(element);

            let price = element.value.rawValue.value;
            price = parseInt(price.toString().replace('n',''));
            price = weiToEth(price);
            prices.push(price);

            let date = element.blockTimestamp;
            dates.push(date);

            let tx = element.transactionHash;
            txs.push(tx);

            let priceDate = {
                "price": price,
                "date": date
            }

            let priceDateTx = {
                "price": price,
                "date": date,
                "tx": tx,
                "tokenId": element.tokenId,
            }

            pricesDates.push(priceDate);
            pricesDatesTxs.push(priceDateTx);
            }
        });

      console.log('Total sales for ' + collectionAddress + ' over the last ' + timespan + ' days: ' + sales.length);
      return pricesDatesTxs;
    } catch (e) {
      console.error(e);
    }
  }

  function weiToEth(wei, decimals = 18) {
    return Number(Web3.utils.fromWei(wei.toString(), 'ether'));
}

function calculateMACD(data, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
    function calculateEMA(prices, period) {
      const k = 2 / (period + 1);
      const ema = [prices[0]];
  
      for (let i = 1; i < prices.length; i++) {
        ema.push(prices[i] * k + ema[i - 1] * (1 - k));
      }
  
      return ema;
    }
  
    const prices = data.map(item => item.price);
    const shortEMA = calculateEMA(prices, shortPeriod);
    const longEMA = calculateEMA(prices, longPeriod);
    const macdLine = shortEMA.map((short, i) => short - longEMA[i]);
    const signalLine = calculateEMA(macdLine, signalPeriod);
  
    return {
      macdLine,
      signalLine,
    };
  }
  
  function calculateRSI(data, period = 14) {
    const prices = data.map(item => item.price);
  
    let gains = 0;
    let losses = 0;
  
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }
  
    let avgGain = gains / period;
    let avgLoss = losses / period;
    let rs = avgGain / avgLoss;
    let rsi = [100 - 100 / (1 + rs)];
  
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      let gain = 0;
      let loss = 0;
  
      if (change > 0) {
        gain = change;
      } else {
        loss = -change;
      }
  
      const newAvgGain = (avgGain * (period - 1) + gain) / period;
      const newAvgLoss = (avgLoss * (period - 1) + loss) / period;
  
      rs = newAvgGain / newAvgLoss;
      rsi.push(100 - 100 / (1 + rs));
  
      avgGain = newAvgGain;
      avgLoss = newAvgLoss;
    }
  
    return rsi;
  }
  

function getSalesVelocityTrend(sales) {
    let totalPercentageChange = 0;
    let totalTimeElapsed = 0;
  
    for (let i = 1; i < sales.length; i++) {
      const priceChange = (sales[i].price - sales[i - 1].price) / sales[i - 1].price;
      totalPercentageChange += priceChange;
  
      const timeElapsed = (new Date(sales[i].date) - new Date(sales[i - 1].date)) / 1000;
      totalTimeElapsed += timeElapsed;
    }
  
    const averagePercentageChange = totalPercentageChange / (sales.length - 1);
    const averageTimeElapsed = totalTimeElapsed / (sales.length - 1);
  
    let trend = 'sideways';
    if (averagePercentageChange > 0) {
      trend = 'up';
    } else if (averagePercentageChange < 0) {
      trend = 'down';
    }
  
    const velocity = averagePercentageChange / averageTimeElapsed;
  
    return { trend, velocity };
  }

  function analyzePrices(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }
  
    data.sort((a, b) => a.date - b.date);
  
    const sum = data.reduce((acc, curr) => acc + curr.price, 0);
    const count = data.length;
    const average = sum / count;
  
    const min = Math.min(...data.map(d => d.price));
    const max = Math.max(...data.map(d => d.price));
  
    const median = (() => {
      const sortedPrices = data.map(d => d.price).sort((a, b) => a - b);
      const mid = Math.floor(sortedPrices.length / 2);
  
      if (sortedPrices.length % 2 === 0) {
        return (sortedPrices[mid - 1] + sortedPrices[mid]) / 2;
      } else {
        return sortedPrices[mid];
      }
    })();
  
    return {
      sum,
      count,
      average,
      min,
      max,
      median
    };
  }
/*
  function getHotActivityTimes(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  data.sort((a, b) => new Date(a.date) - new Date(b.date));

  function getHourlyStats() {
    const hourlyStats = new Array(24).fill(0).map(() => ({
      sales: 0,
      volume: 0,
    }));

    for (let i = 0; i < data.length - 1; i++) {
      const diff = new Date(data[i + 1].date) - new Date(data[i].date);
      const hour = new Date(data[i].date).getHours();

      if (diff <= 60 * 60 * 1000) {
        hourlyStats[hour].sales++;
        hourlyStats[hour].volume += data[i].volume;
      }
    }

    return hourlyStats;
  }

  const hourlyStats = getHourlyStats();
  const sortedHoursByVolume = hourlyStats
    .map((stat, index) => ({ ...stat, hour: index }))
    .sort((a, b) => b.volume - a.volume);

  const hottestHours = sortedHoursByVolume.slice(0, 3); // Get the top 3 hottest hours

  return {
    hottestHours,
  };
}*/

function getHotActivityTimes(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  // Assuming data is sorted by date already
  // If not, uncomment the following line
  // data.sort((a, b) => new Date(a.date) - new Date(b.date));

  function getHourlyStats() {
    const hourlyStats = new Array(24).fill(null).map(() => ({
      sales: 0,
      volume: 0,
    }));

    for (let record of data) {
      const hour = new Date(record.date).getHours();
      hourlyStats[hour].sales += 1;
      hourlyStats[hour].volume += record.volume || 0; // Add 0 if volume is null
    }

    return hourlyStats;
  }

  const hourlyStats = getHourlyStats();
  
  // Sort by sales to find the hottest hours
  const sortedHoursBySales = hourlyStats
    .map((stat, index) => ({ ...stat, hour: index }))
    .sort((a, b) => b.sales - a.sales);

  // Get the top 3 hours with the most sales
  const hottestHours = sortedHoursBySales.slice(0, 3);

  return {
    hotTimes: {
      hottestHours,
    },
  };
}

  function getMovingAverages(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return null;
      }
    
      data.sort((a, b) => a.date - b.date);
    
      function calculateMovingAverage(windowSizeInMillis) {
        let windowSum = 0;
        let windowCount = 0;
    
        for (let i = 0; i < data.length - 1; i++) {
          const diff = data[i + 1].date - data[i].date;
          if (diff <= windowSizeInMillis) {
            windowSum += data[i].price;
            windowCount++;
          }
        }
    
        if (windowCount > 0) {
          return windowSum / windowCount;
        } else {
          return null;
        }
      }
    
      const movingAverages = {
        oneHour: calculateMovingAverage(60 * 60 * 1000),
        sixHours: calculateMovingAverage(6 * 60 * 60 * 1000),
        twelveHours: calculateMovingAverage(12 * 60 * 60 * 1000),
        twentyFourHours: calculateMovingAverage(24 * 60 * 60 * 1000),
      };
    
      return {
        movingAverages,
      };
  }
  

function getHourlyStats(assets) {
  // Parse dates and sort data
const parsedData = data.map(item => ({ ...item, date: new Date(item.date) })).sort((a, b) => a.date - b.date);

// Group data by hour
const hourlyData = parsedData.reduce((acc, item) => {
  const hour = item.date.getHours();
  if (!acc[hour]) {
    acc[hour] = { prices: [], count: 0 };
  }
  acc[hour].prices.push(item.price);
  acc[hour].count++;
  return acc;
}, {});

// Calculate average, median, min, max for each hour
const hourlyStats = Object.keys(hourlyData).map(hour => {
  const prices = hourlyData[hour].prices;
  const count = hourlyData[hour].count;

  const sortedPrices = prices.slice().sort((a, b) => a - b);
  const median = (sortedPrices[Math.floor(count / 2)] + sortedPrices[Math.ceil(count / 2)]) / 2;

  return {
    hour,
    count,
    average: prices.reduce((a, b) => a + b, 0) / count,
    median,
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
});

console.log(hourlyStats);

}

function extractByDay(data) {
    const result = {};
  
    data.forEach(item => {
      const date = new Date(item.date);
      const day = date.toISOString().substring(0, 10);
  
      if (!result[day]) {
        result[day] = [];
      }
  
      result[day].push(item);
    });
  
    return result;
  }
  
  function averagePricePerHour(data) {
    const hourlyData = {};
  
    data.forEach(item => {
      const date = new Date(item.date);
      const hour = date.getHours();
  
      if (!hourlyData[hour]) {
        hourlyData[hour] = { total: 0, count: 0 };
      }
  
      hourlyData[hour].total += item.price;
      hourlyData[hour].count++;
    });
  
    const result = {};
  
    Object.keys(hourlyData).forEach(hour => {
      result[hour] = hourlyData[hour].total / hourlyData[hour].count;
    });
  
    return result;
  }

  function mostFrequentPriceRange(data, numBins = 10) {
    const prices = data.map(item => item.price).sort((a, b) => a - b);
    const minPrice = prices[0];
    const maxPrice = prices[prices.length - 1];
    const iqr = percentileMath(prices, 0.75) - percentileMath(prices, 0.25);
    const binWidth = 2 * iqr * Math.pow(prices.length, -1 / 3);
    const actualNumBins = Math.ceil((maxPrice - minPrice) / binWidth);
  
    const ranges = Array(actualNumBins).fill(0);
    prices.forEach(price => {
      const rangeIndex = Math.floor((price - minPrice) / binWidth);
      ranges[rangeIndex]++;
    });
  
    const maxRangeIndex = ranges.reduce(
      (prev, curr, index) => (curr > ranges[prev] ? index : prev),
      0
    );
  
    return {
      min: minPrice + maxRangeIndex * binWidth,
      max: minPrice + (maxRangeIndex + 1) * binWidth,
    };
  }
  
  function percentileMath(arr, p) {
    const index = (arr.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return arr[index];
    return (arr[lower] * (upper - index)) + (arr[upper] * (index - lower));
  }
  

  function averagePricePerWeekday(data) {
    const weekdayData = {};

    data.forEach(item => {
        // Parse the date in UTC
        const date = new Date(item.date);
        const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        const weekday = utcDate.getUTCDay();

        if (!weekdayData[weekday]) {
            weekdayData[weekday] = { total: 0, count: 0 };
        }

        weekdayData[weekday].total += item.price;
        weekdayData[weekday].count++;
    });

    const result = {};

    Object.keys(weekdayData).forEach(weekday => {
        // Ensure count is greater than 0 to avoid division by zero
        if (weekdayData[weekday].count > 0) {
            result[weekday] = weekdayData[weekday].total / weekdayData[weekday].count;
        }
    });

    return result;
}

  
  function averagePriceWeekdayVsWeekend(data) {
    const categorizedData = { weekday: { total: 0, count: 0 }, weekend: { total: 0, count: 0 } };
  
    data.forEach(item => {
      const date = new Date(item.date);
      const day = date.getDay();
      const category = (day === 0 || day === 6) ? 'weekend' : 'weekday';
  
      categorizedData[category].total += item.price;
      categorizedData[category].count++;
    });
  
    return {
      weekday: categorizedData.weekday.total / categorizedData.weekday.count,
      weekend: categorizedData.weekend.total / categorizedData.weekend.count,
    };
  }
  
  function findOutliersIQR(data) {
    const prices = data.map(item => item.price).sort((a, b) => a - b);
    const q1 = percentile(prices, 0.25);
    const q3 = percentile(prices, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
  
    return data.filter(item => item.price < lowerBound || item.price > upperBound);
  }
  
  function percentile(arr, p) {
    const index = (arr.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return arr[index];
    return (arr[lower] * (upper - index)) + (arr[upper] * (index - lower));
  }
  

export { fetchCollectionData };
