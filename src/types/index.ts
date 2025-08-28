/**
 * Represents a single unlocking reward entry
 */
export interface UnlockingReward {
  epoch_unlocked: number;
  stake_unit_amount: string;
}

/**
 * Array of unlocking rewards
 */
export type UnlockingRewards = UnlockingReward[];

/**
 * New fee factor configuration
 */
export interface NewFeeFactor {
  new_fee_factor: string;
  epoch_effective: number;
}

/**
 * Fee factor information with current and pending changes
 */
export interface FeeFactor {
  aboutToChange: NewFeeFactor | null;
  current: string;
  alert: string;
}

/**
 * Validator vault addresses
 */
export interface ValidatorVaults {
  NODE_CURRENTLY_EARNED_LSU_VAULT_ADDRESS: string;
  NODE_OWNER_UNLOCKING_LSU_VAULT_ADDRESS: string;
  NODE_TOTAL_STAKED_XRD_VAULT_ADDRESS: string;
  NODE_UNSTAKING_XRD_VAULT_ADDRESS: string;
}

/**
 * Complete validator information
 */
export interface ValidatorInfo {
  currentlyEarnedLockedLSUs: string;
  ownerLSUsInUnlockingProcess: string;
  totalStakedXrds: string;
  totalXrdsLeavingOurNode: string;
  unlockingLSUsBreakdown: UnlockingRewards;
  epoch: number;
  unlockedLSUs: string;
  metadata: Record<string, string>;
  stakeUnitAddress: string;
  vaults: ValidatorVaults;
  validatorAddress: string;
  fees: FeeFactor;
}

/**
 * Resource check result
 */
export interface ResourceCheckResult {
  usersWithResourceAmount: Record<string, string>;
  totalAmount: string;
}

/**
 * Ledger state version information
 */
export interface LedgerStateVersion {
  epoch: number;
  network: string;
  proposer_round_timestamp: string;
  round: number;
  state_version: number;
}

/**
 * Fungible token balance information
 */
export interface FungibleBalance {
  tokenAddress: string;
  amount: string;
}

/**
 * Non-fungible token collection information
 */
export interface NonFungibleBalance {
  collectionAddress: string;
  ids: string[];
}

/**
 * Map of fungible balances by token address
 */
export type FungibleBalances = Record<string, FungibleBalance>;

/**
 * Map of non-fungible balances by collection address
 */
export type NonFungibleBalances = Record<string, NonFungibleBalance>;

/**
 * Complete wallet balance information
 */
export interface WalletBalances {
  fungible: FungibleBalances;
  nonFungible: NonFungibleBalances;
}
