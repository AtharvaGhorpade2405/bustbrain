const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const requireAuth = require("../middlewares/requireAuth");
const Form = require("../models/Form");
const Response = require("../models/Response");
const router = express.Router();

const SUPPORTED_AIRTABLE_TYPES = {
  singleLineText: "shortText",
  multilineText: "longText",
  singleSelect: "singleSelect",
  multipleSelects: "multiSelect",
  multipleAttachments: "attachment",
};

function airtableHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function shouldShowQuestion(conditionalRules, answers) {
  if (!conditionalRules) return true;
  const { logic = "AND", conditions = [] } = conditionalRules;
  if (!conditions.length) return true;

  const results = conditions.map((cond) => {
    const answer = answers[cond.questionKey];
    if (answer === undefined || answer === null) return false;

    switch (cond.operator) {
      case "equals":
        return answer === cond.value;
      case "notEquals":
        return answer !== cond.value;
      case "contains":
        if (Array.isArray(answer)) {
          return answer.includes(cond.value);
        }
        return String(answer).includes(String(cond.value));
      default:
        return false;
    }
  });

  if (logic === "OR") {
    return results.some(Boolean);
  }
  return results.every(Boolean);
}

function validateConditionalRules(conditionalRules, questionKeysSet) {
  if (!conditionalRules) return null; // optional

  const { logic, conditions } = conditionalRules;

  if (logic && !["AND", "OR"].includes(logic)) {
    throw new Error("Invalid logic in conditionalRules (must be AND or OR)");
  }

  if (!Array.isArray(conditions)) {
    throw new Error("conditionalRules.conditions must be an array");
  }

  for (const cond of conditions) {
    if (!cond.questionKey || !questionKeysSet.has(cond.questionKey)) {
      throw new Error(
        `conditionalRules references unknown questionKey: ${cond.questionKey}`
      );
    }
    if (!["equals", "notEquals", "contains"].includes(cond.operator)) {
      throw new Error(
        `Invalid operator in conditionalRules: ${cond.operator}`
      );
    }
    if (typeof cond.value === "undefined") {
      throw new Error("conditionalRules condition is missing value");
    }
  }

  return {
    logic: logic || "AND",
    conditions: conditions,
  };
}

router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      title,
      airtableBaseId,
      airtableTableId,
      airtableBaseName,
      airtableTableName,
      questions,
    } = req.body;

    if (!title || !airtableBaseId || !airtableTableId) {
      return res.status(400).json({
        message: "title, airtableBaseId and airtableTableId are required",
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one question is required" });
    }

    const accessToken = req.user.tokens.accessToken;

    const tableResp = await axios.get(
      `https://api.airtable.com/v0/meta/bases/${airtableBaseId}/tables`,
      {
        headers: airtableHeaders(accessToken),
      }
    );

    const tables = tableResp.data.tables || [];
    const table = tables.find((t) => t.id === airtableTableId);

    if (!table) {
      return res.status(400).json({ message: "Invalid Airtable table id" });
    }

    const fieldMap = new Map();
    for (const field of table.fields) {
      fieldMap.set(field.id, field);
    }

    const questionKeysSet = new Set(questions.map((q) => q.questionKey));

    const cleanedQuestions = questions.map((q) => {
      const {
        questionKey,
        airtableFieldId,
        label,
        required = false,
        conditionalRules,
      } = q;

      if (!questionKey || !airtableFieldId || !label) {
        throw new Error(
          "Each question must have questionKey, airtableFieldId, and label"
        );
      }

      const field = fieldMap.get(airtableFieldId);
      if (!field) {
        throw new Error(
          `Airtable field with id ${airtableFieldId} does not exist in the selected table`
        );
      }

      const internalType = SUPPORTED_AIRTABLE_TYPES[field.type];
      if (!internalType) {
        throw new Error(
          `Airtable field "${field.name}" uses unsupported type "${field.type}"`
        );
      }

      let options = [];
      if (
        field.type === "singleSelect" ||
        field.type === "multipleSelects"
      ) {
        options = (field.options?.choices || []).map((c) => c.name);
      }

      const validatedConditionalRules = validateConditionalRules(
        conditionalRules,
        questionKeysSet
      );

      return {
        questionKey,
        label,
        type: internalType, // derive from Airtable type, don't trust frontend
        required: !!required,
        airtableFieldId: field.id,
        airtableFieldName: field.name,
        options,
        conditionalRules: validatedConditionalRules || undefined,
      };
    });

    const form = await Form.create({
      owner: req.user._id,
      title,
      airtableBaseId,
      airtableTableId,
      airtableBaseName: airtableBaseName || table.name, // fallback to Airtable table/base names if needed
      airtableTableName: airtableTableName || table.name,
      questions: cleanedQuestions,
    });

    res.status(201).json(form);
  } catch (err) {
    console.error("Error creating form:", err);
    const message = err.message || "Failed to create form";
    res.status(400).json({ message });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const forms = await Form.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(forms);
  } catch (err) {
    console.error("Error fetching forms:", err);
    res.status(500).json({ message: "Failed to fetch forms" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid form id" });
    }

    const form = await Form.findOne({
      _id: id,
      owner: req.user._id,
    }).lean();

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.json(form);
  } catch (err) {
    console.error("Error fetching form:", err);
    res.status(500).json({ message: "Failed to fetch form" });
  }
});

