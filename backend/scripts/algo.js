function evaluateNFTs(targetCollection) {
    const instantBuyThreshold = 0.8;
    const bidThreshold = 0.9;
    const priceDropThreshold = 0.5;
    const volumeToPriceThreshold = 10;
    const rsiThreshold = 30;

    // Define weights for each rule
  const ruleWeights = {
    instantBuy: 3,
    placeBid: 2,
    priceDrop: 1,
    highTradingVolume: 1,
    macdBullishTrend: 1,
    rsiOversold: 1,
    recoveringFromDip: 1,
  };

    let nftsToBuy = [];
    let buyScores = [];
    let nftsAndScores = [];
    console.log("In Algo.js");
  
    for (const nft of targetCollection) {
      const currentPrice = nft.currentPrice;
      const lastSalePrice = nft.lastSalePrice;
      const floorPrice = nft.floorPrice;
      const highestBid = nft.highestBid;
      const allTimeHigh = nft.allTimeHigh;
      const tradingVolume = nft.tradingVolume;
      const historicalAveragePrice = nft.historicalAveragePrice;
      const macd = nft.macd;
      const rsi = nft.rsi;
      const daysSinceLastSale = nft.daysSinceLastSale;
      const uniqueOwners = nft.uniqueOwners;
      const averageHoldingTime = nft.averageHoldingTime;
      const transactionCount = nft.transactionCount;
      //const priceToEarningsRatio = nft.priceToEarningsRatio;

      // Initialize buy decision score
      let buyDecisionScore = 0;

      console.log('Evaluating NFT: ' + nft.id);
  
      // Rule 1: Instant Buy 
      if (
        currentPrice <= lastSalePrice * instantBuyThreshold &&
        currentPrice < floorPrice &&
        daysSinceLastSale < 7 // Ensure that the NFT has been sold recently
      ) {
        buyDecisionScore += ruleWeights.instantBuy;
        console.log(`Instant Buy: NFT ID ${nft.id} at price ${currentPrice}. Potential flip price: ${floorPrice}`);
      }
  
      // Rule 2: Place Bid 
      if (
        lastSalePrice < floorPrice &&
        (!highestBid || highestBid <= lastSalePrice * bidThreshold) &&
        daysSinceLastSale < 7 // Ensure that the NFT has been sold recently
      ) {
        buyDecisionScore += ruleWeights.placeBid;
        const bidPrice = lastSalePrice * bidThreshold;
        console.log(`Place Bid: NFT ID ${nft.id} at price ${bidPrice}. Potential flip price: ${floorPrice}`);
      }
  
      // Rule 3: Price Drop 
      if (
        (allTimeHigh - currentPrice) / allTimeHigh >= priceDropThreshold &&
        uniqueOwners > 10 // Ensure that the NFT has a diverse ownership base
      ) {
        buyDecisionScore += ruleWeights.priceDrop;
        console.log(`Buy Signal (Price Drop): NFT ID ${nft.id} at price ${currentPrice}.`);
      }
  
      // Rule 4: High Trading Volume to Price 
      if (
        tradingVolume / currentPrice >= volumeToPriceThreshold &&
        transactionCount > 50 // Ensure that there is a significant amount of trading activity
      ) {
        buyDecisionScore += ruleWeights.highTradingVolume;
        console.log(`Buy Signal (High Trading Volume): NFT ID ${nft.id} at price ${currentPrice}.`);
      }
  
    // Rule 5: MACD Bullish Trend (improved)
    if (
        macd > 0 &&
        macd >= nft.prevMacd &&
        averageHoldingTime < 30 // Ensure that the NFT has a relatively short holding time, indicating more active trading
    ) {
        buyDecisionScore += ruleWeights.macdBullishTrend;
        console.log(`Buy Signal (MACD Bullish Trend): NFT ID ${nft.id} at price ${currentPrice}.`);
    }

    // Rule 6: RSI Oversold (improved)
    if (
        rsi <= rsiThreshold &&
        uniqueOwners > 10 // Ensure that the NFT has a diverse ownership base
    ) {
        buyDecisionScore += ruleWeights.rsiOversold;
        console.log(`Buy Signal (RSI Oversold): NFT ID ${nft.id} at price ${currentPrice}.`);
    }

    // Rule 7: Dipped Below Historical Average Price and Recovering (improved)
    if (
        currentPrice < historicalAveragePrice * 0.9 &&
        currentPrice > nft.prevPrice &&
        transactionCount > 50 // Ensure that there is a significant amount of trading activity
    ) {
        buyDecisionScore += ruleWeights.recoveringFromDip;
        console.log(`Buy Signal (Recovering from Dip): NFT ID ${nft.id} at price ${currentPrice}.`);
    }

    /*// Rule 8: Low Price-to-Earnings Ratio
    if (
        priceToEarningsRatio < 10 &&
        uniqueOwners > 10 // Ensure that the NFT has a diverse ownership base
    ) {
        console.log(`Buy Signal (Low Price-to-Earnings Ratio): NFT ID ${nft.id} at price ${currentPrice}.`);
    }*/

    if (buyDecisionScore >= 7) {
        console.log("Strong buy indicator: " + buyDecisionScore);
        buyScores.push(buyDecisionScore);
        nftsToBuy.push(nft.id);

        let nftAndScore = {
            nft: nft,
            score: buyDecisionScore
        };

        nftsAndScores.push(nftAndScore);
    }

    }
    return nftsAndScores;
}
  
export { evaluateNFTs };

  
  