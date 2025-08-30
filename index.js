
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/app", express.static("frontend"));

// Initialize Africa's Talking
import africastalkingSdk from "africastalking";
const africastalking = africastalkingSdk({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME || "Sandbox"
});

const sms = africastalking.SMS;
// Some SDK versions expose payments as PAYMENTS/Payments/payments – normalize with fallbacks
const payments = africastalking.PAYMENTS || africastalking.Payments || africastalking.payments;
// Diagnostics to help identify available services at runtime
try {
  const exportedKeys = Object.keys(africastalking || {});
  console.log("Africa's Talking SDK services:", exportedKeys);
  console.log("Has PAYMENTS:", Boolean(africastalking.PAYMENTS));
  console.log("Has Payments:", Boolean(africastalking.Payments));
  console.log("Has payments:", Boolean(africastalking.payments));
} catch {}

// ===== Env-aware config (sandbox vs live) =====
const AT_USERNAME = process.env.AT_USERNAME || "Sandbox";
const AT_ENV = (process.env.AT_ENV || "Sandbox").toLowerCase();
const AT_SENDER_ID = process.env.AT_SENDER_ID || ""; // live: your approved senderId or shortcode
function isSandboxEnv() {
  return AT_USERNAME === "sandbox" || AT_ENV === "Sandbox";
}
function resolveFromAddress() {
  // Sandbox requires empty from. Live can use approved senderId/shortcode.
  return isSandboxEnv() ? "" : AT_SENDER_ID;
}

// Payments config
const AT_PRODUCT_NAME = process.env.AT_PRODUCT_NAME || "Sandbox"; // Your product name in AT
const AT_MMO_CHANNEL = process.env.AT_MMO_CHANNEL || "Mpesa"; // Mpesa, AirtelMoney, TigoPesa, etc

