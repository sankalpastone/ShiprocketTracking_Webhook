const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const SECRET = "sankalpa_shiprocket_secret";
const ZOLILO_WEBHOOK = "https://automation.zolilo.com/webhook/69ba716802e28c7ee4ef6a41";

app.post("/shiprocket-webhook", async (req, res) => {
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

    // ⚠️ Replace these later with real data
    const name = "Customer";
    const product = "Your Product";
    const codAmount = "Amount";

    let payload = {};

    // 🚚 SHIPPED TEMPLATE
    if (shipment_status === "SHIPPED" || shipment_status === "IN TRANSIT") {

      payload = {
        phone: "919XXXXXXXXX",
        template_name: "order shipped",
        variables: [
          name,          // {{1}}
          order_id,      // {{2}}
          courier_name,  // {{3}}
          awb,           // {{4}}
          `https://shiprocket.co/tracking/${awb}`, // {{5}}
          etd || "Soon"  // {{6}}
        ]
      };
    }

    // 📦 OUT FOR DELIVERY TEMPLATE
    else if (shipment_status === "OUT FOR DELIVERY") {

      payload = {
        phone: "919XXXXXXXXX",
        template_name: "out for delivery",
        variables: [
          name,       // {{1}}
          order_id,   // {{2}}
          product,    // {{3}}
          codAmount   // {{4}}
        ]
      };
    }

    // ✅ DELIVERED TEMPLATE
    else if (shipment_status === "DELIVERED") {

      payload = {
        phone: "919XXXXXXXXX",
        template_name: "delivery confirmation",
        variables: [
          name,       // {{1}}
          order_id,   // {{2}}
          product     // {{3}}
        ]
      };
    }

    else {
      return res.send("Ignored");
    }

    // 🚀 Send to com.bot
    await axios.post(ZOLILO_WEBHOOK, payload);

    console.log("✅ Template sent");

    res.send("Done");

  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).send("Error");
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log("🚀 Server running")
);

