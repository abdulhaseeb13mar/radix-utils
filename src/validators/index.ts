import {
  GatewayApiClient,
  EntityMetadataCollection,
  LedgerStateSelector,
} from '@radixdlt/babylon-gateway-api-sdk';
import { BN, retryPromiseAll } from '../utils/decimal';
import { calculateEstimatedUnlockDate } from '../utils/date';
import {
  ValidatorInfo,
  ValidatorVaults,
  UnlockingRewards,
  NewFeeFactor,
  FeeFactor,
  ResourceCheckResult,
  UnstakeClaimNFTData,
} from '../types';
import { chunkArray } from '../utils/misc';

/**
 * Extract metadata from EntityMetadataCollection
 * @param metadata - The metadata collection to extract from
 * @returns Extracted metadata as key-value pairs
 */
const extractMetadata = (
  metadata: EntityMetadataCollection
): Record<string, string> => {
  const extractedMetadata: Record<string, string> = {};
  metadata.items.forEach((item) => {
    const valueType = item.value.typed.type;
    if (
      valueType === 'String' ||
      valueType === 'Url' ||
      valueType === 'GlobalAddress' ||
      valueType === 'NonFungibleLocalId'
    ) {
      extractedMetadata[item.key] = item.value.typed.value;
    }
  });
  return extractedMetadata;
};

/**
 * Extract vault addresses from validator state
 * @param state - The validator state object
 * @returns Validator vault addresses
 */
const extractVaultsAddresses = (state: object): ValidatorVaults => {
  let NODE_CURRENTLY_EARNED_LSU_VAULT_ADDRESS = '';
  let NODE_OWNER_UNLOCKING_LSU_VAULT_ADDRESS = '';
  let NODE_TOTAL_STAKED_XRD_VAULT_ADDRESS = '';
  let NODE_UNSTAKING_XRD_VAULT_ADDRESS = '';

  if ('stake_xrd_vault' in state) {
    NODE_TOTAL_STAKED_XRD_VAULT_ADDRESS = (
      state.stake_xrd_vault as { entity_address: string }
    ).entity_address;
  }
  if ('pending_xrd_withdraw_vault' in state) {
    NODE_UNSTAKING_XRD_VAULT_ADDRESS = (
      state.pending_xrd_withdraw_vault as { entity_address: string }
    ).entity_address;
  }
  if ('locked_owner_stake_unit_vault' in state) {
    NODE_CURRENTLY_EARNED_LSU_VAULT_ADDRESS = (
      state.locked_owner_stake_unit_vault as { entity_address: string }
    ).entity_address;
  }
  if ('pending_owner_stake_unit_unlock_vault' in state) {
    NODE_OWNER_UNLOCKING_LSU_VAULT_ADDRESS = (
      state.pending_owner_stake_unit_unlock_vault as { entity_address: string }
    ).entity_address;
  }

  return {
    NODE_CURRENTLY_EARNED_LSU_VAULT_ADDRESS,
    NODE_OWNER_UNLOCKING_LSU_VAULT_ADDRESS,
    NODE_TOTAL_STAKED_XRD_VAULT_ADDRESS,
    NODE_UNSTAKING_XRD_VAULT_ADDRESS,
  };
};

/**
 * Filter pending withdrawals and separate unlocked LSUs
 * @param pendingWithdrawals - Array of pending withdrawals
 * @param currentEpoch - Current epoch number
 * @returns Filtered withdrawals and unlocked amounts
 */
const filterPendingWithdrawalsFromUnlockedLSUs = (
  pendingWithdrawals: UnlockingRewards,
  currentEpoch: number
) => {
  let unlockedLSUsAmount = BN(0);
  let lsuInUnlockingProcess = BN(0);

  const filteredWithdrawals = pendingWithdrawals.filter((withdrawal) => {
    const isUnlocked = withdrawal.epoch_unlocked <= currentEpoch;
    if (isUnlocked) {
      unlockedLSUsAmount = unlockedLSUsAmount.add(withdrawal.stake_unit_amount);
    } else {
      lsuInUnlockingProcess = lsuInUnlockingProcess.add(
        withdrawal.stake_unit_amount
      );
    }
    return !isUnlocked;
  });

  return {
    filteredWithdrawals,
    unlockedLSUsAmount,
    lsuInUnlockingProcess,
  };
};

/**
 * Compute validator fee factor information
 * @param currentFeeFactor - Current fee factor as string
 * @param newFeeFactor - New fee factor configuration (if any)
 * @param currentEpoch - Current epoch number
 * @returns Fee factor information
 */