// Fallback: call Payments REST if SDK does not expose PAYMENTS
async function mobileCheckoutViaHttp(payload) {
  const url = "https://payments.africastalking.com/mobile/checkout";
  const headers = {
    apiKey: process.env.AT_API_KEY || "",
    "Content-Type": "application/json"
  };
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

// ===== In-memory store =====
const invoices = new Map();
let nextId = 1;
function generateInvoiceId() {
  const id = `INV-${String(nextId).padStart(4, "0")}`;
  nextId += 1;
  return id;
}

// 📩 Route to send invoice via SMS
app.post("/send-invoice", async (req, res) => {
  try {
    const { phoneNumber, amount, invoiceId } = req.body;

    const message = `Invoice ${invoiceId}\nAmount: TZS ${amount}\nPay via M-Pesa Ref: ${invoiceId}`;
    const result = await sms.send({
      to: [phoneNumber],
      message,
      from: resolveFromAddress()
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== Invoices API =====
// Create invoice
app.post("/invoices", (req, res) => {
  const { customerPhone, amount, description } = req.body;
  if (!customerPhone || !amount) {
    return res.status(400).json({ error: "customerPhone and amount are required" });
  }
  const id = generateInvoiceId();
  const invoice = {
    id,
    customerPhone,
    amount,
    description: description || "",
    status: "PENDING",
    createdAt: new Date().toISOString()
  };
  invoices.set(id, invoice);
  res.status(201).json(invoice);
});

// Fetch invoice
app.get("/invoices/:id", (req, res) => {
  const invoice = invoices.get(req.params.id);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  res.json(invoice);
});

// Send invoice by SMS for existing invoice
app.post("/invoices/:id/send", async (req, res) => {
  try {
    const invoice = invoices.get(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    const message = `Invoice ${invoice.id}\nAmount: TZS ${invoice.amount}\nPay via M-Pesa Ref: ${invoice.id}`;
    const result = await sms.send({ to: [invoice.customerPhone], message, from: resolveFromAddress() });
    res.json({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== Payment callbacks & simulator =====
// Payment provider callback (simulate Africa's Talking Payments or MM integration)
app.post("/payments/callback", (req, res) => {
  const { invoiceId, status, txnId } = req.body;
  const invoice = invoices.get(invoiceId);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  invoice.status = status || "PAID";
  invoice.txnId = txnId || `TX-${Date.now()}`;
  invoice.paidAt = new Date().toISOString();
  invoices.set(invoiceId, invoice);
  console.log("Payment update:", invoice);
  res.json({ success: true });
});

// Simple simulator to mark an invoice as paid
app.post("/simulate/pay", (req, res) => {
  const { invoiceId } = req.body;
  const invoice = invoices.get(invoiceId);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  invoice.status = "PAID";
  invoice.txnId = `SIM-${Date.now()}`;
  invoice.paidAt = new Date().toISOString();
  invoices.set(invoiceId, invoice);
  res.json({ success: true, invoice });
});

// Initiate Mobile Money Checkout (STK push / prompt on handset)
app.post("/payments/checkout", async (req, res) => {
  try {
    const { phoneNumber, amount, currency, invoiceId } = req.body;
    if (!phoneNumber || !amount) {
      return res.status(400).json({ error: "phoneNumber and amount are required" });
    }

    const useSdk = payments && typeof payments.mobileCheckout === "function";

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: "amount must be a positive number" });
    }
    const currencyCode = (/^[A-Za-z]{3}$/.test(String(currency || "").toUpperCase()) ? String(currency).toUpperCase() : "TZS");

    const payload = {
      productName: AT_PRODUCT_NAME,
      providerChannel: AT_SENDER_ID || undefined,
      phoneNumber,
      currencyCode,
      amount: numAmount,
      metadata: invoiceId ? { invoiceId } : undefined
    };

    const result = useSdk ? await payments.mobileCheckout(payload) : await mobileCheckoutViaHttp(payload);
    res.json({ success: true, result });
  } catch (error) {
    console.error("payments/checkout error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔎 Health check (useful for Postman quick test)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 🔧 Config endpoint to confirm environment from outside
app.get("/config", (req, res) => {
  res.json({
    atUsername: AT_USERNAME,
    atEnv: AT_ENV,
    isSandbox: isSandboxEnv(),
    fromAddress: resolveFromAddress() ? "set" : ""
  });
});

// 📚 Root route: list available endpoints
app.get("/", (req, res) => {
  res.json({
    message: "SME Invoice Tool API",
    ussd: {
      dialCode: "*384*34059#",
      serviceCode: "384",
      shortcode: "34059",
      instructions: "Dial *384*34059# from any phone to access the menu"
    },
    webhooks: {
      smsInbound: `${req.protocol}://${req.get('host')}/sms/inbound`,
      smsStatus: `${req.protocol}://${req.get('host')}/sms/status`,
      ussd: `${req.protocol}://${req.get('host')}/ussd`
    },
    endpoints: [
      { method: "GET", path: "/" },
      { method: "GET", path: "/health" },
      { method: "GET", path: "/config" },
      { method: "POST", path: "/send-invoice" },
      { method: "POST", path: "/test-sms" },
      { method: "POST", path: "/sms/inbound" },
      { method: "ALL", path: "/sms/status" },
      { method: "POST", path: "/payments/checkout" },
      { method: "POST", path: "/ussd" }
    ]
  });
});

// 🧪 Simple Postman route to send a custom SMS
app.post("/test-sms", async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ success: false, error: "to and message are required" });
    }
    const result = await sms.send({ to: Array.isArray(to) ? to : [to], message, from: resolveFromAddress() });
    res.json({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📥 Africa's Talking inbound SMS webhook (configure in AT dashboard)
app.post("/sms/inbound", async (req, res) => {
  // AT sends application/x-www-form-urlencoded
  const { from, to, text, date, id, linkId } = req.body;
  console.log("📱 Inbound SMS:", { from, to, text, date, id, linkId });
  
  // Auto-reply to sender based on message content
  try {
    let replyMessage = "";
    const userText = (text || "").toLowerCase().trim();
    
    // SMS Menu System - Users can text commands to 34059
    if (userText === "menu" || userText === "help" || userText === "start") {
      replyMessage = `📱 SME Invoice Tool - SMS Menu

Reply with:
• 1 - Create Invoice
• 2 - Check Invoice  
• 3 - Make Payment
• 4 - Get Help

Or dial *384*34059# for USSD menu

Example: Reply "1 INV001 5000" to create invoice INV001 for TZS 5000`;

    } else if (userText.startsWith("1")) {
      // Create Invoice via SMS: "1 INV001 5000 Description"
      const parts = text.split(" ");
      if (parts.length >= 3) {
        const invoiceId = parts[1];
        const amount = parts[2];
        const description = parts.slice(3).join(" ") || "Created via SMS";
        
        // Create invoice in memory
        const invoice = {
          id: invoiceId,
          customerPhone: from,
          amount: amount,
          description: description,
          status: "PENDING",
          createdAt: new Date().toISOString()
        };
        invoices.set(invoiceId, invoice);
        
        replyMessage = `✅ Invoice Created!

ID: ${invoiceId}
Amount: TZS ${amount}
Description: ${description}
Status: PENDING

To pay, reply "3 ${amount}" or dial *384*34059#`;
        
        console.log("📄 Invoice created via SMS:", invoice);
      } else {
        replyMessage = `❌ Invalid format. Use: "1 INV001 5000 Description"

Example: "1 INV001 5000 Office supplies"`;
      }

    } else if (userText.startsWith("2")) {
      // Check Invoice: "2 INV001"
      const parts = text.split(" ");
      if (parts.length >= 2) {
        const invoiceId = parts[1];
        const invoice = invoices.get(invoiceId);
        
        if (invoice) {
          replyMessage = `📄 Invoice Details:

ID: ${invoice.id}
Amount: TZS ${invoice.amount}
Description: ${invoice.description}
Status: ${invoice.status}
Created: ${new Date(invoice.createdAt).toLocaleDateString()}

To pay, reply "3 ${invoice.amount}" or dial *384*34059#`;
        } else {
          replyMessage = `❌ Invoice ${invoiceId} not found.

Create one with: "1 INV001 5000 Description"`;
        }
      } else {
        replyMessage = `❌ Invalid format. Use: "2 INV001"`;
      }

    } else if (userText.startsWith("3")) {
      // Make Payment: "3 5000"
      const parts = text.split(" ");
      if (parts.length >= 2) {
        const amount = parts[1];
        const numAmount = Number(amount);
        
        if (!Number.isFinite(numAmount) || numAmount <= 0) {
          replyMessage = `❌ Invalid amount. Use: "3 5000"`;
        } else {
          // Initiate mobile checkout
          try {
            const useSdk = payments && typeof payments.mobileCheckout === "function";
            const doCheckout = (payload) => useSdk ? payments.mobileCheckout(payload) : mobileCheckoutViaHttp(payload);
            
            doCheckout({
              productName: AT_PRODUCT_NAME,
              providerChannel: AT_SENDER_ID || undefined,
              phoneNumber: from,
              currencyCode: "TZS",
              amount: numAmount,
              metadata: { via: "sms" }
            }).then(() => {
              console.log("✅ Payment initiated via SMS for:", from, "Amount:", numAmount);
            }).catch((e) => {
              console.error("❌ SMS payment failed:", e.message);
            });
            
            replyMessage = `💳 Payment Initiated!

Amount: TZS ${numAmount}
Phone: ${from}

Check your phone for M-Pesa prompt.
Enter PIN to confirm payment.

Status updates will be sent via SMS.`;
          } catch (error) {
            replyMessage = `❌ Payment failed. Please try again or dial *384*34059#`;
            console.error("❌ SMS payment error:", error.message);
          }
        }
      } else {
        replyMessage = `❌ Invalid format. Use: "3 5000"`;
      }

    } else if (userText === "4" || userText === "help") {
      replyMessage = `📞 SME Invoice Tool - Help

SMS Commands:
• "menu" - Show this menu
• "1 INV001 5000 Description" - Create invoice
• "2 INV001" - Check invoice status
• "3 5000" - Make payment

USSD Menu: Dial *384*34059#

Need support? Contact our team.`;

    } else if (userText.includes("hello") || userText.includes("hi")) {
      replyMessage = `👋 Hello! Welcome to SME Invoice Tool.

Reply "menu" to see available options, or dial *384*34059# for USSD menu.`;

    } else if (userText.includes("invoice")) {
      replyMessage = `📄 To create an invoice, reply: "1 INV001 5000 Description"

Or dial *384*34059# and select option 1.`;

    } else if (userText.includes("payment") || userText.includes("pay")) {
      replyMessage = `💳 To make a payment, reply: "3 5000"

Or dial *384*34059# and select option 3.`;

    } else {
      replyMessage = `📱 Thanks for your message!

Reply "menu" to see available options, or dial *384*34059# for USSD menu.

Quick commands:
• "1 INV001 5000" - Create invoice
• "2 INV001" - Check invoice
• "3 5000" - Make payment`;
    }
    
    // Send auto-reply to the sender
    if (replyMessage && from) {
      await sms.send({
        to: [from],
        message: replyMessage,
        from: resolveFromAddress()
      });
      console.log("✅ Auto-reply sent to:", from, "Message length:", replyMessage.length);
    }
  } catch (error) {
    console.error("❌ Failed to send auto-reply:", error.message);
  }
  
  // Respond 200 OK with no body (required by AT)
  res.sendStatus(200);
});

// 🚚 Delivery Reports webhook (configure in AT dashboard)
app.all("/sms/status", (req, res) => {
  // Some AT routes send GET, others POST; log both
  console.log("SMS Delivery Report:", { body: req.body, query: req.query });
  res.sendStatus(200);
});

// ☎️ USSD handler (configure in AT dashboard)
app.post("/ussd", async (req, res) => {
  console.log("🔔 USSD Webhook Received:", {
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query
  });

  const { sessionId, serviceCode, phoneNumber, text } = req.body;
  console.log("📞 USSD Data:", { sessionId, serviceCode, phoneNumber, text });

  // Basic menu: 1) Send invoice 2) Check help
  let response = "";
  const userInput = (text || "").split("*");

  try {
    if (text === undefined || text === null || text === "") {
      response = "CON Welcome to SME Invoice Tool\n1. Send Invoice\n2. Check Invoice\n3. Pay Now\n4. Help";
    } else if (userInput[0] === "1") {
      if (userInput.length === 1) {
        response = "CON Enter Invoice ID";
      } else if (userInput.length === 2) {
        response = "CON Enter Amount (TZS)";
      } else if (userInput.length === 3) {
        const invoiceId = userInput[1];
        const amount = userInput[2];
        // Optionally create invoice in memory
        const invoice = {
          id: invoiceId,
          customerPhone: phoneNumber,
          amount,
          description: "Created via USSD",
          status: "PENDING",
          createdAt: new Date().toISOString()
        };
        invoices.set(invoiceId, invoice);

        // Fire-and-forget SMS (sandbox requires blank from)
        const smsMessage = `Invoice ${invoiceId}\nAmount: TZS ${amount}\nPay via M-Pesa Ref: ${invoiceId}`;
        try {
          // Fire-and-forget to avoid USSD timeout in simulator/providers
          sms
            .send({ to: [phoneNumber], message: smsMessage, from: resolveFromAddress() })
            .then(() => {})
            .catch((e) => console.error("Failed to send USSD SMS:", e.message));
        } catch (e) {
          console.error("Failed to queue USSD SMS:", e.message);
        }

        response = `END Invoice ${invoiceId} of TZS ${amount} will be sent via SMS.`;
      }
    } else if (userInput[0] === "2") {
      if (userInput.length === 1) {
        response = "CON Enter Invoice ID to check";
      } else if (userInput.length === 2) {
        const invoiceId = userInput[1];
        const inv = invoices.get(invoiceId);
        if (!inv) {
          response = "END Invoice not found.";
        } else {
          const status = inv.status;
          response = `END Invoice ${inv.id} status: ${status}`;
        }
      }
    } else if (userInput[0] === "3") {
      // Pay Now via Mobile Money prompt
      if (userInput.length === 1) {
        response = "CON Enter Amount (TZS)";
      } else if (userInput.length === 2) {
        const amount = userInput[1];
        const msisdn = phoneNumber;
        // Kick off mobile checkout asynchronously
        try {
          const useSdk = payments && typeof payments.mobileCheckout === "function";
          const doCheckout = (payload) => useSdk ? payments.mobileCheckout(payload) : mobileCheckoutViaHttp(payload);
          doCheckout({
              productName: AT_PRODUCT_NAME,
              providerChannel: AT_SENDER_ID || undefined,
              phoneNumber: msisdn,
              currencyCode: "TZS",
              amount: Number(amount),
              metadata: { via: "ussd" }
            })
            .then(() => {})
            .catch((e) => console.error("USSD checkout error:", e.message));
        } catch (e) {
          console.error("Failed to queue checkout:", e.message);
        }
        response = `END Payment prompt will appear on ${msisdn}. Enter PIN to confirm.`;
      }
    } else if (userInput[0] === "4") {
      response = "END For help, contact support.";
    } else {
      response = "END Invalid option.";
    }

    console.log("📱 USSD Response:", response);
    
    // Set proper headers for USSD
    res.set({
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache"
    });
    res.send(response);
  } catch (error) {
    console.error("❌ USSD Error:", error);
    res.set("Content-Type", "text/plain");
    res.send("END An error occurred. Please try again.");
  }
});

// 🚫 404 handler to help debug wrong method/path
app.use((req, res) => {
  res.status(404).json({ error: "Not found", method: req.method, path: req.originalUrl });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
