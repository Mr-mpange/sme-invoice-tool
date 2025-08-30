import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const TEST_PHONE = '+255123456789';

// Test colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, path, body = null) {
  try {
    const url = `${BASE_URL}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    log(`\n🧪 Testing: ${name}`, 'blue');
    log(`   ${method} ${url}`, 'yellow');
    
    if (body) {
      log(`   Body: ${JSON.stringify(body, null, 2)}`, 'yellow');
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      log(`✅ SUCCESS (${response.status})`, 'green');
      log(`   Response: ${JSON.stringify(data, null, 2)}`, 'green');
      return data;
    } else {
      log(`❌ FAILED (${response.status})`, 'red');
      log(`   Error: ${JSON.stringify(data, null, 2)}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ ERROR: ${error.message}`, 'red');
    return null;
  }
}

async function runTests() {
  log('🚀 Starting API Tests...', 'blue');
  log('Make sure your server is running on http://localhost:5000', 'yellow');

  // Test 1: Health Check
  await testEndpoint('Health Check', 'GET', '/health');

  // Test 2: Get API Info
  await testEndpoint('Get API Info', 'GET', '/');

  // Test 3: Get Config
  await testEndpoint('Get Config', 'GET', '/config');

  // Test 4: Create Invoice
  const invoiceData = await testEndpoint('Create Invoice', 'POST', '/invoices', {
    customerPhone: TEST_PHONE,
    amount: 50000,
    description: 'Test invoice from API test script'
  });

  if (invoiceData && invoiceData.id) {
    // Test 5: Get Invoice
    await testEndpoint('Get Invoice', 'GET', `/invoices/${invoiceData.id}`);

    // Test 6: Send Invoice by ID
    await testEndpoint('Send Invoice by ID', 'POST', `/invoices/${invoiceData.id}/send`);

    // Test 7: Simulate Payment
    await testEndpoint('Simulate Payment', 'POST', '/simulate/pay', {
      invoiceId: invoiceData.id
    });

    // Test 8: Get Invoice (after payment)
    await testEndpoint('Get Invoice (after payment)', 'GET', `/invoices/${invoiceData.id}`);
  }

  // Test 9: Send Invoice via SMS
  await testEndpoint('Send Invoice via SMS', 'POST', '/send-invoice', {
    phoneNumber: TEST_PHONE,
    amount: 25000,
    invoiceId: 'INV-TEST-001'
  });

  // Test 10: Test SMS
  await testEndpoint('Test SMS', 'POST', '/test-sms', {
    to: TEST_PHONE,
    message: 'Hello from API test script! This is a test message.'
  });

  // Test 11: Mobile Money Checkout
  await testEndpoint('Mobile Money Checkout', 'POST', '/payments/checkout', {
    phoneNumber: TEST_PHONE,
    amount: 1000,
    currency: 'TZS',
    invoiceId: 'INV-TEST-002'
  });

  // Test 12: Payment Callback
  await testEndpoint('Payment Callback', 'POST', '/payments/callback', {
    invoiceId: 'INV-TEST-003',
    status: 'PAID',
    txnId: 'TX-123456789'
  });

  // Test 13: USSD Handler (initial menu)
  await testEndpoint('USSD Handler (initial)', 'POST', '/ussd', {
    sessionId: '123456789',
    serviceCode: '*123#',
    phoneNumber: TEST_PHONE,
    text: ''
  });

  // Test 14: USSD Handler (option 1)
  await testEndpoint('USSD Handler (option 1)', 'POST', '/ussd', {
    sessionId: '123456789',
    serviceCode: '*123#',
    phoneNumber: TEST_PHONE,
    text: '1'
  });

  // Test 15: SMS Inbound Webhook
  await testEndpoint('SMS Inbound Webhook', 'POST', '/sms/inbound', {
    from: TEST_PHONE,
    to: '12345',
    text: 'Hello from test',
    date: '2024-01-01 12:00:00',
    id: '123456789'
  });

  // Test 16: SMS Status Webhook
  await testEndpoint('SMS Status Webhook', 'POST', '/sms/status', {
    status: 'Success',
    messageId: '123456789',
    phoneNumber: TEST_PHONE
  });

  log('\n🎉 API Tests Completed!', 'blue');
  log('Check the results above to see which endpoints are working correctly.', 'yellow');
}

// Run the tests
runTests().catch(error => {
  log(`\n💥 Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});
