import {
  GatewayApiClient,
  FungibleResourcesCollectionItem,
  NonFungibleResourcesCollectionItem,
  StateEntityFungiblesPageResponse,
  StateEntityNonFungiblesPageResponse,
  LedgerStateSelector,
} from '@radixdlt/babylon-gateway-api-sdk';
import {
  WalletBalances,
  FungibleBalances,
  NonFungibleBalances,
} from '../types';

/**
 * Fetch all fungible resources for a wallet address with pagination
 * @param gatewayApi - Gateway API client instance
 * @param walletAddress - The wallet address to fetch fungibles for
 * @param ledgerState - Optional ledger state selector
 * @returns Array of all fungible resource collection items
 */
const fetchAllFungibles = async (
  gatewayApi: GatewayApiClient,
  walletAddress: string,
  ledgerState?: LedgerStateSelector
): Promise<FungibleResourcesCollectionItem[]> => {
  let allFungibleItems: FungibleResourcesCollectionItem[] = [];
  let nextCursor: string | null | undefined = undefined;
  let response: StateEntityFungiblesPageResponse;
  let stateVersion: number | undefined = undefined;

  do {
    response = await gatewayApi.state.innerClient.entityFungiblesPage({
      stateEntityFungiblesPageRequest: {
        address: walletAddress,
        cursor: nextCursor || undefined,
        aggregation_level: 'Global',
        at_ledger_state:
          ledgerState ||
          (stateVersion ? { state_version: stateVersion } : undefined),
      },
    });

    allFungibleItems = allFungibleItems.concat(response.items);
    nextCursor = response.next_cursor;
    stateVersion = response.ledger_state.state_version;
  } while (nextCursor);

  return allFungibleItems;
};

/**
 * Fetch all non-fungible resources for a wallet address with pagination
 * @param gatewayApi - Gateway API client instance
 * @param walletAddress - The wallet address to fetch non-fungibles for
 * @param ledgerState - Optional ledger state selector
 * @returns Array of all non-fungible resource collection items
 */
const fetchAllNonFungibles = async (
  gatewayApi: GatewayApiClient,
  walletAddress: string,
  ledgerState?: LedgerStateSelector
): Promise<NonFungibleResourcesCollectionItem[]> => {
  let allNonFungibleItems: NonFungibleResourcesCollectionItem[] = [];
  let nextCursor: string | null | undefined = undefined;
  let response: StateEntityNonFungiblesPageResponse;
  let stateVersion: number | undefined = undefined;

  do {
    response = await gatewayApi.state.innerClient.entityNonFungiblesPage({
      stateEntityNonFungiblesPageRequest: {
        address: walletAddress,
        cursor: nextCursor || undefined,
        aggregation_level: 'Vault',
        opt_ins: { non_fungible_include_nfids: true },
        at_ledger_state:
          ledgerState ||
          (stateVersion ? { state_version: stateVersion } : undefined),
      },
    });

    allNonFungibleItems = allNonFungibleItems.concat(response.items);
    nextCursor = response.next_cursor;
    stateVersion = response.ledger_state.state_version;
  } while (nextCursor);

  return allNonFungibleItems;
};

/**
 * Fetch complete wallet balances including fungible and non-fungible tokens
 * @param gatewayApi - Gateway API client instance
 * @param walletAddress - The wallet address to fetch balances for
 * @param ledgerState - Optional ledger state selector for historical data
 * @returns Complete wallet balance information
 */
export const fetchWalletBalances = async (
  gatewayApi: GatewayApiClient,
  walletAddress: string,
  ledgerState?: LedgerStateSelector
): Promise<WalletBalances> => {
  try {
    // Fetch both fungible and non-fungible resources in parallel
    const [fungibleBalances, nonFungibleBalances] = await Promise.all([
      fetchAllFungibles(gatewayApi, walletAddress, ledgerState),
      fetchAllNonFungibles(gatewayApi, walletAddress, ledgerState),
    ]);

    // Format fungible balances
    const formattedFungibleBalances: FungibleBalances = {};
    fungibleBalances.forEach((balance) => {
      if (balance.aggregation_level === 'Global') {
        const amount = balance.amount;
        const tokenAddress = balance.resource_address;
        if (+amount > 0) {
          formattedFungibleBalances[tokenAddress] = { tokenAddress, amount };
        }
      }
    });

    // Format non-fungible balances
    const formattedNonFungibleBalances: NonFungibleBalances = {};
    nonFungibleBalances.forEach((item) => {
      if (item.aggregation_level === 'Vault' && 'vaults' in item) {
        const collectionAddress = item.resource_address;
        const vault = item.vaults.items[0];
        if (vault && 'items' in vault) {
          const ids = vault.items;
          if (ids && ids.length > 0) {
            formattedNonFungibleBalances[collectionAddress] = {
              collectionAddress,
              ids,
            };
          }
        }
      }
    });

    return {
      fungible: formattedFungibleBalances,
      nonFungible: formattedNonFungibleBalances,
    };
  } catch (error) {
    console.error('Error in fetchWalletBalances:', error);
    throw error;
  }
};
