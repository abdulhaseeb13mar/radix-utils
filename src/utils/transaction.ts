import {
  DetailedEventsItem,
  GatewayApiClient,
} from '@radixdlt/babylon-gateway-api-sdk';

export const getEventFromTransaction = async (
  gatewayApi: GatewayApiClient,
  txId: string,
  eventName: string
) => {
  const txDetails =
    await gatewayApi.transaction.innerClient.transactionCommittedDetails({
      transactionCommittedDetailsRequest: {
        intent_hash: txId,
        opt_ins: { detailed_events: true },
      },
    });

  const allEvents = txDetails.transaction.receipt?.detailed_events;

  if (!allEvents) {
    throw new Error('No events found in transaction receipt');
  }

  const event = allEvents.find((e) => e.identifier.event === eventName);

  if (!event) {
    throw new Error(`Event '${eventName}' not found in transaction receipt`);
  }

  return event;
};

export const getEventKeyValuesFromTransaction = async (
  gatewayApi: GatewayApiClient,
  txId: string,
  eventName: string
) => {
  const event = await getEventFromTransaction(gatewayApi, txId, eventName);
  return extractValuesFromTxEvent(event);
};

export const extractValuesFromTxEvent = (event: DetailedEventsItem) => {
  const programmatic_json = event.payload.programmatic_json as {
    fields: {
      value: string;
      kind: string;
      field_name: string;
    }[];
  };

  const keyValues: Record<string, string> = {};

  if (programmatic_json.fields) {
    programmatic_json.fields.forEach((field) => {
      keyValues[field.field_name] = field.value;
    });
  }

  return keyValues;
};
