# Radix Utils

A comprehensive utility library for Radix DLT blockchain development, providing helper functions for working with validators, staking, and various Radix-specific operations.

## Installation

```bash
npm install radix-utils
```

## Features

- **Validator Information**: Fetch comprehensive validator data including staking amounts, fees, and vault information
- **Resource Checking**: Check fungible resource balances across multiple accounts
- **Fee Calculations**: Compute validator fee factors with pending changes
- **Date Utilities**: Calculate unlock dates based on epoch information
- **Decimal Operations**: Radix-specific decimal operations with proper precision
- **TypeScript Support**: Full TypeScript definitions included

## Quick Start

```typescript
import { fetchValidatorInfo, BN, GatewayApiClient } from 'radix-utils';

// Initialize the Gateway API client
const gatewayApi = GatewayApiClient.initialize({
  networkId: 1, // Mainnet
  applicationName: 'Your App Name',
  applicationVersion: '1.0.0',
});

// Fetch validator information
const validatorAddress = 'validator_rdx1sd...';
const validatorInfo = await fetchValidatorInfo(gatewayApi, validatorAddress);

if (validatorInfo) {
  console.log('Total Staked XRD:', validatorInfo.totalStakedXrds);
  console.log('Current Fee:', validatorInfo.fees.current);
  console.log('Validator Metadata:', validatorInfo.metadata);
}
```

## API Reference

### Validator Functions

#### `fetchValidatorInfo(gatewayApi, validatorAddress)`

Fetches comprehensive information about a validator.

**Parameters:**

- `gatewayApi`: GatewayApiClient instance
- `validatorAddress`: String - The validator address (must start with 'validator\_')

**Returns:** `Promise<ValidatorInfo | undefined>`

**Example:**

```typescript
const info = await fetchValidatorInfo(gatewayApi, 'validator_rdx1sd...');
console.log(info?.totalStakedXrds);
```

#### `checkResourceInUsersFungibleAssets(usersAddresses, fungibleResourceToCheck, gatewayApi, ledgerState?)`

Checks if a specific fungible resource exists in users' accounts.

**Parameters:**

- `usersAddresses`: String[] - Array of account addresses to check
- `fungibleResourceToCheck`: String - Resource address to look for
- `gatewayApi`: GatewayApiClient instance
- `ledgerState?`: LedgerStateSelector (optional)

**Returns:** `Promise<ResourceCheckResult>`

**Example:**

```typescript
const result = await checkResourceInUsersFungibleAssets(
  ['account_rdx1...', 'account_rdx2...'],
  'resource_rdx1...',
  gatewayApi
);
console.log('Total Amount:', result.totalAmount);
console.log('Users with Resource:', result.usersWithResourceAmount);
```

#### `computeValidatorFeeFactor(currentFeeFactor, newFeeFactor, currentEpoch)`

Computes validator fee factor information including pending changes.

**Parameters:**

- `currentFeeFactor`: String - Current fee factor as decimal string
- `newFeeFactor`: NewFeeFactor | null - New fee factor configuration
- `currentEpoch`: Number - Current epoch number

**Returns:** `FeeFactor`

#### `fetchWalletBalances(gatewayApi, walletAddress, ledgerState?)`

Fetches complete wallet balances including both fungible and non-fungible tokens with automatic pagination.

**Parameters:**

- `gatewayApi`: GatewayApiClient instance
- `walletAddress`: String - The wallet address to fetch balances for
- `ledgerState?`: LedgerStateSelector (optional) - For historical data

**Returns:** `Promise<WalletBalances>`

**Example:**

```typescript
const balances = await fetchWalletBalances(gatewayApi, 'account_rdx1...');

// Access fungible token balances
Object.entries(balances.fungible).forEach(([address, balance]) => {
  console.log(`Token ${address}: ${balance.amount}`);
});

// Access NFT collections
Object.entries(balances.nonFungible).forEach(([address, collection]) => {
  console.log(`NFT Collection ${address}: ${collection.ids.length} items`);
});
```

### Utility Functions

#### `BN(value)`

Creates a new Decimal instance with Radix-specific precision configuration.

**Parameters:**

- `value`: String | Number - Value to convert to Decimal

**Returns:** `Decimal`

**Example:**

```typescript
const amount = BN('1000.123456789');
const result = amount.plus('500.987654321');
console.log(result.toString());
```

#### `calculateEstimatedUnlockDate(epochUnlocked, currentEpoch)`

Calculates the estimated unlock date based on epoch information.

**Parameters:**

- `epochUnlocked`: Number - Epoch when stake will be unlocked
- `currentEpoch`: Number - Current epoch number

**Returns:** `String` - Formatted date string

**Example:**

```typescript
const unlockDate = calculateEstimatedUnlockDate(1500, 1400);
console.log('Estimated unlock:', unlockDate);
```

