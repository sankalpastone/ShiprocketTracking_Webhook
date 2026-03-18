const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const SECRET = "sankalpa_secret";
const ZOLILO_WEBHOOK = "https://automation.zolilo.com/webhook/69b2685702e28c7ee4e9017f";

app.post("/sankalpa-webhook", async (req, res) => {
  try {

    // 1️⃣ Security check
    const apiKey = req.headers["x-api-key"];
    if (apiKey !== SECRET) {
      return res.status(403).send("Unauthorized");
    }

    console.log("📦 Incoming:", req.body);

    const {
      awb,
      shipment_status,
      courier_name,
      order_id
    } = req.body;

    let statusType = "";

    // 2️⃣ Smart status mapping
    if (shipment_status === "OUT FOR DELIVERY") {
      statusType = "out_for_delivery";
    } 
    else if (shipment_status === "DELIVERED") {
      statusType = "delivered";
    } 
    else if (shipment_status === "SHIPPED" || shipment_status === "IN TRANSIT") {
      statusType = "shipped";
    } 
    else {
      return res.send("Ignored status");
    }

    const trackingLink = `https://shiprocket.co/tracking/${awb}`;

    console.log("🚚 Final Status:", statusType);

    // 3️⃣ Send to com.bot
    await axios.post(ZOLILO_WEBHOOK, {
      phone: "CUSTOMER_PHONE", // replace later
      name: "Customer",
      order_id,
      awb,
      status: statusType,
      courier: courier_name,
      tracking_link: trackingLink
    });

    console.log("✅ Sent to com.bot");

    res.send("Done");

  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).send("Error");
  }
});

app.get("/", (req, res) => {
  res.send("Server Running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));