import {
  getEventFromTransaction,
  getEventKeyValuesFromTransaction,
  extractValuesFromTxEvent,
} from '../utils/transaction';
import { DetailedEventsItem, GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';

// Create a mock function
const mockTransactionCommittedDetails = jest.fn();

// Mock the GatewayApiClient
const mockGatewayApi = {
  transaction: {
    innerClient: {
      transactionCommittedDetails: mockTransactionCommittedDetails,
    },
  },
} as unknown as GatewayApiClient;

describe('Transaction utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventFromTransaction', () => {
    it('should return the correct event when found', async () => {
      const mockTxDetails = {
        transaction: {
          receipt: {
            detailed_events: [
              {
                identifier: { event: 'TestEvent' },
                payload: { programmatic_json: { fields: [] } },
              },
              {
                identifier: { event: 'OtherEvent' },
                payload: { programmatic_json: { fields: [] } },
              },
            ],
          },
        },
      };

      mockTransactionCommittedDetails.mockResolvedValue(mockTxDetails);

      const result = await getEventFromTransaction(
        mockGatewayApi,
        'test-tx-id',
        'TestEvent'
      );

      expect(result).toEqual({
        identifier: { event: 'TestEvent' },
        payload: { programmatic_json: { fields: [] } },
      });

      expect(mockTransactionCommittedDetails).toHaveBeenCalledWith({
        transactionCommittedDetailsRequest: {
          intent_hash: 'test-tx-id',
          opt_ins: { detailed_events: true },
        },
      });
    });

    it('should throw error when no events found', async () => {
      const mockTxDetails = {
        transaction: {
          receipt: {},
        },
      };

      mockTransactionCommittedDetails.mockResolvedValue(mockTxDetails);

      await expect(
        getEventFromTransaction(mockGatewayApi, 'test-tx-id', 'TestEvent')
      ).rejects.toThrow('No events found in transaction receipt');
    });

    it('should throw error when specific event not found', async () => {
      const mockTxDetails = {
        transaction: {
          receipt: {
            detailed_events: [
              {
                identifier: { event: 'OtherEvent' },
                payload: { programmatic_json: { fields: [] } },
              },
            ],
          },
        },
      };

      mockTransactionCommittedDetails.mockResolvedValue(mockTxDetails);

      await expect(
        getEventFromTransaction(mockGatewayApi, 'test-tx-id', 'TestEvent')
      ).rejects.toThrow("Event 'TestEvent' not found in transaction receipt");
    });
  });

  describe('extractValuesFromTxEvent', () => {
    it('should extract key-value pairs from event fields', () => {
      const mockEvent: DetailedEventsItem = {
        identifier: { event: 'TestEvent' },
        payload: {
          programmatic_json: {
            fields: [
              {
                field_name: 'amount',
                value: '100',
                kind: 'String',
              },
              {
                field_name: 'recipient',
                value: 'account123',
                kind: 'String',
              },
            ],
          },
        },
      } as DetailedEventsItem;

      const result = extractValuesFromTxEvent(mockEvent);

      expect(result).toEqual({
        amount: '100',
        recipient: 'account123',
      });
    });

    it('should return empty object when no fields present', () => {
      const mockEvent: DetailedEventsItem = {
        identifier: { event: 'TestEvent' },
        payload: {
          programmatic_json: {
            fields: undefined,
          },
        },
      } as DetailedEventsItem;

      const result = extractValuesFromTxEvent(mockEvent);

      expect(result).toEqual({});
    });

    it('should handle empty fields array', () => {
      const mockEvent: DetailedEventsItem = {
        identifier: { event: 'TestEvent' },
        payload: {
          programmatic_json: {
            fields: [],
          },
        },
      } as DetailedEventsItem;

      const result = extractValuesFromTxEvent(mockEvent);

      expect(result).toEqual({});
    });
  });

  describe('getEventKeyValuesFromTransaction', () => {
    it('should get event and extract key-value pairs', async () => {
      const mockTxDetails = {
        transaction: {
          receipt: {
            detailed_events: [
              {
                identifier: { event: 'TestEvent' },
                payload: {
                  programmatic_json: {
                    fields: [
                      {
                        field_name: 'amount',
                        value: '100',
                        kind: 'String',
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      };

      mockTransactionCommittedDetails.mockResolvedValue(mockTxDetails);

      const result = await getEventKeyValuesFromTransaction(
        mockGatewayApi,
        'test-tx-id',
        'TestEvent'
      );

      expect(result).toEqual({
        amount: '100',
      });
    });
  });
});
