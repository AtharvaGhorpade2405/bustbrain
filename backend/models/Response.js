const mongoose = require("mongoose");

const { Schema } = mongoose;

const ResponseSchema = new Schema(
  {
    form: {
      type: Schema.Types.ObjectId,
      ref: "Form",
      required: true,
      index: true,
    },
    airtableRecordId: {
      type: String,
      required: true,
      index: true,
    },
    answers: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["submitted"],
      default: "submitted",
    },
    deletedInAirtable: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Response = mongoose.model("Response", ResponseSchema);

module.exports = Response;
