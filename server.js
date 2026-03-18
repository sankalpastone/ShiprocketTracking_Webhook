const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const SECRET = "sankalpa_secret";
const ZOLILO_WEBHOOK = "https://automation.zolilo.com/webhook/69ba716802e28c7ee4ef6a41";

// 🧠 Temporary in-memory store (order_id → phone, name)
let orderStore = {};

/* ------------------------------
   1️⃣ STORE SHOPIFY ORDER DATA
-------------------------------- */
app.post("/store-order", (req, res) => {
  try {
    const order = req.body;

    const orderId = order.id || order.name;

    orderStore[orderId] = {
      phone: order.phone || order.customer?.phone,
      name: order.customer?.first_name || "Customer"
    };

    console.log("🧠 Stored order:", orderId, orderStore[orderId]);

    res.send("Stored");

  } catch (err) {
    console.log("❌ Store Error:", err);
    res.status(500).send("Error");
  }
});

/* ------------------------------
   2️⃣ SHIPROCKET WEBHOOK
-------------------------------- */
app.post("/sankalpa-webhook", async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (apiKey !== SECRET) {
      return res.status(403).send("Unauthorized");
    }

    console.log("📦 Incoming:", req.body);

    const {
      awb,
      shipment_status,
      courier_name,
      order_id,
      etd
    } = req.body;

    const status = shipment_status?.toUpperCase();

    // 🔍 Fetch stored customer data
    const stored = orderStore[order_id];

    if (!stored || !stored.phone) {
      console.log("❌ Phone not found for order:", order_id);
      return res.send("No phone");
    }

    const phone = stored.phone;
    const name = stored.name;

    let payload = null;

    // 🚚 SHIPPED / IN TRANSIT
    if (status === "SHIPPED" || status === "IN TRANSIT") {
      payload = {
        phone: phone,
        message: `Namaste ${name} 🙏

Great news!
Your Sankalpa Stone order has been shipped 🚚

Order: #${order_id}
Courier: ${courier_name}
Tracking: ${awb}

Track here:
https://shiprocket.co/tracking/${awb}

Expected Delivery: ${etd || "Soon"}

Your artifact is on its way to you.`
      };
    }

    // 📦 OUT FOR DELIVERY
    else if (status === "OUT FOR DELIVERY") {
      payload = {
        phone: phone,
        message: `Namaste ${name} 👋

Your Sankalpa Stone order is out for delivery today! 📦

Order: #${order_id}

Please keep amount ready if this is a COD order.

We hope it brings you peace and strength.`
      };
    }

    // ✅ DELIVERED
    else if (status === "DELIVERED") {
      payload = {
        phone: phone,
        message: `Namaste ${name} 👋

Your Sankalpa Stone order has been delivered! ✅

Order: #${order_id}

We hope your artifact brings clarity and strength to your daily Sankalpa.`
      };
    }

    if (!payload) {
      console.log("❌ Ignored status:", shipment_status);
      return res.send("Ignored");
    }

    console.log("📤 Sending to com.bot:", payload);

    const response = await axios.post(ZOLILO_WEBHOOK, payload);

    console.log("📨 com.bot response:", response.data);

    res.send("Done");

  } catch (err) {
    console.log("❌ ERROR:", err.response?.data || err.message);
    res.status(500).send("Error");
  }
});

/* ------------------------------
   3️⃣ HEALTH CHECK
-------------------------------- */
app.get("/", (req, res) => {
  res.send("Server Running 🚀");
});

/* ------------------------------
   4️⃣ START SERVER
-------------------------------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});