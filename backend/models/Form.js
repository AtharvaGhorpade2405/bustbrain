const mongoose = require("mongoose");

const { Schema } = mongoose;


const ConditionSchema = new Schema(
  {
    questionKey: {
      type: String,
      required: true,
      trim: true,
    },
    operator: {
      type: String,
      enum: ["equals", "notEquals", "contains"],
      required: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

const ConditionalRulesSchema = new Schema(
  {
    logic: {
      type: String,
      enum: ["AND", "OR"],
      default: "AND",
    },
    conditions: {
      type: [ConditionSchema],
      default: [],
    },
  },
  { _Id: false }
);


const QuestionSchema = new Schema(
  {
    questionKey: {
      type: String,
      required: true,
      trim: true,
    },

    label: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["shortText", "longText", "singleSelect", "multiSelect", "attachment"],
      required: true,
    },

    required: {
      type: Boolean,
      default: false,
    },

    airtableFieldId: {
      type: String,
      required: true,
      trim: true,
    },
    airtableFieldName: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [String],
      default: [],
    },

    conditionalRules: {
      type: ConditionalRulesSchema,
      required: false,
    },
  },
  { _id: false }
);


const FormSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    airtableBaseId: {
      type: String,
      required: true,
      trim: true,
    },
    airtableTableId: {
      type: String,
      required: true,
      trim: true,
    },
    airtableBaseName: {
      type: String,
      trim: true,
    },
    airtableTableName: {
      type: String,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    questions: {
      type: [QuestionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Form = mongoose.model("Form", FormSchema);

module.exports = Form;
