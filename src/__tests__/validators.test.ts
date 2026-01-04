import { fetchUnstakeCLaimNFTData } from '../validators';
import type { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';

describe('Validator utilities', () => {
  const mockGetNonFungibleData = jest.fn();

  const gatewayApi = {
    state: {
      getNonFungibleData: mockGetNonFungibleData,
    },
  } as unknown as GatewayApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps unstake claim NFT fields into a keyed object', async () => {
    mockGetNonFungibleData.mockResolvedValueOnce([
      {
        non_fungible_id: '#1#',
        data: {
          programmatic_json: {
            kind: 'Tuple',
            fields: [
              { kind: 'Decimal', field_name: 'claim_amount', value: '12.34' },
              { kind: 'U64', field_name: 'claim_epoch', value: '5000' },
            ],
          },
        },
      },
      {
        non_fungible_id: '#2#',
        data: {
          programmatic_json: {
            kind: 'Tuple',
            fields: [
              { kind: 'Decimal', field_name: 'claim_amount', value: '0' },
              { kind: 'U64', field_name: 'claim_epoch', value: '6000' },
            ],
          },
        },
      },
    ]);

    const result = await fetchUnstakeCLaimNFTData(
      gatewayApi,
      'resource_claim',
      ['#1#', '#2#']
    );

    expect(result).toEqual({
      '#1#': { nftId: '#1#', claim_amount: '12.34', claim_epoch: '5000' },
      '#2#': { nftId: '#2#', claim_amount: '0', claim_epoch: '6000' },
    });
    expect(mockGetNonFungibleData).toHaveBeenCalledWith('resource_claim', [
      '#1#',
      '#2#',
    ]);
  });

  it('batches requests in chunks of 100 ids', async () => {
    const nftIds = Array.from({ length: 150 }, (_, i) => `#${i + 1}#`);
    const firstChunk = nftIds.slice(0, 100);
    const secondChunk = nftIds.slice(100);

    mockGetNonFungibleData
      .mockResolvedValueOnce([
        {
          non_fungible_id: firstChunk[0],
          data: {
            programmatic_json: {
              kind: 'Tuple',
              fields: [
                { kind: 'Decimal', field_name: 'claim_amount', value: '1.23' },
                { kind: 'U64', field_name: 'claim_epoch', value: '111' },
              ],
            },
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          non_fungible_id: secondChunk[0],
          data: {
            programmatic_json: {
              kind: 'Tuple',
              fields: [
                { kind: 'Decimal', field_name: 'claim_amount', value: '4.56' },
                { kind: 'U64', field_name: 'claim_epoch', value: '222' },
              ],
            },
          },
        },
      ]);

    const result = await fetchUnstakeCLaimNFTData(
      gatewayApi,
      'resource_claim',
      nftIds
    );

    expect(mockGetNonFungibleData).toHaveBeenCalledTimes(2);
    expect(mockGetNonFungibleData).toHaveBeenNthCalledWith(
      1,
      'resource_claim',
      firstChunk
    );
    expect(mockGetNonFungibleData).toHaveBeenNthCalledWith(
      2,
      'resource_claim',
      secondChunk
    );
    expect(result[firstChunk[0]]).toEqual({
      nftId: firstChunk[0],
      claim_amount: '1.23',
      claim_epoch: '111',
    });
    expect(result[secondChunk[0]]).toEqual({
      nftId: secondChunk[0],
      claim_amount: '4.56',
      claim_epoch: '222',
    });
  });

  it('ignores NFTs without tuple programmatic data', async () => {
    mockGetNonFungibleData.mockResolvedValueOnce([
      {
        non_fungible_id: '#1#',
        data: {
          programmatic_json: {
            kind: 'Enum',
            fields: [],
          },
        },
      },
    ]);

    const result = await fetchUnstakeCLaimNFTData(
      gatewayApi,
      'resource_claim',
      ['#1#']
    );

    expect(result).toEqual({});
  });
});