#### `retryPromiseAll(promises, retries?, delay?)`

Executes Promise.all with retry logic and exponential backoff.

**Parameters:**

- `promises`: Promise<T>[] - Array of promises to execute
- `retries?`: Number (default: 3) - Number of retry attempts
- `delay?`: Number (default: 1000) - Initial delay in milliseconds

**Returns:** `Promise<T[]>`

### Transaction Functions

#### `getEventFromTransaction(gatewayApi, txId, eventName)`

Extracts a specific event from a transaction's detailed events.

**Parameters:**

- `gatewayApi`: GatewayApiClient instance
- `txId`: String - Transaction intent hash
- `eventName`: String - Name of the event to extract

**Returns:** `Promise<DetailedEventsItem>`

**Example:**

```typescript
const event = await getEventFromTransaction(
  gatewayApi,
  'txid_rdx1...',
  'WithdrawEvent'
);
console.log('Event data:', event);
```

#### `getEventKeyValuesFromTransaction(gatewayApi, txId, eventName)`

Extracts key-value pairs from a specific event in a transaction.

**Parameters:**

- `gatewayApi`: GatewayApiClient instance
- `txId`: String - Transaction intent hash
- `eventName`: String - Name of the event to extract

**Returns:** `Promise<Record<string, string>>`

**Example:**

```typescript
const keyValues = await getEventKeyValuesFromTransaction(
  gatewayApi,
  'txid_rdx1...',
  'TransferEvent'
);
console.log('Amount:', keyValues.amount);
console.log('Recipient:', keyValues.recipient);
```

#### `extractValuesFromTxEvent(event)`

Extracts key-value pairs from a transaction event's fields.

**Parameters:**

- `event`: DetailedEventsItem - The event object to extract values from

**Returns:** `Record<string, string>`

**Example:**

```typescript
const event = await getEventFromTransaction(gatewayApi, txId, 'MyEvent');
const values = extractValuesFromTxEvent(event);
console.log('Extracted values:', values);
```

## TypeScript Types

The library exports comprehensive TypeScript types:

```typescript
import type {
  ValidatorInfo,
  ValidatorVaults,
  UnlockingRewards,
  FeeFactor,
  ResourceCheckResult,
  WalletBalances,
  FungibleBalances,
  NonFungibleBalances,
} from 'radix-utils';
```

### Key Types

- **ValidatorInfo**: Complete validator information including staking data, fees, and metadata
- **ValidatorVaults**: Validator vault addresses
- **UnlockingRewards**: Array of unlocking reward entries
- **FeeFactor**: Fee factor information with current and pending changes
- **ResourceCheckResult**: Result of resource balance checks
- **WalletBalances**: Complete wallet balance information with fungible and non-fungible tokens
- **FungibleBalances**: Map of fungible token balances by address
- **NonFungibleBalances**: Map of NFT collections by address

## Contributing

Contributions are welcome! This library is designed to be easily extensible. To add new utility functions:

1. Create new files in the appropriate directory (`src/validators/`, `src/utils/`, etc.)
2. Export your functions from the relevant index files
3. Add comprehensive TypeScript types in `src/types/`
4. Update the main `src/index.ts` to export your new functions
5. Add tests for your new functionality
6. Update this README with documentation

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd radix-utils

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

### Project Structure

```
src/
├── types/          # TypeScript type definitions
├── validators/     # Validator-related utilities
├── utils/          # General utility functions
└── index.ts        # Main export file
```

## Dependencies

- `@radixdlt/babylon-gateway-api-sdk`: Radix Gateway API SDK
- `decimal.js`: Arbitrary precision decimal calculations

## License

MIT License - see LICENSE file for details.

## Support

For issues and feature requests, please use the GitHub issue tracker.

## Changelog

### 1.2.0

- Added transaction event handling utilities
- Added `getEventFromTransaction` function for extracting specific events from transactions
- Added `getEventKeyValuesFromTransaction` function for simplified key-value extraction
- Added `extractValuesFromTxEvent` function for parsing event field data
- Added comprehensive test coverage for transaction functionality
- Updated documentation with transaction utility examples

### 1.1.0

- Added `fetchWalletBalances` function for comprehensive wallet balance fetching
- Added support for both fungible and non-fungible token balance retrieval
- Added automatic pagination support for large wallets
- Added new TypeScript types: `WalletBalances`, `FungibleBalances`, `NonFungibleBalances`
- Added comprehensive test coverage for wallet functionality
- Updated documentation with wallet balance examples

### 1.0.0

- Initial release
- Added `fetchValidatorInfo` function
- Added `checkResourceInUsersFungibleAssets` function
- Added `computeValidatorFeeFactor` function
- Added decimal and date utilities
- Full TypeScript support
