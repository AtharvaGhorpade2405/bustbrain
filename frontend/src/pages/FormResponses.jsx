import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";

function formatDateTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleString();
}

function FormResponses() {
  const { formId } = useParams();

  const [formInfo, setFormInfo] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setError("");
        setLoading(true);

        const res = await api.get(`/forms/${formId}/responses`);
        setFormInfo(res.data.form);
        setResponses(res.data.responses || []);
      } catch (err) {
        console.error(err);
        const msg =
          err.response?.data?.message ||
          "Failed to load responses for this form.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [formId]);

  if (loading) {
    return <div style={{ padding: "1rem" }}>Loading responses...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "1rem", color: "#b00020" }}>
        Error: {error}
      </div>
    );
  }

  if (!formInfo) {
    return (
      <div style={{ padding: "1rem" }}>
        Form not found or you do not have access.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "1.5rem",
        maxWidth: "960px",
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: "0.25rem" }}>
        Responses for: {formInfo.title}
      </h1>
      <p style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#555" }}>
        Base: {formInfo.airtableBaseName} | Table: {formInfo.airtableTableName}
      </p>

      <div style={{ marginBottom: "1rem" }}>
        <Link
          to={`/form/${formId}`}
          style={{ marginRight: "1rem", color: "#2563eb" }}
        >
          Back to Form Viewer
        </Link>
        <Link to="/dashboard" style={{ color: "#2563eb" }}>
          Back to Dashboard
        </Link>
      </div>

      {responses.length === 0 ? (
        <p>No responses yet.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.9rem",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                  padding: "0.5rem",
                }}
              >
                Submission ID
              </th>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                  padding: "0.5rem",
                }}
              >
                Created At
              </th>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                  padding: "0.5rem",
                }}
              >
                Status
              </th>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                  padding: "0.5rem",
                }}
              >
                Preview
              </th>
            </tr>
          </thead>
          <tbody>
            {responses.map((resp) => (
              <tr key={resp.id}>
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "0.5rem",
                    fontFamily: "monospace",
                  }}
                >
                  {resp.id}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "0.5rem",
                  }}
                >
                  {formatDateTime(resp.createdAt)}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "0.5rem",
                    textTransform: "capitalize",
                  }}
                >
                  {resp.status}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "0.5rem",
                    maxWidth: "360px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={resp.compactPreview}
                >
                  {resp.compactPreview || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default FormResponses;
