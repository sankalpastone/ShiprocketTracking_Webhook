const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

/* ------------------------------
   CONFIGURATION
-------------------------------- */

const SHIPROCKET_WEBHOOK_SECRET = "sankalpa_shiprocket_secret";
const ZOLILO_WEBHOOK = "https://automation.zolilo.com/webhook/69b2685702e28c7ee4e9017f";

/* ------------------------------
   SHIPROCKET WEBHOOK ENDPOINT
-------------------------------- */

app.post("/sankalpa-webhook", async (req, res) => {

  try {

    /* ------------------------------
       1️⃣ Verify Shiprocket token
    -------------------------------- */

    const apiKey = req.headers["x-api-key"];

    if (apiKey !== SHIPROCKET_WEBHOOK_SECRET) {
      console.log("❌ Invalid webhook token");
      return res.status(403).send("Unauthorized");
    }

    console.log("📦 Webhook received:");
    console.log(req.body);

    /* ------------------------------
       2️⃣ Extract shipment details
    -------------------------------- */

    const {
      awb,
      shipment_status,
      courier_name,
      order_id
    } = req.body;

    const status = shipment_status;
    const courier = courier_name;

    const trackingLink = `https://shiprocket.co/tracking/${awb}`;

    console.log("🚚 Status:", status);

    /* ------------------------------
       3️⃣ Send data to Zolilo
    -------------------------------- */

    await axios.post(ZOLILO_WEBHOOK, {

      phone: "CUSTOMER_PHONE_NUMBER",
      name: "Customer",

      order_id: order_id,
      awb: awb,

      status: status,
      courier: courier,

      tracking_link: trackingLink

    });

    console.log("✅ Sent to Zolilo");

    res.send("Webhook processed");

  } catch (error) {

    console.log("❌ ERROR:");

    if (error.response) {
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }

    res.status(500).send("Server error");

  }

});

/* ------------------------------
   HEALTH CHECK ROUTE
-------------------------------- */

app.get("/", (req, res) => {
  res.send("🚀 Shiprocket Tracking Server Running");
});

/* ------------------------------
   START SERVER
-------------------------------- */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});