require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");
const app = express();
const { sendEmail } = require("./public/js/sendEmail.js");

app.set("view engine", "ejs");

const crypto = require("crypto");
const nonce = crypto.randomBytes(16).toString("base64");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  const userAgent = req.headers["user-agent"];
  if (userAgent.includes("Chrome") || userAgent.includes("Firefox")) {
    res.setHeader(
      "Content-Security-Policy",
      `default-src 'self'; script-src 'self' https://ajax.googleapis.com https://maxcdn.bootstrapcdn.com https://www.google-analytics.com https://www.google.com https://www.gstatic.com 'nonce-${nonce}' 'unsafe-inline'; style-src 'self' https://maxcdn.bootstrapcdn.com 'unsafe-inline'; report-uri /csp-report-endpoint`
    );
  } else if (userAgent.includes("Edge") || userAgent.includes("WebKit")) {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    );
  } else {
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self';");
  }
  next();
});

app.get("/", (_, res) => {
  let recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY;
  res.render("index", { recaptchaSiteKey });
});

app.get("/get-site-key", (_, res) => {
  let recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY;
  res.json({ recaptchaSiteKey, nonce });
});

app.post("/verify-recaptcha", async (req, res) => {
  const { recaptchaResponse } = req.query;

  try {
    const recaptchaVerification = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          response: recaptchaResponse,
          secret: process.env.RECAPTCHA_SECRET_KEY,
        },
      }
    );

    if (recaptchaVerification.data.success) {
      res.json({ success: true });
    } else {
      res
        .status(400)
        .json({ success: false, error: "reCAPTCHA verification failed" });
    }
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
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

app.post("/csp-report-endpoint", (req, res) => {
  const cspReport = req.body;
  console.log("CSP Violation Report Server.js:", cspReport);
  res.sendStatus(200);
});

app.use((req, res, next) => {
  if (!req.route) {
    res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
  } else {
    next();
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
