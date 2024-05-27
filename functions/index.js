/* eslint-disable */
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");
const functions = require("firebase-functions");
const cors = require("cors");
const helmet = require("helmet");
const app = express();
const { sendEmail } = require("./sendEmail.js");

app.set("view engine", "ejs");

const crypto = require("crypto");
const nonce = crypto.randomBytes(16).toString("base64");

app.use(
  cors({
    origin: [
      "https://tylerhweiss.web.app",
      "https://tylerhweiss.com",
      "https://www.tylerhweiss.com",
      "http://localhost:5000",
      "http://127.0.0.1:5000",
    ],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "")));
app.use(helmet());

app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64");

  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; ` +
      `script-src 'self' https://ajax.googleapis.com https://maxcdn.bootstrapcdn.com https://www.google-analytics.com https://www.google.com https://www.gstatic.com 'nonce-${nonce}'; ` +
      `style-src 'self' https://maxcdn.bootstrapcdn.com 'nonce-${nonce}';`
  );

  res.locals.nonce = nonce;

  next();
});

app.get("/get-site-key", (req, res) => {
  try {
    const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY;
    res.json({ recaptchaSiteKey });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/reCAPTCHA", async (req, res) => {
  const recaptchaResponse = req.body["g-recaptcha-response"];
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
  try {
    const verificationResponse = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: recaptchaSecret,
          response: recaptchaResponse,
        },
      }
    );

    if (verificationResponse.data.success) {
      res.json({ success: true });
    } else {
      res
        .status(400)
        .json({ success: false, message: "reCAPTCHA verification failed." });
    }
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  sendEmail(name, email, message)
    .then(() => {
      res.json({ success: true });
    })
    .catch((error) => {
      res.status(500).json({ success: false, error: error });
    });
});

const api = functions.https.onRequest(app);
module.exports = {
  api,
};