export const computeValidatorFeeFactor = (
  currentFeeFactor: string,
  newFeeFactor: NewFeeFactor | null,
  currentEpoch: number
): FeeFactor => {
  const feeFactor: FeeFactor = {
    aboutToChange: null,
    current: (+currentFeeFactor * 100).toFixed(2) + '%',
    alert: '',
  };

  if (newFeeFactor) {
    const newFactorPercentage =
      (+newFeeFactor.new_fee_factor * 100).toFixed(2) + '%';

    if (newFeeFactor.epoch_effective <= currentEpoch) {
      feeFactor.current = newFactorPercentage;
      feeFactor.aboutToChange = null;
    } else {
      feeFactor.aboutToChange = {
        new_fee_factor: newFactorPercentage,
        epoch_effective: newFeeFactor.epoch_effective,
      };
      feeFactor.alert = `Fee will be changed to ${newFactorPercentage} on ${calculateEstimatedUnlockDate(
        newFeeFactor.epoch_effective,
        currentEpoch
      )}`;
    }
  }

  return feeFactor;
};

/**
 * Check if a resource exists in users' fungible assets
 * @param usersAddresses - Array of user addresses to check
 * @param fungibleResourceToCheck - Resource address to check for
 * @param gatewayApi - Gateway API client instance
 * @param ledgerState - Optional ledger state selector
 * @returns Resource check result with users and total amount
 */
export const checkResourceInUsersFungibleAssets = async (
  usersAddresses: string[],
  fungibleResourceToCheck: string,
  gatewayApi: GatewayApiClient,
  ledgerState?: LedgerStateSelector
): Promise<ResourceCheckResult> => {
  try {
    const allPromises = usersAddresses.map((address) =>
      gatewayApi.state.innerClient.entityFungibleResourceVaultPage({
        stateEntityFungibleResourceVaultsPageRequest: {
          address,
          resource_address: fungibleResourceToCheck,
          at_ledger_state: ledgerState,
        },
      })
    );

    const allResponses = (await retryPromiseAll(allPromises)).flat();
    let totalAmount = BN(0);
    const usersWithResourceAmount: Record<string, string> = {};

    allResponses.forEach((res) => {
      res.items.forEach((vault) => {
        if (BN(vault.amount).greaterThan(0)) {
          usersWithResourceAmount[res.address] = vault.amount;
          totalAmount = totalAmount.plus(vault.amount);
        }
      });
    });

    return {
      usersWithResourceAmount,
      totalAmount: totalAmount.toString(),
    };
  } catch (error) {
    console.error('Error in checkResourceInUsersFungibleAssets', error);
    throw error;
  }
};

/**
 * Fetch comprehensive validator information
 * @param gatewayApi - Gateway API client instance
 * @param validatorAddress - Validator address to fetch info for
 * @returns Validator information or undefined if not found/invalid
 */
