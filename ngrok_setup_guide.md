# 📱 SMS Shortcode 18338 - ngrok Setup Guide

## 🎯 **Your Current Setup**
- **ngrok URL:** `https://707244465677.ngrok-free.app/sms/inbound`
- **Shortcode:** `18338`
- **Environment:** Africa's Talking Sandbox

## 🔧 **Configuration Steps**

### **1. Africa's Talking Dashboard Setup**

Go to your Africa's Talking dashboard and configure:

#### **SMS Webhook URL:**
```
https://707244465677.ngrok-free.app/sms/inbound
```

#### **Delivery Report URL:**
```
https://707244465677.ngrok-free.app/sms/status
```

### **2. Environment Variables**

Update your `.env` file:
```bash
# Africa's Talking Configuration
AT_API_KEY=your_sandbox_api_key
AT_USERNAME=sandbox
AT_ENV=Sandbox

# Server Configuration
PORT=5000

# ngrok URL (for reference)
NGROK_URL=https://707244465677.ngrok-free.app
```

### **3. Test the Setup**

#### **Using Postman:**
```
Method: POST
URL: https://707244465677.ngrok-free.app/sms/inbound
Headers: Content-Type: application/x-www-form-urlencoded
Body (form-data):
  from: +255657593461
  to: 18338
  text: menu
  date: 2024-01-01 12:00:00
  id: 1
```

#### **Expected Response:**
```
Status: 200 OK
Body: CON Welcome to SME Invoice Tool
1. Send Invoice
2. Check Invoice
3. Pay Now
4. Help
```

## 📱 **Real SMS Testing**

### **From Your Phone:**
1. Send SMS to shortcode `18338`
2. Text: `menu`
3. You should receive the menu response

### **Complete Flow Test:**
```
You: "menu" → System: "Welcome to SME Invoice Tool..."
You: "1" → System: "Enter Invoice ID"
You: "INV-001" → System: "Enter Amount (TZS)"
You: "50000" → System: "Invoice INV-001 of TZS 50000 will be sent via SMS."
```

## 🔍 **Troubleshooting**

### **If SMS not working:**
1. **Check ngrok tunnel:** Ensure it's running and accessible
2. **Verify webhook URL:** Confirm it's set correctly in AT dashboard
3. **Check server logs:** Look for incoming SMS requests
4. **Test with Postman:** Verify the endpoint responds correctly

### **Common Issues:**
- **ngrok tunnel expired:** Restart ngrok and update webhook URL
- **Wrong webhook URL:** Double-check the URL in AT dashboard
- **Server not running:** Ensure your Node.js server is running

## 📊 **Monitoring**

### **Server Logs to Watch:**
```
Inbound SMS: { from: '+255657593461', to: '18338', text: 'menu', ... }
SMS response sent to +255657593461: CON Welcome to SME Invoice Tool...
```

### **ngrok Dashboard:**
- Check `https://707244465677.ngrok-free.app` for traffic
- Monitor webhook requests

## ✅ **Success Indicators**

When working correctly, you should see:
1. ✅ SMS requests in server console
2. ✅ SMS responses being sent
3. ✅ Menu navigation working
4. ✅ Session management functioning
5. ✅ Invoice creation via SMS

## 🚀 **Next Steps**

1. **Configure webhook** in Africa's Talking dashboard
2. **Test from your phone** by sending SMS to `18338`
3. **Try all menu options** (1, 2, 3, 4)
4. **Monitor server logs** for activity

**Your SMS shortcode should now work with real SMS in sandbox mode! 🎉**
