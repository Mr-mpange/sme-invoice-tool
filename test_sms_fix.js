import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testSmsShortcode() {
  console.log('🧪 Testing SMS Shortcode Fix...\n');

  const testData = {
    from: "+255657593461",
    to: "18338",
    text: "menu",
    date: "2024-01-01 12:00:00",
    id: "1"
  };

  try {
    console.log('📤 Sending test SMS to shortcode 18338...');
    console.log('Request data:', testData);
    
    const response = await fetch(`${BASE_URL}/sms/inbound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(testData)
    });

    const responseText = await response.text();
    
    console.log('\n📥 Response:');
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Body:', responseText);
    
    if (response.status === 200 && responseText.includes('Welcome to SME Invoice Tool')) {
      console.log('\n✅ SUCCESS! SMS shortcode is working correctly.');
      console.log('The response contains the expected menu text.');
    } else {
      console.log('\n❌ FAILED! Unexpected response.');
    }

  } catch (error) {
    console.error('\n💥 Error testing SMS shortcode:', error.message);
  }
}

// Run the test
testSmsShortcode();
