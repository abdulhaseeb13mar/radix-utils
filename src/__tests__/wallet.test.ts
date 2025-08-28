import { fetchWalletBalances } from '../utils/wallet';

describe('Wallet Utils', () => {
  const mockEntityFungiblesPage = jest.fn();
  const mockEntityNonFungiblesPage = jest.fn();

  const mockGatewayApi = {
    state: {
      innerClient: {
        entityFungiblesPage: mockEntityFungiblesPage,
        entityNonFungiblesPage: mockEntityNonFungiblesPage,
      },
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchWalletBalances', () => {
    it('should fetch and format wallet balances correctly', async () => {
      // Mock fungible response
      const mockFungibleResponse = {
        items: [
          {
            aggregation_level: 'Global',
            resource_address: 'resource_rdx123...',
            amount: '1000.5',
          },
          {
            aggregation_level: 'Global',
            resource_address: 'resource_rdx456...',
            amount: '0', // Should be filtered out
          },
        ],
        next_cursor: null,
        ledger_state: { state_version: 12345 },
      };

      // Mock non-fungible response
      const mockNonFungibleResponse = {
        items: [
          {
            aggregation_level: 'Vault',
            resource_address: 'nft_rdx789...',
            vaults: {
              items: [
                {
                  items: ['#1#', '#2#', '#3#'],
                },
              ],
            },
          },
        ],
        next_cursor: null,
        ledger_state: { state_version: 12345 },
      };

      mockEntityFungiblesPage.mockResolvedValue(mockFungibleResponse);
      mockEntityNonFungiblesPage.mockResolvedValue(mockNonFungibleResponse);

      const result = await fetchWalletBalances(
        mockGatewayApi,
        'account_rdx123...'
      );

      expect(result).toEqual({
        fungible: {
          'resource_rdx123...': {
            tokenAddress: 'resource_rdx123...',
            amount: '1000.5',
          },
        },
        nonFungible: {
          'nft_rdx789...': {
            collectionAddress: 'nft_rdx789...',
            ids: ['#1#', '#2#', '#3#'],
          },
        },
      });
    });

    it('should handle empty balances', async () => {
      const mockEmptyResponse = {
        items: [],
        next_cursor: null,
        ledger_state: { state_version: 12345 },
      };

      mockEntityFungiblesPage.mockResolvedValue(mockEmptyResponse);
      mockEntityNonFungiblesPage.mockResolvedValue(mockEmptyResponse);

      const result = await fetchWalletBalances(
        mockGatewayApi,
        'account_rdx123...'
      );

      expect(result).toEqual({
        fungible: {},
        nonFungible: {},
      });
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Gateway API Error');
      mockEntityFungiblesPage.mockRejectedValue(mockError);

      await expect(
        fetchWalletBalances(mockGatewayApi, 'account_rdx123...')
      ).rejects.toThrow('Gateway API Error');
    });
  });
});
