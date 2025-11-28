const express = require("express");
const axios = require("axios");
const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

function airtableHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

router.get("/me", requireAuth, async (req, res) => {
  try {
    const accessToken = req.user.tokens.accessToken;

    const resp = await axios.get(
      "https://api.airtable.com/v0/meta/whoami",
      {
        headers: airtableHeaders(accessToken),
      }
    );

    res.json(resp.data);
  } catch (err) {
    console.error("Error in /airtable/me:", err.response?.data || err);
    res.status(500).json({ message: "Failed to fetch Airtable user" });
  }
});

router.get("/bases", requireAuth, async (req, res) => {
  try {
    const accessToken = req.user.tokens.accessToken;

    const resp = await axios.get(
      "https://api.airtable.com/v0/meta/bases",
      {
        headers: airtableHeaders(accessToken),
      }
    );

    res.json(resp.data);
  } catch (err) {
    console.error("Error in /airtable/bases:", err.response?.data || err);
    res.status(500).json({ message: "Failed to fetch bases" });
  }
});

router.get("/bases/:baseId/tables", requireAuth, async (req, res) => {
  try {
    const accessToken = req.user.tokens.accessToken;
    const { baseId } = req.params;

    const resp = await axios.get(
      `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
      {
        headers: airtableHeaders(accessToken),
      }
    );

    res.json(resp.data);
  } catch (err) {
    console.error("Error in /airtable/bases/:baseId/tables:", err.response?.data || err);
    res.status(500).json({ message: "Failed to fetch tables" });
  }
});

const SUPPORTED_AIRTABLE_TYPES = {
  singleLineText: "shortText",
  multilineText: "longText",
  singleSelect: "singleSelect",
  multipleSelects: "multiSelect",
  multipleAttachments: "attachment",
};

router.get(
  "/bases/:baseId/tables/:tableId/fields",
  requireAuth,
  async (req, res) => {
    try {
      const accessToken = req.user.tokens.accessToken;
      const { baseId, tableId } = req.params;

      const resp = await axios.get(
        `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
        {
          headers: airtableHeaders(accessToken),
        }
      );

      const tables = resp.data.tables || [];
      const table = tables.find((t) => t.id === tableId);

      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }

      const supportedFields = table.fields.filter((field) =>
        Object.prototype.hasOwnProperty.call(
          SUPPORTED_AIRTABLE_TYPES,
          field.type
        )
      );

      const result = supportedFields.map((field) => ({
        id: field.id,
        name: field.name,
        type: field.type,
        internalType: SUPPORTED_AIRTABLE_TYPES[field.type],
        options:
          field.type === "singleSelect" || field.type === "multipleSelects"
            ? (field.options?.choices || []).map((c) => c.name)
            : [],
      }));

      res.json({ fields: result });
    } catch (err) {
      console.error(
        "Error in /airtable/bases/:baseId/tables/:tableId/fields:",
        err.response?.data || err
      );
      res
        .status(500)
        .json({ message: "Failed to fetch fields for this table" });
    }
  }
);


router.post("/bases",requireAuth, async (req, res) => {
  try {
    const accessToken = req.user.tokens.accessToken;

    const { name, tables } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Base name is required" });
    }

    const payload = {
      name,
      tables: tables && tables.length > 0 ? tables : [
        {
          name: "Table 1",
          description: "Default table",
          fields: [
            {
              name: "Name",
              type: "singleLineText", 
            },
          ],
        },
      ],
    };

    const resp = await axios.post(
      "https://api.airtable.com/v0/meta/bases",
      payload,
      { headers: airtableHeaders(accessToken) }
    );

    res.status(201).json(resp.data);
  } catch (err) {
    console.error("Error creating base:", err.response?.data || err.message);
    res
      .status(err.response?.status || 500)
      .json({ message: "Failed to create base", details: err.response?.data });
  }
});

module.exports = router;
