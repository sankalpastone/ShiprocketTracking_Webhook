const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

/* --------------------------
CONFIG
-------------------------- */

const WEBHOOK_SECRET = "sankalpa_shiprocket_secret";

const ZOLILO_WEBHOOK =
  "https://automation.zolilo.com/webhook/69b2685702e28c7ee4e9017f";

/* --------------------------
STATUS → MESSAGE MAPPING
-------------------------- */

function getStatusType(status) {
  status = status.toLowerCase();

  if (status.includes("picked")) return "picked";
  if (status.includes("transit")) return "transit";
  if (status.includes("out for delivery")) return "out_for_delivery";
  if (status.includes("delivered")) return "delivered";

  return "update";
}

/* --------------------------
SHIPROCKET WEBHOOK
-------------------------- */

app.post("/sankalpa-webhook", async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (apiKey !== WEBHOOK_SECRET) {
      console.log("❌ Invalid webhook token");
      return res.status(403).send("Unauthorized");
    }

    const data = req.body;

    console.log("📦 Webhook received:");
    console.log(data);

    const awb = data.awb;
    const order_id = data.order_id;
    const status = data.shipment_status;
    const courier = data.courier_name;

    const phone = data.phone || "919508372431";
    const name = data.name || "Customer";

    const location =
      data.scans && data.scans.length > 0
        ? data.scans[0].location
        : "In Transit";

    const tracking_link = `https://shiprocket.co/tracking/${awb}`;

    const statusType = getStatusType(status);

    console.log("🚚 Status:", statusType);

    /* --------------------------
    SEND TO ZOLILO
    -------------------------- */

    await axios.post(ZOLILO_WEBHOOK, {
      phone,
      name,
      order_id,
      awb,
      courier,

      shipment_status: status,   // add this
      status,

      location,
      tracking_link,
      status_type: statusType,
    });

    console.log("✅ Sent to Zolilo");

    /* --------------------------
    REVIEW MESSAGE AFTER 3 DAYS
    -------------------------- */

    if (statusType === "delivered") {
      setTimeout(async () => {
        try {
          await axios.post(ZOLILO_WEBHOOK, {
            phone,
            name,
            order_id,
            review: true,
            review_link:
              "https://sankalpastone.com/account/orders",
          });

          console.log("⭐ Review request sent");
        } catch (err) {
          console.log("❌ Review send failed");
        }
      }, 3 * 24 * 60 * 60 * 1000);
    }

    res.send("Webhook processed");
  } catch (error) {
    console.log("❌ ERROR");

    if (error.response) {
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }

    res.status(500).send("Server error");
  }
});

/* --------------------------
HEALTH CHECK
-------------------------- */

app.get("/", (req, res) => {
  res.send("🚀 Shiprocket Tracking Server Running");
});

/* --------------------------
START SERVER
-------------------------- */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});