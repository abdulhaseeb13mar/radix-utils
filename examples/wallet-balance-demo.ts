import {
  fetchWalletBalances,
  type WalletBalances,
  type FungibleBalance,
  type NonFungibleBalance,
} from 'radix-utils';
import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';

async function demonstrateWalletBalances() {
  // Initialize the Gateway API
  const gatewayApi = GatewayApiClient.initialize({
    networkId: 1, // Mainnet
    applicationName: 'Wallet Balance Demo',
    applicationVersion: '1.0.0',
  });

  // Example wallet address (replace with a real one)
  const walletAddress =
    'account_rdx12y02nen8zjrq0k0nku98shjq7n05kvl3j9m5d3a6cpduqwzgmgnqjh';

  try {
    console.log('🔍 Fetching wallet balances...');
    console.log(`Wallet: ${walletAddress}`);

    const balances: WalletBalances = await fetchWalletBalances(
      gatewayApi,
      walletAddress
    );

    console.log('\n💰 FUNGIBLE TOKEN BALANCES:');
    console.log('='.repeat(50));

    const fungibleEntries = Object.entries(balances.fungible);
    if (fungibleEntries.length === 0) {
      console.log('No fungible tokens found');
    } else {
      fungibleEntries.forEach(
        ([address, balance]: [string, FungibleBalance], index) => {
          console.log(`${index + 1}. ${address}`);
          console.log(`   Amount: ${balance.amount}`);
          console.log('');
        }
      );
    }

    console.log('\n🎨 NFT COLLECTIONS:');
    console.log('='.repeat(50));

    const nftEntries = Object.entries(balances.nonFungible);
    if (nftEntries.length === 0) {
      console.log('No NFT collections found');
    } else {
      nftEntries.forEach(
        ([address, collection]: [string, NonFungibleBalance], index) => {
          console.log(`${index + 1}. ${address}`);
          console.log(`   Items: ${collection.ids.length}`);

          // Show first few NFT IDs as example
          const sampleIds = collection.ids.slice(0, 3);
          console.log(
            `   Sample IDs: ${sampleIds.join(', ')}${collection.ids.length > 3 ? '...' : ''}`
          );
          console.log('');
        }
      );
    }

    // Summary statistics
    const totalFungibleTokens = Object.keys(balances.fungible).length;
    const totalNFTCollections = Object.keys(balances.nonFungible).length;
    const totalNFTs = Object.values(balances.nonFungible).reduce(
      (sum, collection) => sum + collection.ids.length,
      0
    );

    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Fungible token types: ${totalFungibleTokens}`);
    console.log(`NFT collections: ${totalNFTCollections}`);
    console.log(`Total NFTs: ${totalNFTs}`);

    // Look for specific tokens (example)
    const xrdAddress =
      'resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd';
    if (balances.fungible[xrdAddress]) {
      console.log(`\n💎 XRD Balance: ${balances.fungible[xrdAddress].amount}`);
    }
  } catch (error) {
    console.error('❌ Error fetching wallet balances:', error);
  }
}

// Run the demonstration
demonstrateWalletBalances().catch(console.error);
