import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

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

async function runSimpleTests() {
  log('🚀 Starting Simple API Tests...', 'blue');
  log('Testing basic endpoints without Africa\'s Talking integration', 'yellow');

  // Test 1: Health Check
  await testEndpoint('Health Check', 'GET', '/health');

  // Test 2: Get API Info
  await testEndpoint('Get API Info', 'GET', '/');

  // Test 3: Get Config
  await testEndpoint('Get Config', 'GET', '/config');

  // Test 4: Create Invoice (basic functionality)
  const invoiceData = await testEndpoint('Create Invoice', 'POST', '/invoices', {
    customerPhone: '+255123456789',
    amount: 50000,
    description: 'Test invoice from simple test script'
  });

  if (invoiceData && invoiceData.id) {
    // Test 5: Get Invoice
    await testEndpoint('Get Invoice', 'GET', `/invoices/${invoiceData.id}`);

    // Test 6: Simulate Payment
    await testEndpoint('Simulate Payment', 'POST', '/simulate/pay', {
      invoiceId: invoiceData.id
    });

    // Test 7: Get Invoice (after payment)
    await testEndpoint('Get Invoice (after payment)', 'GET', `/invoices/${invoiceData.id}`);
  }

  // Test 8: Payment Callback
  await testEndpoint('Payment Callback', 'POST', '/payments/callback', {
    invoiceId: 'INV-TEST-003',
    status: 'PAID',
    txnId: 'TX-123456789'
  });

  log('\n🎉 Simple API Tests Completed!', 'blue');
  log('These tests don\'t require Africa\'s Talking setup.', 'yellow');
}

// Run the tests
runSimpleTests().catch(error => {
  log(`\n💥 Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});
