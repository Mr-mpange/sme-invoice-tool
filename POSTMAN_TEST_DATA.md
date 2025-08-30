# 📱 SMS Shortcode 18338 - Postman Test Data

## 🔧 **Environment Variables**
Set these in your Postman environment:
```
baseUrl: http://localhost:5000
phoneNumber: +255123456789
shortcode: 18338
```

## 📋 **Test Requests for Postman**

### **1. Start Menu**
```
Method: POST
URL: {{baseUrl}}/sms/inbound
Headers: Content-Type: application/x-www-form-urlencoded
Body (form-data):
  from: {{phoneNumber}}
  to: {{shortcode}}
  text: menu
  date: 2024-01-01 12:00:00
  id: 123456789
```
**Expected Response:** `200 OK`

### **2. Select Option 1 (Send Invoice)**
```
Method: POST
URL: {{baseUrl}}/sms/inbound
Headers: Content-Type: application/x-www-form-urlencoded
Body (form-data):
  from: {{phoneNumber}}
  to: {{shortcode}}
  text: 1
  date: 2024-01-01 12:00:01
  id: 123456790
```
**Expected Response:** `200 OK`

### **3. Enter Invoice ID**
```
Method: POST
URL: {{baseUrl}}/sms/inbound
Headers: Content-Type: application/x-www-form-urlencoded
Body (form-data):
  from: {{phoneNumber}}
  to: {{shortcode}}
  text: INV-001
  date: 2024-01-01 12:00:02
  id: 123456791
```
**Expected Response:** `200 OK`

### **4. Enter Amount**
```
Method: POST
URL: {{baseUrl}}/sms/inbound
Headers: Content-Type: application/x-www-form-urlencoded
Body (form-data):
  from: {{phoneNumber}}
  to: {{shortcode}}
  text: 50000
  date: 2024-01-01 12:00:03
  id: 123456792
```
**Expected Response:** `200 OK`

### **5. Select Option 2 (Check Invoice)**
```
Method: POST
URL: {{baseUrl}}/sms/inbound
Headers: Content-Type: application/x-www-form-urlencoded
Body (form-data):
  from: {{phoneNumber}}
  to: {{shortcode}}
  text: 2
  date: 2024-01-01 12:00:04
  id: 123456793
```
**Expected Response:** `200 OK`

### **6. Check Invoice ID**
```
Method: POST
URL: {{baseUrl}}/sms/inbound
Headers: Content-Type: application/x-www-form-urlencoded
Body (form-data):
  from: {{phoneNumber}}
  to: {{shortcode}}
  text: INV-001
  date: 2024-01-01 12:00:05
  id: 123456794
```
**Expected Response:** `200 OK`

### **7. Select Option 3 (Pay Now)**
```
Method: POST
URL: {{baseUrl}}/sms/inbound
Headers: Content-Type: application/x-www-form-urlencoded
Body (form-data):
  from: {{phoneNumber}}
  to: {{shortcode}}
  text: 3
  date: 2024-01-01 12:00:06
  id: 123456795
```
**Expected Response:** `200 OK`

### **8. Enter Payment Amount**
```
Method: POST
URL: {{baseUrl}}/sms/inbound
Headers: Content-Type: application/x-www-form-urlencoded
Body (form-data):
  from: {{phoneNumber}}
  to: {{shortcode}}
  text: 1000
  date: 2024-01-01 12:00:07
  id: 123456796
```
**Expected Response:** `200 OK`

### **9. Select Option 4 (Help)**
```
Method: POST
URL: {{baseUrl}}/sms/inbound
Headers: Content-Type: application/x-www-form-urlencoded
Body (form-data):
  from: {{phoneNumber}}
  to: {{shortcode}}
  text: 4
  date: 2024-01-01 12:00:08
  id: 123456797
```
**Expected Response:** `200 OK`

### **10. Invalid Option**
```
Method: POST
URL: {{baseUrl}}/sms/inbound
Headers: Content-Type: application/x-www-form-urlencoded
Body (form-data):
  from: {{phoneNumber}}
  to: {{shortcode}}
  text: 9
  date: 2024-01-01 12:00:09
  id: 123456798
```
**Expected Response:** `200 OK`

## 📱 **Expected SMS Chat Flow**

### **Complete Conversation:**
```
User: "menu"
System: "Welcome to SME Invoice Tool\n1. Send Invoice\n2. Check Invoice\n3. Pay Now\n4. Help"

User: "1"
System: "Enter Invoice ID"

User: "INV-001"
System: "Enter Amount (TZS)"

User: "50000"
System: "Invoice INV-001 of TZS 50000 will be sent via SMS."

User: "2"
System: "Enter Invoice ID to check"

User: "INV-001"
System: "Invoice INV-001 status: PENDING"

User: "3"
System: "Enter Amount (TZS)"

User: "1000"
System: "Payment prompt will appear on +255123456789. Enter PIN to confirm."

User: "4"
System: "For help, contact support."
```

## 🔍 **What to Check in Server Logs**

When you run these tests, you should see in your server console:
```
Inbound SMS: { from: '+255123456789', to: '18338', text: 'menu', ... }
SMS response sent to +255123456789: CON Welcome to SME Invoice Tool...
Inbound SMS: { from: '+255123456789', to: '18338', text: '1', ... }
SMS response sent to +255123456789: CON Enter Invoice ID
...
```

## ✅ **Verification Tests**

### **Check Created Invoice:**
```
Method: GET
URL: {{baseUrl}}/invoices/INV-001
```
**Expected Response:**
```json
{
  "id": "INV-001",
  "customerPhone": "+255123456789",
  "amount": "50000",
  "description": "Created via SMS",
  "status": "PENDING",
  "createdAt": "2024-01-01T12:00:03.000Z"
}
```

### **Health Check:**
```
Method: GET
URL: {{baseUrl}}/health
```
**Expected Response:**
```json
{
  "status": "ok"
}
```

## 🚀 **Quick Test Commands**

You can also test using curl:
```bash
# Test menu
curl -X POST http://localhost:5000/sms/inbound \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "from=+255123456789&to=18338&text=menu&date=2024-01-01 12:00:00&id=123456789"

# Test option 1
curl -X POST http://localhost:5000/sms/inbound \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "from=+255123456789&to=18338&text=1&date=2024-01-01 12:00:01&id=123456790"
```

## 📊 **Test Results Summary**

After running all tests, you should have:
- ✅ Session management working
- ✅ Step-by-step flow functioning
- ✅ Invoice creation via SMS
- ✅ Invoice status checking
- ✅ Payment initiation
- ✅ Error handling for invalid inputs
- ✅ SMS responses being sent

**Import the `sms_shortcode_tests.json` file into Postman for automated testing!**
