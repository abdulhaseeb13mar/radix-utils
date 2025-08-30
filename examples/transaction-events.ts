import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';
import {
  getEventFromTransaction,
  getEventKeyValuesFromTransaction,
  extractValuesFromTxEvent,
} from '../src';

/**
 * Example demonstrating transaction event handling utilities
 * 
 * This example shows how to:
 * 1. Extract specific events from transaction receipts
 * 2. Parse event data into key-value pairs
 * 3. Handle transaction event processing
 */

async function transactionEventExample() {
  // Initialize the Gateway API client
  const gatewayApi = GatewayApiClient.initialize({
    networkId: 1, // Mainnet
    applicationName: 'Transaction Event Example',
    applicationVersion: '1.0.0',
  });

  // Example transaction ID (replace with actual transaction)
  const transactionId = 'txid_rdx1qftdj7vn99...'; // Your transaction intent hash
  
  try {
    console.log('🔍 Extracting events from transaction...');
    
    // Example 1: Get a specific event from transaction
    const withdrawEvent = await getEventFromTransaction(
      gatewayApi,
      transactionId,
      'WithdrawEvent'
    );
    
    console.log('📤 Withdraw Event Found:');
    console.log('- Event Type:', withdrawEvent.identifier.event);
    console.log('- Event Data:', JSON.stringify(withdrawEvent.payload, null, 2));
    
    // Example 2: Extract key-value pairs directly
    const transferData = await getEventKeyValuesFromTransaction(
      gatewayApi,
      transactionId,
      'TransferEvent'
    );
    
    console.log('💸 Transfer Event Data:');
    Object.entries(transferData).forEach(([key, value]) => {
      console.log(`- ${key}: ${value}`);
    });
    
    // Example 3: Process multiple events
    const depositEvent = await getEventFromTransaction(
      gatewayApi,
      transactionId,
      'DepositEvent'
    );
    
    const depositValues = extractValuesFromTxEvent(depositEvent);
    
    console.log('📥 Deposit Event Values:');
    console.log('- Amount:', depositValues.amount);
    console.log('- Resource:', depositValues.resource_address);
    console.log('- Account:', depositValues.account);
    
  } catch (error) {
    console.error('❌ Error processing transaction events:', error);
    
    // Handle common scenarios
    if (error instanceof Error) {
      if (error.message.includes('not found in transaction receipt')) {
        console.log('💡 Tip: The requested event might not exist in this transaction');
        console.log('   Check the transaction in the Radix Dashboard for available events');
      } else if (error.message.includes('No events found')) {
        console.log('💡 Tip: This transaction might not have detailed events enabled');
        console.log('   Ensure the transaction was submitted with event tracking');
      }
    }
  }
}

/**
 * Advanced example: Process all events in a transaction
 */
async function processAllTransactionEvents() {
  const gatewayApi = GatewayApiClient.initialize({
    networkId: 1,
    applicationName: 'Advanced Transaction Processing',
    applicationVersion: '1.0.0',
  });

  const transactionId = 'txid_rdx1qftdj7vn99...'; // Your transaction intent hash

  try {
    // Get transaction details with all events
    const txDetails = await gatewayApi.transaction.innerClient.transactionCommittedDetails({
      transactionCommittedDetailsRequest: {
        intent_hash: transactionId,
        opt_ins: { detailed_events: true },
      },
    });

    const allEvents = txDetails.transaction.receipt?.detailed_events;

    if (!allEvents) {
      console.log('❌ No events found in transaction');
      return;
    }

    console.log(`📋 Found ${allEvents.length} events in transaction:`);

    // Process each event
    allEvents.forEach((event, index) => {
      console.log(`\n🔸 Event ${index + 1}:`);
      console.log('- Type:', event.identifier.event);
      
      // Extract values from each event
      const values = extractValuesFromTxEvent(event);
      
      if (Object.keys(values).length > 0) {
        console.log('- Data:');
        Object.entries(values).forEach(([key, value]) => {
          console.log(`  • ${key}: ${value}`);
        });
      } else {
        console.log('- No extractable field data');
      }
    });

  } catch (error) {
    console.error('❌ Error processing all events:', error);
  }
}

// Export examples for use in other files
export {
  transactionEventExample,
  processAllTransactionEvents,
};

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('🚀 Running Transaction Event Examples\n');
  
  transactionEventExample()
    .then(() => console.log('\n✅ Basic example completed'))
    .then(() => processAllTransactionEvents())
    .then(() => console.log('\n✅ Advanced example completed'))
    .catch(console.error);
}
