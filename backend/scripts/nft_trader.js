// Import SDK
import NFTfi from '@nftfi/js';
import axios from 'axios';
import Moralis from 'moralis';
import dotenv from 'dotenv';
import path from 'path';
import { fetchCollectionData } from './fetchData.js';


// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Get projectId from environment variables
const projectId = process.env.projectId;
const testUrl = `https://goerli.infura.io/v3/${projectId}`;
const prodUrl = `https://mainnet.infura.io/v3/${projectId}`;
let nftSales = [];
let nftFloor = [];

let osFloor = [];
let lrFloor = [];
let bFloor = [];


// Main function to get listings, process them, and create offers
async function main(collectionAddress, tokenId) {
    await Moralis.start({
      apiKey: process.env.MoralisAPIKey
    });
    
    //hard coded addresses for now but will integrate with index.js for express paths
    collectionAddress = process.env.mirandus_address;

    //process the listing data to get historical trade data for the collection including moving averages and other factors and then get specific information about the nfts listed
    await fetchNftSales(collectionAddress);
    console.log(nftSales);

    const groupedData = groupByTokenId(nftSales);
    console.log(groupedData);

    const txGroupedData = groupByTransaction(groupedData);
    //console.log(txGroupedData);

    const tokenSalesSorted = sortBySales(groupedData);
    console.log(tokenSalesSorted);


    await fetchNftBankData(collectionAddress);
    const floorPrice = nftFloor.data.floor.eth;
    console.log('Collection Floor Price: ' + floorPrice);


    let saleData = {
      floorPrice: floorPrice,
      tokenSalesSorted: tokenSalesSorted,
      txGroupedData: txGroupedData,
      groupedData:groupedData
    }

    return saleData;

    //review the processedListings to get the AI review of all the listings with the market data and make decisions on which look promising
    //const approvedListings = await aiReview(processedListings);
  
    /*
    for (const listing of approvedListings) {
      const { principal, repayment, duration, currency, expiry, nftAddress, nftId, borrowerAddress, contractName } = listing;
      const offer = await createOffer(principal, repayment, duration, currency, expiry, nftAddress, nftId, borrowerAddress, contractName);
      console.log('Created offer:', offer);
    }
    */
}

//group sales by token Id
function groupByTokenId(data) {
    const groups = {};
  
    for (const item of data.sales) {
      const { tokenId, ...rest } = item;
  
      if (!groups[tokenId]) {
        groups[tokenId] = [];
      }
  
      groups[tokenId].push(rest);
    }
  
    // Sort groups by the number of sales in descending order
    const sortedGroups = Object.entries(groups).sort(
      (a, b) => b[1].length - a[1].length
    );
  
    // Convert the sorted groups back to an object
    const sortedData = {};
    for (const [tokenId, items] of sortedGroups) {
      sortedData[tokenId] = items;
    }
  
    return sortedData;
  }

  //group by TX 
function groupByTransaction(data) {
    const groups = {};

    for (const tokenId in data) {
    const transactions = data[tokenId];

    for (const transaction of transactions) {
    const { tx, ...rest } = transaction;

    if (!groups[tx]) {
        groups[tx] = [];
    }

    groups[tx].push({ tokenId, ...rest });
    }
    }

    return groups;
}  

//sort by # sales after sorting by tokenId
function sortBySales(data) {
  const salesCount = {};

  for (const tokenId in data) {
    salesCount[tokenId] = data[tokenId].length;
  }

  const sortedData = Object.keys(data).sort((a, b) => salesCount[b] - salesCount[a]);

  const result = {};
  for (const tokenId of sortedData) {
    result[tokenId] = data[tokenId];
  }

  return result;
}


// Helper functions to fetch data from Contract, Opensea and NFTBank.ai
async function fetchNftSales(collectionAddress, nftId) {
// Implement the API call to fetch data from Opensea
//Using fetchData.js 
try {
    const nftData = fetchCollectionData(collectionAddress)
      .then((data) => {
          // Use the fetched data here
          //const results = evaluateNFTs(data);
          nftSales = data; 
      })
      .catch((error) => {
          // Handle errors here
          console.error("Error fetching NFT trades:", error);
          res.status(500).json({ error: 'Failed to fetch NFT data'});
      });
    
    return nftData;

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error in fetching NFT data: ' + error.message });
  }
}


//get NFTBank data 
async function fetchNftBankData(nftAddress, nftId) {
    try {
    const options = {
        method: 'GET',
        headers: {accept: 'application/json', 'x-api-key': process.env.nftbankAPI}
    };

      
    return fetch(`https://api.nftbank.run/v1/collection/${nftAddress}/floor?networkId=ethereum`, options)
        .then(response => response.json())
        .then(response => {
            //console.log(response);
            nftFloor = response;
            return response;
        })
        .catch(err => console.error(err));
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error in fetching NFT data: ' + error.message });
      }
}

// Helper function to pass processedListings into GPT for AI review
async function aiReview(processedListings) {
    const approvedListings = [];
  
  for (const listing of processedListings) {
      const requestBody = {
      query: `
          What trading opportunities do you see for this NFT?
          Floor price: ${listing.floorPrice}
          Traits: ${JSON.stringify(listing.traits)}
          Total borrower loans: ${listing.totalBorrowerLoans}
          Loan score: ${listing.loanScore}
      `,
      };
  
      const response = await axios.post('https://ai.guildofguilds.gg/query', requestBody);
  
      if (response.data.approved) {
      approvedListings.push({
          ...listing,
          principal: response.data.offerDetails.principal,
          repayment: response.data.offerDetails.repayment,
          duration: response.data.offerDetails.duration,
          currency: response.data.offerDetails.currency,
          expiry: response.data.offerDetails.expiry,
      });
      }
  }
  
  return approvedListings;
  }

  // Execute the main function with the desired collection address
main(process.env.collection);
  
export { main };