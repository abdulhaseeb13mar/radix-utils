import {
  fetchValidatorInfo,
  checkResourceInUsersFungibleAssets,
  BN,
} from 'radix-utils';
import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';

// Example: Basic validator information fetching
async function exampleValidatorInfo() {
  // Initialize Gateway API client
  const gatewayApi = GatewayApiClient.initialize({
    networkId: 1, // Mainnet
    applicationName: 'Radix Utils Example',
    applicationVersion: '1.0.0',
  });

  const validatorAddress =
    'validator_rdx1sd5368vqdmjk0y2w7ymdts02cz9c52858gpyny56xdvzuheepdeyy0';

  try {
    console.log('Fetching validator information...');
    const validatorInfo = await fetchValidatorInfo(
      gatewayApi,
      validatorAddress
    );

    if (validatorInfo) {
      console.log('✅ Validator Information:');
      console.log(`  Address: ${validatorInfo.validatorAddress}`);
      console.log(`  Total Staked XRD: ${validatorInfo.totalStakedXrds}`);
      console.log(`  Current Fee: ${validatorInfo.fees.current}`);
      console.log(`  Epoch: ${validatorInfo.epoch}`);
      console.log(`  Unlocked LSUs: ${validatorInfo.unlockedLSUs}`);

      if (validatorInfo.fees.alert) {
        console.log(`  🚨 Fee Alert: ${validatorInfo.fees.alert}`);
      }

      console.log('  Metadata:');
      Object.entries(validatorInfo.metadata).forEach(([key, value]) => {
        console.log(`    ${key}: ${value}`);
      });
    } else {
      console.log('❌ Validator not found or invalid address');
    }
  } catch (error) {
    console.error('Error fetching validator info:', error);
  }
}

// Example: Check resource balances across multiple accounts
async function exampleResourceCheck() {
  const gatewayApi = GatewayApiClient.initialize({
    networkId: 1,
    applicationName: 'Radix Utils Example',
    applicationVersion: '1.0.0',
  });

  const accounts = [
    'account_rdx16yf5jxxpdtcf4afpj5ddeuazp2evep7quqzrs3hmk63gwn4ksxfqyz',
    'account_rdx16x0u3j2x3pw3w0jr0p7lzdvk07xuv23x64w9rarf9drn4736ttxf4u',
  ];

  // XRD resource address
  const xrdResourceAddress =
    'resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd';

  try {
    console.log('Checking XRD balances across accounts...');
    const result = await checkResourceInUsersFungibleAssets(
      accounts,
      xrdResourceAddress,
      gatewayApi
    );

    console.log('✅ Resource Check Results:');
    console.log(`  Total XRD Amount: ${result.totalAmount}`);
    console.log('  Account Balances:');

    Object.entries(result.usersWithResourceAmount).forEach(
      ([address, amount]) => {
        console.log(`    ${address.substring(0, 20)}...: ${amount} XRD`);
      }
    );
  } catch (error) {
    console.error('Error checking resource balances:', error);
  }
}

// Example: Working with Decimal operations
function exampleDecimalOperations() {
  console.log('Working with high-precision decimals...');

  const amount1 = BN('1000.123456789012345678901234567890');
  const amount2 = BN('500.987654321098765432109876543210');

  const sum = amount1.plus(amount2);
  const difference = amount1.minus(amount2);
  const product = amount1.mul(amount2);
  const quotient = amount1.div(amount2);

  console.log('✅ Decimal Operations:');
  console.log(`  Amount 1: ${amount1.toString()}`);
  console.log(`  Amount 2: ${amount2.toString()}`);
  console.log(`  Sum: ${sum.toString()}`);
  console.log(`  Difference: ${difference.toString()}`);
  console.log(`  Product: ${product.toString()}`);
  console.log(`  Quotient: ${quotient.toString()}`);

  // Check if amount is greater than threshold
  const threshold = BN('1000');
  if (amount1.greaterThan(threshold)) {
    console.log(`  ✅ Amount 1 is greater than ${threshold.toString()}`);
  }
}

// Run examples
async function runExamples() {
  console.log('🚀 Radix Utils Examples\n');

  // Example 1: Decimal operations (no API calls needed)
  exampleDecimalOperations();
  console.log('\n' + '='.repeat(50) + '\n');

  // Example 2: Validator information (requires API call)
  await exampleValidatorInfo();
  console.log('\n' + '='.repeat(50) + '\n');

  // Example 3: Resource checking (requires API call)
  await exampleResourceCheck();
}

// Execute if running directly
if (require.main === module) {
  runExamples().catch(console.error);
}

export { exampleValidatorInfo, exampleResourceCheck, exampleDecimalOperations };
