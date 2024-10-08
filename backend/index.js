import express from 'express';
import Moralis from 'moralis';
import { EvmChain } from '@moralisweb3/common-evm-utils';
import { fetchCollectionData } from './scripts/fetchData.js';
//import { main } from './scripts/nft_trader.js';
import { evaluateNFTs } from './scripts/algo.js';
import { config as dotenvConfig } from 'dotenv';
import cors from 'cors';

dotenvConfig();

const app = express();
app.use(express.json()); // This line is important
// Allow requests from http://localhost:4000
app.use(cors({
  origin: 'http://localhost:4000'
}));
const port = 3000;

const MORALIS_API_KEY = process.env.MoralisAPIKey;
const address = process.env.address;
const chain = EvmChain.ETHEREUM;
const collection = process.env.collection;

async function getDemoData() {
  // Get native balance
  const nativeBalance = await Moralis.EvmApi.balance.getNativeBalance({
    address,
    chain,
  });

  // Format the native balance formatted in ether via the .ether getter
  const native = nativeBalance.result.balance.ether;

  // Get token balances
  const tokenBalances = await Moralis.EvmApi.token.getWalletTokenBalances({
    address,
    chain,
  });

  // Format the balances to a readable output with the .display() method
  const tokens = tokenBalances.result.map((token) => token.display());

  // Get the nfts
  const nftsBalances = await Moralis.EvmApi.nft.getWalletNFTs({
    address,
    chain,
    limit: 10,
  });

  // Format the output to return name, amount and metadata
  const nfts = nftsBalances.result.map((nft) => ({
    name: nft.result.name,
    amount: nft.result.amount,
    metadata: nft.result.metadata,
  }));

  return { native, tokens, nfts };
}

app.get("/demo", async (req, res) => {
  try {
    // Get and return the crypto data
    const data = await getDemoData();
    res.status(200);
    res.json(data);
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500);
    res.json({ error: error.message });
  }
});

/*
app.get('/collectionData', async (req, res) => {
  const collectionAddress = req.query.collectionId;

  if (!collectionAddress) {
    res.status(400).json({ error: 'Missing collectionId parameter' });
    return;
  }

  try {
    const nftData = await main(collectionAddress); // Call the main function and await its result
    // Use the fetched data here
    //const results = evaluateNFTs(nftData);
    //res.json(results);
    res.json(nftData);
    console.log("Fetched NFT trades:", nftData);
  } catch (error) {
    console.error("Error fetching NFT trades:", error);
    res.status(500).json({ error: 'Failed to fetch NFT data' });
  }
});
*/

app.post('/collection', async (req, res) => {
  // Retrieve itemAddress from the request body
  let collectionAddress = req.body.collectionAddress;
  let timespan = req.body.timeSpan;

    //let collectionAddress = '0x5946aeaab44e65eb370ffaa6a7ef2218cff9b47d';
  
    if (!collectionAddress) {
      res.status(400).json({ error: 'Missing collectionId parameter' });
      return;
    }
  
    try {
      const nftData = fetchCollectionData(collectionAddress, timespan)
        .then((data) => {
            // Use the fetched data here
            //const results = evaluateNFTs(data);
            //res.json(results);
            res.json(data);
            console.log("Fetched NFT trades:", data);
        })
        .catch((error) => {
            // Handle errors here
            console.error("Error fetching NFT trades:", error);
            res.status(500).json({ error: 'Failed to fetch NFT data'});
        });

    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Error in fetching NFT data: ' + error.message });
    }
  });

app.get('/', (req, res) => {
    res.send('WCG AI/Analytics Server Main Path');
  });

const startServer = async () => {
    await Moralis.start({
        apiKey: process.env.MoralisAPIKey
      });

  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
  });
};

startServer();