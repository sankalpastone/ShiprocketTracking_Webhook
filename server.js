const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

let token = "";

/* ------------------------------
   STEP 1: Generate Shiprocket Token
-------------------------------- */

async function generateToken() {
  try {

    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: "93shash@gmail.com",
        password: "D%M4#%W0@PM7ybvHvA#kZFwEN4gefvL8"
      }
    );

    token = response.data.token;

    console.log("✅ Shiprocket Token Generated");
    console.log("TOKEN:", token);

  } catch (error) {

    console.log("❌ Shiprocket Login Failed");
    console.log(error.response?.data);

  }
}

/* ------------------------------
   STEP 2: Webhook Endpoint
-------------------------------- */

app.post("/shiprocket-webhook", async (req, res) => {

  try {

    const { awb, phone, order_id, name } = req.body;

    console.log("📦 Webhook received:", req.body);

    /* ------------------------------
       STEP 3: Call Tracking API
    -------------------------------- */

    const tracking = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    const shipment = tracking.data.tracking_data.shipment_track[0];

    const status = shipment.current_status;
    const courier = shipment.courier_name;
    const trackingLink = shipment.tracking_url;

    console.log("🚚 Shipment Status:", status);

    /* ------------------------------
       STEP 4: Send to com.bot
    -------------------------------- */

    await axios.post("https://automation.zolilo.com/webhook/69b2685702e28c7ee4e9017f", {
      phone: phone,
      name: name,
      order_id: order_id,
      awb: awb,
      status: status,
      courier: courier,
      tracking_link: trackingLink
    });

    res.send("Tracking sent to WhatsApp");

  } catch (error) {

    console.log("❌ ERROR:");
    console.log(error.response?.data);

    res.status(500).send("Error");

  }

});

/* ------------------------------
   STEP 5: Health Check Route
-------------------------------- */

app.get("/", (req, res) => {
  res.send("🚀 Shiprocket Tracking Server Running");
});

/* ------------------------------
   STEP 6: Start Server
-------------------------------- */

app.listen(3000, async () => {

  await generateToken();

  console.log("🚀 Server running on port 3000");

});