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
const pk = process.env.pk;
const apiKey = process.env.NFTFI_API_KEY;
const testUrl = `https://goerli.infura.io/v3/${projectId}`;
const prodUrl = `https://mainnet.infura.io/v3/${projectId}`;
let nftSales = [];
let nftFloor = [];

let osFloor = [];
let lrFloor = [];
let bFloor = [];

const nftfi = await NFTfi.init({
    config: { api: { key: apiKey } },
    ethereum: {
      account: { privateKey: pk },
      provider: { url: prodUrl }
    }
});

// Main function to get listings, process them, and create offers
async function main(collectionAddress) {
    await Moralis.start({
        apiKey: process.env.MoralisAPIKey
      });
    
    //hard coded addresses for now but will integrate with index.js for express paths
    collectionAddress = process.env.mirandus_address;

    //get the listings from nftFi
    const listings = await getNftfiListings(collectionAddress);
    console.log(listings);

    //process the listing data to get historical trade data for the collection including moving averages and other factors and then get specific information about the nfts listed 
    //const processedListings = await processListings(collectionAddress, listings);
    await fetchNftSales(collectionAddress);
    console.log(nftSales);

    await fetchNftBankData(collectionAddress);
    const floorPrice = nftFloor.data.floor.eth;
    console.log('Collection Floor Price: ' + floorPrice);

    //review the processedListings to get the AI review of all the listings with the market data and make decisions on which look promising
    const approvedListings = await aiReview(processedListings);
  
    /*
    for (const listing of approvedListings) {
      const { principal, repayment, duration, currency, expiry, nftAddress, nftId, borrowerAddress, contractName } = listing;
      const offer = await createOffer(principal, repayment, duration, currency, expiry, nftAddress, nftId, borrowerAddress, contractName);
      console.log('Created offer:', offer);
    }
    */
}

// Helper function to get listings for a given collection
async function getNftfiListings(collectionAddress) {
    const listings = await nftfi.listings.get({
    filters: {
        nftAddresses: [collectionAddress],
    },
    pagination: {
        page: 1,
        limit: 100,
    },
    });

    console.log(`[INFO] found ${listings.length} listing(s).`);
    // Proceed if we find listings
    if (listings.length > 0) {
    for (var i = 0; i < listings.length; i++) {
        const listing = listings[i];
        console.log(`[INFO] listing #${i + 1}: ${JSON.stringify(listing)} \n`);
        }
    }
    return listings;
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
          What do you think about this NFT listing?
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

// --------NFTFi functions below -------------
// Helper function to create an offer on a NFT
async function createOffer(principal, repayment, duration, currency, expiry, nftAddress, nftId, borrowerAddress, contractName) {
  const offer = await nftfi.offers.create({
    terms: {
      principal,
      repayment,
      duration,
      currency,
      expiry,
    },
    nft: {
      address: nftAddress,
      id: nftId,
    },
    borrower: {
      address: borrowerAddress,
    },
    nftfi: {
      contract: {
        name: contractName,
      },
    },
  });
  return offer;
}

// Helper function to revoke an offer by nonce
async function revokeOfferByNonce(nonce, contractName) {
  const revoked = await nftfi.offers.revoke({
    offer: { nonce },
    nftfi: { contract: { name: contractName } },
  });
  return revoked;
}

// Helper function to delete an offer by ID
async function deleteOfferById(offerId) {
  const deleted = await nftfi.offers.delete({
    offer: {
      id: offerId,
    },
  });
  return deleted;
}

// Helper function to calculate the APR
function calculateApr(principal, repayment, duration) {
  const apr = nftfi.utils.calcApr(principal, repayment, duration);
  return apr;
}

// Helper function to get an expiry timestamp into the future
function getExpiry() {
  const expiry = nftfi.utils.getExpiry();
  return expiry;
}

// Helper function to calculate the loan repayment amount
function calculateRepaymentAmount(principal, apr, duration) {
  const amount = nftfi.utils.calcRepaymentAmount(principal, apr, duration);
  return amount;
}

//Helper function to format wei into eth
function formatEther(wei) {
    const ethAmount = nftfi.utils.formatEther(wei);
    return ethAmount;
}

// Helper function to format USDC amount into the amount of wei
function formatUsdcWei(value) {
  const usdcWei = nftfi.utils.formatWei(value, 'mwei');
  return usdcWei;
}

// Helper function to format ether amount into the amount of wei
function formatEtherWei(value) {
  const wei = nftfi.utils.formatWei(value, 'ether');
  return wei;
}

// Helper function to format USDC wei amount into the amount of unit
function formatUsdcUnits(wei) {
  const usdc = nftfi.utils.formatUnits(wei, 'mwei');
  return usdc;
}

// Helper function to format wei into the amount of unit
function formatUnits(wei, unit) {
  const formatted = nftfi.utils.formatUnits(wei, unit);
  return formatted;
}

// Helper function to get all offers made by your account
async function getOffers() {
    const offers = await nftfi.offers.get();
    return offers;
  }

// Execute the main function with the desired collection address
main(process.env.collection);
  