router.post("/:formId/responses",requireAuth, async (req, res) => {
  try {
    const { formId } = req.params;
    const submittedAnswers = req.body.answers || {};

    if (!mongoose.isValidObjectId(formId)) {
      return res.status(400).json({ message: "Invalid form id" });
    }

    const form = await Form.findById(formId).lean();
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }


    const visibleQuestions = form.questions.filter((q) =>
      shouldShowQuestion(q.conditionalRules, submittedAnswers)
    );

    const errors = [];

    for (const q of visibleQuestions) {
      const value = submittedAnswers[q.questionKey];

      if (q.required) {
        let isEmpty = false;

        switch (q.type) {
          case "shortText":
          case "longText":
          case "singleSelect":
            isEmpty = !value || String(value).trim() === "";
            break;
          case "multiSelect":
          case "attachment":
            isEmpty = !value || !Array.isArray(value) || value.length === 0;
            break;
          default:
            isEmpty = value == null;
        }

        if (isEmpty) {
          errors.push(`Missing required field: ${q.label || q.questionKey}`);
          continue; // no need to validate further for this question
        }
      }

      if (value != null) {
        if (q.type === "singleSelect") {
          if (
            typeof value !== "string" ||
            !q.options.includes(value)
          ) {
            errors.push(
              `Invalid value for ${q.label}. Must be one of: ${q.options.join(
                ", "
              )}`
            );
          }
        }

        if (q.type === "multiSelect") {
          if (!Array.isArray(value)) {
            errors.push(
              `Invalid value for ${q.label}. Must be an array of options.`
            );
          } else {
            const invalid = value.filter((v) => !q.options.includes(v));
            if (invalid.length > 0) {
              errors.push(
                `Invalid value(s) for ${q.label}: ${invalid.join(
                  ", "
                )}. Allowed: ${q.options.join(", ")}`
              );
            }
          }
        }

        if (q.type === "attachment") {
          if (!Array.isArray(value)) {
            errors.push(
              `Invalid value for ${q.label}. Must be an array of attachments.`
            );
          } else {
            const invalid = value.filter(
              (file) => !file || typeof file.url !== "string"
            );
            if (invalid.length > 0) {
              errors.push(
                `Invalid attachment format for ${q.label}. Each attachment must have a "url" string.`
              );
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    const fieldsPayload = {};

    for (const q of form.questions) {
      const value = submittedAnswers[q.questionKey];

      if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) {
        continue;
      }

      const fieldName = q.airtableFieldName; // use Airtable field name as key

      switch (q.type) {
        case "shortText":
        case "longText":
          fieldsPayload[fieldName] = String(value);
          break;

        case "singleSelect":
          fieldsPayload[fieldName] = String(value);
          break;

        case "multiSelect":
          fieldsPayload[fieldName] = value;
          break;

        case "attachment":
          fieldsPayload[fieldName] = value.map((file) => ({
            url: file.url,
            filename: file.filename,
          }));
          break;

        default:
          break;
      }
    }

    const accessToken = req.user?.tokens?.accessToken;
    if (!accessToken) {
      return res.status(401).json({ message: "User Airtable token missing" });
    }

    const airtableUrl = `https://api.airtable.com/v0/${form.airtableBaseId}/${form.airtableTableId}`;

    const createResp = await axios.post(
      airtableUrl,
      {
        records: [
          {
            fields: fieldsPayload,
          },
        ],
      },
      {
        headers: airtableHeaders(accessToken),
      }
    );

    const createdRecord = createResp.data.records?.[0];
    if (!createdRecord) {
      return res
        .status(500)
        .json({ message: "Failed to create Airtable record" });
    }

    const airtableRecordId = createdRecord.id;

    const responseDoc = await Response.create({
      form: form._id,
      airtableRecordId,
      answers: submittedAnswers,
    });

    res.status(201).json({
      message: "Response saved successfully",
      airtableRecordId,
      responseId: responseDoc._id,
    });
  } catch (err) {
    console.error("Error saving response:", err.response?.data || err);
    res.status(500).json({
      message: "Failed to save response",
      details: err.response?.data,
    });
  }
});

router.get("/:formId/responses", requireAuth, async (req, res) => {
  try {
    const { formId } = req.params;

    if (!mongoose.isValidObjectId(formId)) {
      return res.status(400).json({ message: "Invalid form id" });
    }

    const form = await Form.findOne({
      _id: formId,
      owner: req.user._id,
    }).lean();

    if (!form) {
      return res
        .status(404)
        .json({ message: "Form not found or not owned by you" });
    }

    const responses = await Response.find({ form: form._id })
      .sort({ createdAt: -1 })
      .lean();

    const result = responses.map((resp) => {
      const compactPreview = [];
      const entries = Object.entries(resp.answers || {});
      for (let i = 0; i < Math.min(entries.length, 3); i++) {
        const [key, value] = entries[i];
        let displayValue = value;
        if (Array.isArray(value)) {
          displayValue = value.join(", ");
        } else if (typeof value === "object" && value !== null) {
          displayValue = JSON.stringify(value);
        }
        compactPreview.push(`${key}: ${displayValue}`);
      }

      return {
        id: resp._id,
        airtableRecordId: resp.airtableRecordId,
        createdAt: resp.createdAt,
        status: resp.status || "submitted",
        compactPreview: compactPreview.join(" | "),
      };
    });

    res.json({
      form: {
        id: form._id,
        title: form.title,
        airtableBaseName: form.airtableBaseName,
        airtableTableName: form.airtableTableName,
      },
      responses: result,
    });
  } catch (err) {
    console.error("Error fetching responses:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch responses for this form" });
  }
});


module.exports = router;

