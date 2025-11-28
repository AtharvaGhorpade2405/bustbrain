import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";
import { shouldShowQuestion } from "../utils/conditional"; 

function FormViewer() {
  const { formId } = useParams();

  const [form, setForm] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [answers, setAnswers] = useState({}); 
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoadError("");
        setSubmitError("");
        setSubmitSuccess("");
        setLoading(true);

        const res = await api.get(`/forms/${formId}`);
        setForm(res.data || null);
      } catch (err) {
        console.error(err);
        const msg =
          err.response?.data?.message || "Failed to load form definition.";
        setLoadError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId]);


  const handleTextChange = (questionKey, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: value,
    }));
  };

  const handleSingleSelectChange = (questionKey, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: value || "",
    }));
  };

  const handleMultiSelectChange = (questionKey, event) => {
    const selectedValues = Array.from(
      event.target.selectedOptions,
      (opt) => opt.value
    );
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: selectedValues,
    }));
  };

  const handleAttachmentChange = (questionKey, event) => {
    const files = Array.from(event.target.files || []);
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: files,
    }));
  };


  const validateAndSubmit = async (event) => {
  event.preventDefault();
  if (!form) return;

  setSubmitError("");
  setSubmitSuccess("");

  const visibleQuestions = form.questions.filter((q) =>
    shouldShowQuestion(q.conditionalRules, answers)
  );

  const missingRequired = [];

  for (const q of visibleQuestions) {
    if (!q.required) continue;

    const value = answers[q.questionKey];
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
      missingRequired.push(q.label || q.questionKey);
    }
  }

  if (missingRequired.length > 0) {
    setSubmitError(
      "Please fill all required fields: " + missingRequired.join(", ")
    );
    return;
  }

  try {
    const res = await api.post(`/forms/${form._id}/responses`, {
      answers,
    });

    setSubmitSuccess("Response submitted successfully!");
    setSubmitError("");

    setAnswers({});
  } catch (err) {
    console.error(err);
    const msg =
      err.response?.data?.message || "Failed to submit response. Check console.";
    setSubmitError(msg);
    setSubmitSuccess("");
  }
};



  const renderQuestionInput = (question) => {
    const { questionKey, type, label, options = [] } = question;
    const value = answers[questionKey];

    switch (type) {
      case "shortText":
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleTextChange(questionKey, e.target.value)}
            style={{
              padding: "0.4rem",
              minWidth: "260px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        );

      case "longText":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => handleTextChange(questionKey, e.target.value)}
            rows={4}
            style={{
              padding: "0.4rem",
              minWidth: "260px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        );

      case "singleSelect":
        return (
          <select
            value={value || ""}
            onChange={(e) =>
              handleSingleSelectChange(questionKey, e.target.value)
            }
            style={{
              padding: "0.4rem",
              minWidth: "260px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="">-- Select an option --</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "multiSelect":
        return (
          <select
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) => handleMultiSelectChange(questionKey, e)}
            style={{
              padding: "0.4rem",
              minWidth: "260px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              height: "6rem",
            }}
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "attachment":
        return (
          <input
            type="file"
            multiple
            onChange={(e) => handleAttachmentChange(questionKey, e)}
          />
        );

      default:
        return <span>Unsupported question type: {type}</span>;
    }
  };


  if (loading) {
    return <div style={{ padding: "1rem" }}>Loading form...</div>;
  }

  if (loadError) {
    return (
      <div style={{ padding: "1rem", color: "#b00020" }}>
        Error: {loadError}
      </div>
    );
  }

  if (!form) {
    return (
      <div style={{ padding: "1rem" }}>
        Form not found or failed to load.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "1.5rem",
        maxWidth: "720px",
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: "0.5rem" }}>{form.title}</h1>
      <p style={{ marginBottom: "1.5rem", fontSize: "0.9rem", color: "#555" }}>
        Base: {form.airtableBaseName || form.airtableBaseId} | Table:{" "}
        {form.airtableTableName || form.airtableTableId}
      </p>

      {submitError && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            backgroundColor: "#ffe5e5",
            color: "#b00020",
          }}
        >
          {submitError}
        </div>
      )}

      {submitSuccess && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            backgroundColor: "#e6ffed",
            color: "#0f5132",
          }}
        >
          {submitSuccess}
        </div>
      )}

      <form onSubmit={validateAndSubmit}>
        {form.questions.map((q) => {
          const visible = shouldShowQuestion(q.conditionalRules, answers);
          if (!visible) return null;

          return (
            <div
              key={q.questionKey}
              style={{
                marginBottom: "1rem",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid #eee",
              }}
            >
              <label style={{ display: "block", marginBottom: "0.4rem" }}>
                <span style={{ fontWeight: 600 }}>
                  {q.label || q.questionKey}
                </span>
                {q.required && (
                  <span style={{ color: "#b00020", marginLeft: "0.25rem" }}>
                    *
                  </span>
                )}
              </label>

              {renderQuestionInput(q)}
            </div>
          );
        })}

        <button
          type="submit"
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#2563eb",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Submit
        </button>
      </form>
    </div>
  );
}

export default FormViewer;