export const fetchValidatorInfo = async (
  gatewayApi: GatewayApiClient,
  validatorAddress: string
): Promise<ValidatorInfo | undefined> => {
  if (validatorAddress === '' || !validatorAddress.startsWith('validator_')) {
    return undefined;
  }

  try {
    const res = await gatewayApi.state.innerClient.stateEntityDetails({
      stateEntityDetailsRequest: {
        addresses: [validatorAddress],
        aggregation_level: 'Vault',
      },
    });

    const validatorInfo = res.items[0];
    const vaultsBalance: Record<string, string> = {};
    let rewardsInUnlockingProcess: UnlockingRewards = [];
    const epoch = res.ledger_state.epoch;
    let unlockedLSUs = BN(0);
    let ownerLSUsInUnlockingProcess = BN(0);
    let stakeUnitAddress = '';
    let fees: FeeFactor = { alert: '', current: '', aboutToChange: null };

    if (
      validatorInfo?.details?.type === 'Component' &&
      validatorInfo?.details?.state
    ) {
      const metadata = extractMetadata(res.items[0].metadata);
      const validatorState = validatorInfo.details.state;
      const vaults = extractVaultsAddresses(validatorState);

      // Extract vault balances
      validatorInfo?.fungible_resources?.items.forEach((resource) => {
        if (resource.aggregation_level === 'Vault') {
          resource.vaults.items.forEach((vault) => {
            vaultsBalance[vault.vault_address] = vault.amount;
          });
        }
      });

      // Process pending withdrawals
      if ('pending_owner_stake_unit_withdrawals' in validatorState) {
        const {
          filteredWithdrawals,
          unlockedLSUsAmount,
          lsuInUnlockingProcess,
        } = filterPendingWithdrawalsFromUnlockedLSUs(
          validatorState.pending_owner_stake_unit_withdrawals as UnlockingRewards,
          epoch
        );
        rewardsInUnlockingProcess = filteredWithdrawals;
        unlockedLSUs = unlockedLSUs.add(unlockedLSUsAmount);
        ownerLSUsInUnlockingProcess = ownerLSUsInUnlockingProcess.add(
          lsuInUnlockingProcess
        );
      }

      // Add already unlocked amounts
      if ('already_unlocked_owner_stake_unit_amount' in validatorState) {
        unlockedLSUs = unlockedLSUs.add(
          validatorState.already_unlocked_owner_stake_unit_amount as string
        );
      }

      // Get stake unit address
      if ('stake_unit_resource_address' in validatorState) {
        stakeUnitAddress = validatorState.stake_unit_resource_address as string;
      }

      // Compute fees
      if (
        'validator_fee_factor' in validatorState &&
        'validator_fee_change_request' in validatorState
      ) {
        fees = computeValidatorFeeFactor(
          validatorState.validator_fee_factor as string,
          validatorState.validator_fee_change_request as NewFeeFactor,
          epoch
        );
      }

      const info: ValidatorInfo = {
        currentlyEarnedLockedLSUs:
          vaultsBalance[vaults.NODE_CURRENTLY_EARNED_LSU_VAULT_ADDRESS] || '0',
        ownerLSUsInUnlockingProcess: ownerLSUsInUnlockingProcess.toString(),
        totalStakedXrds:
          vaultsBalance[vaults.NODE_TOTAL_STAKED_XRD_VAULT_ADDRESS] || '0',
        totalXrdsLeavingOurNode:
          vaultsBalance[vaults.NODE_UNSTAKING_XRD_VAULT_ADDRESS] || '0',
        unlockingLSUsBreakdown: rewardsInUnlockingProcess,
        epoch,
        unlockedLSUs: unlockedLSUs.toString(),
        metadata,
        stakeUnitAddress,
        vaults,
        validatorAddress,
        fees,
      };

      return info;
    }
  } catch (error) {
    console.error('Error in fetchValidatorInfo', error);
  }

  return undefined;
};

/**
 * Fetches programmatic fields for a set of unstake-claim NFTs and returns them keyed by NFT id.
 *
 * @param gatewayApi - Gateway API client used to fetch non-fungible data.
 * @param claimNFTAddress - Address of the claim NFT resource/collection.
 * @param nftIds - Array of non-fungible ids to fetch.
 * @returns A mapping of non-fungible id to its unstake claim data (includes `nftId`, optional `claim_amount`, and optional `claim_epoch`).
 * @throws Propagates any errors thrown by the gateway API calls (e.g., network or parsing errors).
 */
export const fetchUnstakeCLaimNFTData = async (
  gatewayApi: GatewayApiClient,
  claimNFTAddress: string,
  nftIds: string[]
): Promise<UnstakeClaimNFTData> => {
  try {
    const nftIdsChunks = chunkArray<string>(nftIds, 100);
    const chunkPromises = nftIdsChunks.map((nftIdsChunk) =>
      gatewayApi.state.getNonFungibleData(claimNFTAddress, nftIdsChunk)
    );

    const chunkData = (await Promise.all(chunkPromises)).flat();

    const unstakeClaimNFTsData: UnstakeClaimNFTData = {};

    chunkData.forEach((nftData) => {
      const programmatic_json = nftData.data?.programmatic_json;
      if (programmatic_json?.kind === 'Tuple') {
        const nftEntry = unstakeClaimNFTsData[nftData.non_fungible_id] || {};
        nftEntry.nftId = nftData.non_fungible_id;
        programmatic_json.fields.forEach((field) => {
          if (field.kind === 'Decimal' && field.field_name === 'claim_amount') {
            nftEntry.claim_amount = field.value;
          } else if (
            field.kind === 'U64' &&
            field.field_name === 'claim_epoch'
          ) {
            nftEntry.claim_epoch = field.value;
          }
        });
        unstakeClaimNFTsData[nftData.non_fungible_id] = nftEntry;
      }
    });

    return unstakeClaimNFTsData;
  } catch (error) {
    console.error('Error in fetchUnstakeCLaimNFTData', error);
    throw error;
  }
};
