/* eslint-disable */
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");
const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors");
const helmet = require("helmet");
const csurf = require("csurf");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const { sendEmail } = require("./sendEmail.js");

const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname)));
app.use(helmet({}));

// CORS setup
const corsOptions = {
  origin: [
    "https://tylerhweiss.web.app",
    "https://tylerhweiss.com",
    "https://www.tylerhweiss.com",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
  ],
  credentials: true,
};

app.use(cors(corsOptions));

// CSP and nonce setup
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

const csrfProtection = csurf({ cookie: true });

const applyCsrfProtection = (req, res, next) => {
  if (req.path === "/send-email") {
    csrfProtection(req, res, next);
  } else {
    next();
  }
};

app.use("/send-email", applyCsrfProtection);

app.get("/get-csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.get("/get-site-key", (req, res) => {
  try {
    const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY;
    res.json({ recaptchaSiteKey });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/reCAPTCHA", csrfProtection, async (req, res) => {
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

app.post("/send-email", csrfProtection, async (req, res) => {
  const { name, email, message } = req.body;

  sendEmail(name, email, message)
    .then(() => {
      res.json({ success: true });
    })
    .catch((error) => {
      res.status(500).json({ success: false, error: error.message });
    });
});

app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN" || err.status === 403) {
    let reason = "Forbidden";
    if (err.code === "EBADCSRFTOKEN") {
      reason = "CSRF token validation failed";
    }

    res.status(403).json({
      success: false,
      reason: reason,
    });
  } else {
    next(err);
  }
});

const api = onRequest(app);
module.exports = { api };
