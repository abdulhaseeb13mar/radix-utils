# Publishing and Usage Guide

## Publishing to NPM

### Prerequisites

1. Create an NPM account at [npmjs.com](https://www.npmjs.com/)
2. Login to NPM in your terminal: `npm login`

### Before Publishing

1. Update the package name in `package.json` if needed (must be unique on NPM)
2. Set the correct author, repository, and homepage URLs in `package.json`
3. Ensure version follows semantic versioning (start with 1.0.0)

### Publishing Steps

```bash
# 1. Ensure everything builds
npm run build

# 2. Run tests
npm test

# 3. Lint code
npm run lint

# 4. Publish to NPM
npm publish
```

### For Scoped Packages

If you want to publish under your username/organization:

```bash
# Update package.json name to "@yourname/radix-utils"
npm publish --access public
```

## Usage in Other Projects

### Installation

```bash
npm install radix-utils
# or if published as scoped package:
npm install @yourname/radix-utils
```

### Basic Usage

```typescript
import {
  fetchValidatorInfo,
  checkResourceInUsersFungibleAssets,
  BN,
  calculateEstimatedUnlockDate,
} from 'radix-utils';
import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';

const gatewayApi = GatewayApiClient.initialize({
  networkId: 1, // Mainnet
  applicationName: 'Your App',
  applicationVersion: '1.0.0',
});

// Fetch validator info
const validatorInfo = await fetchValidatorInfo(gatewayApi, 'validator_rdx1...');

// Work with high-precision decimals
const amount = BN('1000.123456789');
const doubled = amount.mul(2);
```

## Version Management

### Updating Versions

Use semantic versioning:

- **Patch** (1.0.1): Bug fixes
- **Minor** (1.1.0): New features, backward compatible
- **Major** (2.0.0): Breaking changes

```bash
npm version patch   # 1.0.0 -> 1.0.1
npm version minor   # 1.0.0 -> 1.1.0
npm version major   # 1.0.0 -> 2.0.0
```

### Publishing Updates

```bash
npm version patch
npm publish
```

## Adding New Utilities

### 1. Create New Module

```bash
# Example: Adding staking utilities
mkdir src/staking
touch src/staking/index.ts
```

### 2. Implement Function

```typescript
// src/staking/index.ts
export const calculateStakingRewards = (
  amount: string,
  rate: string,
  duration: number
): string => {
  // Implementation
};
```

### 3. Add Types (if needed)

```typescript
// src/types/index.ts
export interface StakingReward {
  amount: string;
  epoch: number;
}
```

### 4. Export from Main Index

```typescript
// src/index.ts
export { calculateStakingRewards } from './staking';
export type { StakingReward } from './types';
```

### 5. Add Tests

```typescript
// src/__tests__/staking.test.ts
import { calculateStakingRewards } from '../staking';

describe('Staking utilities', () => {
  it('should calculate rewards correctly', () => {
    // Test implementation
  });
});
```

### 6. Update Documentation

Update README.md with new function documentation.

## Best Practices

### Function Design

- Keep functions pure when possible
- Use TypeScript types extensively
- Handle errors gracefully
- Add comprehensive JSDoc comments

### Testing

- Write tests for all public functions
- Test edge cases and error conditions
- Maintain high test coverage

### Documentation

- Update README.md for all new features
- Include code examples
- Document all parameters and return types

## Package Structure

```
radix-utils/
├── src/
│   ├── types/          # TypeScript type definitions
│   ├── validators/     # Validator-related utilities
│   ├── utils/          # General utility functions
│   ├── staking/        # Staking utilities (example)
│   └── index.ts        # Main export file
├── examples/           # Usage examples
├── dist/              # Compiled JavaScript (auto-generated)
└── package.json       # NPM configuration
```

This structure makes it easy to:

- Add new categories of utilities
- Maintain clean separation of concerns
- Enable tree-shaking for consumers
- Keep the codebase organized as it grows
