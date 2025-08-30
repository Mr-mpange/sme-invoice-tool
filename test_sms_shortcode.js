import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const TEST_PHONE = '+255123456789';
const SHORTCODE = '18338';

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

async function testSmsShortcode() {
  log('🧪 Testing SMS Shortcode 18338 Flow', 'blue');
  log('This simulates the exact data you should see in Postman', 'yellow');

  const testFlow = [
    {
      name: "Start Menu",
      data: {
        from: TEST_PHONE,
        to: SHORTCODE,
        text: "menu",
        date: "2024-01-01 12:00:00",
        id: "123456789"
      },
      expectedResponse: "CON Welcome to SME Invoice Tool"
    },
    {
      name: "Select Option 1 (Send Invoice)",
      data: {
        from: TEST_PHONE,
        to: SHORTCODE,
        text: "1",
        date: "2024-01-01 12:00:01",
        id: "123456790"
      },
      expectedResponse: "CON Enter Invoice ID"
    },
    {
      name: "Enter Invoice ID",
      data: {
        from: TEST_PHONE,
        to: SHORTCODE,
        text: "INV-001",
        date: "2024-01-01 12:00:02",
        id: "123456791"
      },
      expectedResponse: "CON Enter Amount (TZS)"
    },
    {
      name: "Enter Amount",
      data: {
        from: TEST_PHONE,
        to: SHORTCODE,
        text: "50000",
        date: "2024-01-01 12:00:03",
        id: "123456792"
      },
      expectedResponse: "END Invoice INV-001 of TZS 50000 will be sent via SMS"
    },
    {
      name: "Select Option 2 (Check Invoice)",
      data: {
        from: TEST_PHONE,
        to: SHORTCODE,
        text: "2",
        date: "2024-01-01 12:00:04",
        id: "123456793"
      },
      expectedResponse: "CON Enter Invoice ID to check"
    },
    {
      name: "Check Invoice ID",
      data: {
        from: TEST_PHONE,
        to: SHORTCODE,
        text: "INV-001",
        date: "2024-01-01 12:00:05",
        id: "123456794"
      },
      expectedResponse: "END Invoice INV-001 status: PENDING"
    },
    {
      name: "Select Option 3 (Pay Now)",
      data: {
        from: TEST_PHONE,
        to: SHORTCODE,
        text: "3",
        date: "2024-01-01 12:00:06",
        id: "123456795"
      },
      expectedResponse: "CON Enter Amount (TZS)"
    },
    {
      name: "Enter Payment Amount",
      data: {
        from: TEST_PHONE,
        to: SHORTCODE,
        text: "1000",
        date: "2024-01-01 12:00:07",
        id: "123456796"
      },
      expectedResponse: "END Payment prompt will appear"
    },
    {
      name: "Select Option 4 (Help)",
      data: {
        from: TEST_PHONE,
        to: SHORTCODE,
        text: "4",
        date: "2024-01-01 12:00:08",
        id: "123456797"
      },
      expectedResponse: "END For help, contact support"
    },
    {
      name: "Invalid Option",
      data: {
        from: TEST_PHONE,
        to: SHORTCODE,
        text: "9",
        date: "2024-01-01 12:00:09",
        id: "123456798"
      },
      expectedResponse: "END Invalid option"
    }
  ];

  log('\n📋 Expected Postman Test Data:', 'blue');
  log('Copy these requests into Postman to test your SMS shortcode:', 'yellow');

  for (let i = 0; i < testFlow.length; i++) {
    const test = testFlow[i];
    log(`\n${i + 1}. ${test.name}`, 'green');
    log('   URL: POST http://localhost:5000/sms/inbound', 'yellow');
    log('   Headers: Content-Type: application/x-www-form-urlencoded', 'yellow');
    log('   Body (form-data):', 'yellow');
    log(`     from: ${test.data.from}`, 'yellow');
    log(`     to: ${test.data.to}`, 'yellow');
    log(`     text: ${test.data.text}`, 'yellow');
    log(`     date: ${test.data.date}`, 'yellow');
    log(`     id: ${test.data.id}`, 'yellow');
    log(`   Expected Response: ${test.expectedResponse}`, 'blue');
  }

  log('\n📱 Complete SMS Chat Flow:', 'blue');
  log('User → System (Expected Response)', 'yellow');
  
  const chatFlow = [
    { user: "menu", system: "Welcome to SME Invoice Tool\n1. Send Invoice\n2. Check Invoice\n3. Pay Now\n4. Help" },
    { user: "1", system: "Enter Invoice ID" },
    { user: "INV-001", system: "Enter Amount (TZS)" },
    { user: "50000", system: "Invoice INV-001 of TZS 50000 will be sent via SMS." },
    { user: "2", system: "Enter Invoice ID to check" },
    { user: "INV-001", system: "Invoice INV-001 status: PENDING" },
    { user: "3", system: "Enter Amount (TZS)" },
    { user: "1000", system: "Payment prompt will appear on +255123456789. Enter PIN to confirm." },
    { user: "4", system: "For help, contact support." }
  ];

  chatFlow.forEach((step, index) => {
    log(`\n${index + 1}. User sends: "${step.user}"`, 'green');
    log(`   System responds: "${step.system}"`, 'blue');
  });

  log('\n🔧 Postman Collection Variables:', 'blue');
  log('Set these in your Postman environment:', 'yellow');
  log('baseUrl: http://localhost:5000', 'yellow');
  log('phoneNumber: +255123456789', 'yellow');
  log('shortcode: 18338', 'yellow');

  log('\n✅ Test Data Ready for Postman!', 'green');
  log('Import the sms_shortcode_tests.json file and run the tests.', 'yellow');
}

// Run the test
testSmsShortcode().catch(error => {
  log(`\n💥 Test failed: ${error.message}`, 'red');
  process.exit(1);
});
