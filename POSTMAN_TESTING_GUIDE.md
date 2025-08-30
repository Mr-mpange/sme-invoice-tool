# SME Invoice Tool - Postman Testing Guide

## 🚀 Quick Start

1. **Start the server:**
   ```bash
   npm start
   ```
   The server will run on `http://localhost:5000`

2. **Import the Postman Collection:**
   - Open Postman
   - Click "Import" 
   - Select the `postman_collection.json` file
   - The collection will be imported with all test requests

3. **Set up Environment Variables:**
   - In Postman, go to the collection settings
   - Update the variables:
     - `baseUrl`: `http://localhost:5000`
     - `phoneNumber`: Your test phone number (e.g., `+255123456789`)
     - `testInvoiceId`: `INV-0001`

## 📋 Test Flow Overview

### 1. Basic Health Checks
Start with these to ensure the server is running:

- **Health Check** (`GET /health`) - Should return `{"status": "ok"}`
- **Get API Info** (`GET /`) - Lists all available endpoints
- **Get Config** (`GET /config`) - Shows Africa's Talking configuration

### 2. Invoice Management
Test the core invoice functionality:

1. **Create Invoice** (`POST /invoices`)
   ```json
   {
     "customerPhone": "+255123456789",
     "amount": 50000,
     "description": "Test invoice for Postman testing"
   }
   ```
   Expected: Returns invoice object with generated ID

2. **Get Invoice** (`GET /invoices/{id}`)
   - Use the ID from the previous response
   - Expected: Returns the invoice details

### 3. SMS Functionality
Test SMS sending (requires Africa's Talking setup):

1. **Test SMS** (`POST /test-sms`)
   ```json
   {
     "to": "+255123456789",
     "message": "Hello from SME Invoice Tool! This is a test message."
   }
   ```

2. **Send Invoice via SMS** (`POST /send-invoice`)
   ```json
   {
     "phoneNumber": "+255123456789",
     "amount": 50000,
     "invoiceId": "INV-0001"
   }
   ```

3. **Send Invoice by ID** (`POST /invoices/{id}/send`)
   - Sends SMS for existing invoice

### 4. Payment Testing
Test payment functionality:

1. **Mobile Money Checkout** (`POST /payments/checkout`)
   ```json
   {
     "phoneNumber": "+255123456789",
     "amount": 1000,
     "currency": "TZS",
     "invoiceId": "INV-0001"
   }
   ```
   ⚠️ **Note:** Requires Africa's Talking Payments setup

2. **Simulate Payment** (`POST /simulate/pay`)
   ```json
   {
     "invoiceId": "INV-0001"
   }
   ```
   - Marks invoice as paid without real payment

3. **Payment Callback** (`POST /payments/callback`)
   ```json
   {
     "invoiceId": "INV-0001",
     "status": "PAID",
     "txnId": "TX-123456789"
   }
   ```

### 5. USSD Testing
Test USSD menu functionality:

1. **USSD Handler** (`POST /ussd`)
   - Initial menu (empty text)
   - Expected: Welcome menu with options

2. **USSD - Send Invoice** (`POST /ussd`)
   - With `text: "1"` for option 1
   - Expected: Prompt for invoice ID

### 6. Webhook Testing
Test webhook endpoints:

1. **SMS Inbound Webhook** (`POST /sms/inbound`)
   - Simulates incoming SMS from Africa's Talking

2. **SMS Status Webhook** (`POST /sms/status`)
   - Simulates SMS delivery status updates

## 🔧 Environment Setup

### Required Environment Variables
Create a `.env` file in your project root:

```env
# Africa's Talking Configuration
AT_API_KEY=your_api_key_here
AT_USERNAME=sandbox
AT_ENV=Sandbox
AT_SENDER_ID=
AT_PRODUCT_NAME=Sandbox
AT_MMO_CHANNEL=Mpesa

# Server Configuration
PORT=5000
```

### Africa's Talking Setup
1. Sign up at [Africa's Talking](https://africastalking.com)
2. Get your API key from the dashboard
3. For testing, use the sandbox environment
4. For SMS testing, you'll need to verify your phone number

## 📱 Expected Responses

### Successful Responses
- **Health Check:** `{"status": "ok"}`
- **Create Invoice:** `{"id": "INV-0001", "customerPhone": "...", "amount": 50000, ...}`
- **SMS Send:** `{"success": true, "result": {...}}`
- **Payment:** `{"success": true, "result": {...}}`

### Error Responses
- **400 Bad Request:** Missing required fields
- **404 Not Found:** Invoice not found
- **500 Internal Server Error:** Server or API errors

## 🧪 Testing Scenarios

### Scenario 1: Complete Invoice Flow
1. Create invoice
2. Send invoice via SMS
3. Simulate payment
4. Check invoice status

### Scenario 2: USSD Flow
1. Test USSD initial menu
2. Navigate through options
3. Create invoice via USSD
4. Check invoice status

### Scenario 3: Payment Integration
1. Create invoice
2. Initiate mobile money checkout
3. Simulate payment callback
4. Verify payment status

## 🚨 Common Issues & Solutions

### Issue: SMS not sending
**Solution:** 
- Check Africa's Talking API key
- Verify phone number format (+255...)
- Ensure you're in sandbox mode for testing

### Issue: Payment checkout fails
**Solution:**
- Verify AT_PRODUCT_NAME is set
- Check if Payments service is enabled in AT dashboard
- Use sandbox environment for testing

### Issue: USSD not responding
**Solution:**
- Check Content-Type is `application/x-www-form-urlencoded`
- Verify all required fields are present
- Test with simple text first

## 📊 Monitoring & Debugging

### Server Logs
Watch the console output for:
- API calls and responses
- SMS sending attempts
- Payment processing
- Webhook receipts

### Postman Console
- Check request/response details
- Verify headers and body format
- Monitor response times

## 🔄 Running Tests in Sequence

Use Postman's "Run Collection" feature to:
1. Run all tests in order
2. Set up test dependencies
3. Validate responses automatically
4. Generate test reports

## 📞 Support

If you encounter issues:
1. Check server logs for error messages
2. Verify environment variables
3. Test with simpler requests first
4. Ensure Africa's Talking account is properly configured
