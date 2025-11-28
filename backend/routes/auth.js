const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const User = require("../models/User");

const router = express.Router();

router.get("/airtable", (req, res) => {
  const code_verifier = crypto.randomBytes(43).toString("hex");
  const state = crypto.randomBytes(16).toString("hex");
  req.session.code_verifier = code_verifier;
  const params = new URLSearchParams({
    response_type: "code",
    state,
    client_id: process.env.AIRTABLE_CLIENT_ID,
    redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
    scope:
      "data.records:read data.records:write schema.bases:read schema.bases:write user.email:read webhook:manage",
    code_verifier,
    code_challenge: crypto
      .createHash("sha256")
      .update(code_verifier)
      .digest("base64url"),
    code_challenge_method: "S256",
  });
  res.redirect("https://airtable.com/oauth2/v1/authorize?" + params.toString());
});

router.get("/airtable/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.AIRTABLE_CLIENT_ID,
      code_verifier: req.session.code_verifier,
      redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
    }).toString();
    
    const tokenRes = await axios.post(
      "https://airtable.com/oauth2/v1/token",
      body ,
      { headers: headers }
    );
    const accessToken = tokenRes.data.access_token;
    const refreshToken = tokenRes.data.refresh_token || null;

    const whoamiRes = await axios.get(
      "https://api.airtable.com/v0/meta/whoami",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const airtableUserId = whoamiRes.data.id;
    const email = whoamiRes.data.email;

    let user = await User.findOne({ airtableUserId });

    if (!user) {
      user = await User.create({
        airtableUserId,
        email,
        tokens: {
          accessToken,
          refreshToken,
        },
        lastLoginAt: new Date(),
      });
    } else {
      user.tokens.accessToken = accessToken;
      user.tokens.refreshToken = refreshToken || user.tokens.refreshToken;
      user.lastLoginAt = new Date();
      await user.save();
    }

    req.session.userId= user._id.toString();

    res.redirect(process.env.FRONTEND_URL+"/dashboard");
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).send("OAuth failed");
  }
});

module.exports = router;
