import {
  fetchValidatorInfo,
  fetchWalletBalances,
  BN,
  type ValidatorInfo,
  type WalletBalances,
} from 'radix-utils';
import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';

async function main() {
  // Initialize the Gateway API
  const gatewayApi = GatewayApiClient.initialize({
    networkId: 1, // Mainnet
    applicationName: 'My Radix App',
    applicationVersion: '1.0.0',
  });

  // Example validator address (replace with real one)
  const validatorAddress =
    'validator_rdx1sd5368vqdmjk0y2w7ymdts02cz9c52858gpyny56xdvzuheepdeyy0';

  try {
    console.log('Fetching validator information...');

    const validatorInfo: ValidatorInfo | undefined = await fetchValidatorInfo(
      gatewayApi,
      validatorAddress
    );

    if (validatorInfo) {
      console.log('Validator Info Retrieved:');
      console.log(`- Address: ${validatorInfo.validatorAddress}`);
      console.log(`- Total Staked XRD: ${validatorInfo.totalStakedXrds}`);
      console.log(`- Current Fee: ${validatorInfo.fees.current}`);
      console.log(`- Epoch: ${validatorInfo.epoch}`);

      // Working with decimal amounts
      const stakedAmount = BN(validatorInfo.totalStakedXrds);
      const minimumStake = BN('1000');

      if (stakedAmount.greaterThan(minimumStake)) {
        console.log('✅ Validator meets minimum stake requirement');
      }

      // Calculate percentage of total stake that's unlocked
      const unlockedAmount = BN(validatorInfo.unlockedLSUs);
      const totalStake = BN(validatorInfo.totalStakedXrds);

      if (totalStake.greaterThan(0)) {
        const unlockedPercentage = unlockedAmount
          .div(totalStake)
          .mul(100)
          .toFixed(2);
        console.log(`Unlocked percentage: ${unlockedPercentage}%`);
      }
    } else {
      console.log('❌ Validator not found or invalid address');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);
