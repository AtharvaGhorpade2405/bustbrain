import React, { useEffect, useState } from "react";
import api from "../api/client";
import { Link } from "react-router-dom";

function Dashboard() {
  const [userInfo, setUserInfo] = useState(null);

  const [bases, setBases] = useState([]);
  const [selectedBaseId, setSelectedBaseId] = useState("");
  const [selectedBaseName, setSelectedBaseName] = useState("");

  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [selectedTableName, setSelectedTableName] = useState("");

  const [fields, setFields] = useState([]); 
  const [selectedFieldConfigs, setSelectedFieldConfigs] = useState({});
  const [formTitle, setFormTitle] = useState("");

  const [forms, setForms] = useState([]);

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingBases, setLoadingBases] = useState(true);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [savingForm, setSavingForm] = useState(false);
  const [loadingForms, setLoadingForms] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setError("");
        setSuccessMessage("");

        const [meRes, basesRes, formsRes] = await Promise.all([
          api.get("/airtable/me"),
          api.get("/airtable/bases"),
          api.get("/forms").catch(() => ({ data: [] })), 
        ]);

        setUserInfo(meRes.data);
        setBases(basesRes.data.bases || []);
        setForms(formsRes.data || []);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          setError("You are not logged in. Please log in with Airtable first.");
        } else {
          setError("Failed to load initial data from Airtable.");
        }
      } finally {
        setLoadingUser(false);
        setLoadingBases(false);
        setLoadingForms(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleBaseChange = async (event) => {
    const baseId = event.target.value;
    const base = bases.find((b) => b.id === baseId);

    setSelectedBaseId(baseId);
    setSelectedBaseName(base ? base.name : "");
    setTables([]);
    setSelectedTableId("");
    setSelectedTableName("");
    setFields([]);
    setSelectedFieldConfigs({});
    setFormTitle("");
    setSuccessMessage("");
    setError("");

    if (!baseId) return;

    try {
      setLoadingTables(true);
      const res = await api.get(`/airtable/bases/${baseId}/tables`);
      setTables(res.data.tables || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load tables for this base.");
    } finally {
      setLoadingTables(false);
    }
  };

  const handleTableChange = async (event) => {
    const tableId = event.target.value;
    const table = tables.find((t) => t.id === tableId);

    setSelectedTableId(tableId);
    setSelectedTableName(table ? table.name : "");
    setFields([]);
    setSelectedFieldConfigs({});
    setSuccessMessage("");
    setError("");

    if (!tableId || !selectedBaseId) return;

    try {
      setLoadingFields(true);
      const res = await api.get(
        `/airtable/bases/${selectedBaseId}/tables/${tableId}/fields`
      );
      setFields(res.data.fields || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load fields for this table.");
    } finally {
      setLoadingFields(false);
    }
  };

  const handleFieldCheckboxChange = (field) => {
    setSelectedFieldConfigs((prev) => {
      const copy = { ...prev };
      if (copy[field.id]) {
        delete copy[field.id];
      } else {
        copy[field.id] = {
          fieldId: field.id,
          name: field.name,
          type: field.type,
          internalType: field.internalType,
          label: field.name, 
          required: false,
          questionKey: field.id, 
        };
      }
      return copy;
    });
  };

  const handleFieldLabelChange = (fieldId, newLabel) => {
    setSelectedFieldConfigs((prev) => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        label: newLabel,
      },
    }));
  };

  const handleFieldRequiredChange = (fieldId, isRequired) => {
    setSelectedFieldConfigs((prev) => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        required: isRequired,
      },
    }));
  };

  const selectedFieldList = Object.values(selectedFieldConfigs);

  const handleSaveForm = async () => {
    try {
      setError("");
      setSuccessMessage("");

      if (!formTitle.trim()) {
        setError("Please enter a form title.");
        return;
      }
      if (!selectedBaseId || !selectedTableId) {
        setError("Please select a base and a table.");
        return;
      }
      if (selectedFieldList.length === 0) {
        setError("Please select at least one field for the form.");
        return;
      }

      const payload = {
        title: formTitle.trim(),
        airtableBaseId: selectedBaseId,
        airtableTableId: selectedTableId,
        airtableBaseName: selectedBaseName,
        airtableTableName: selectedTableName,
        questions: selectedFieldList.map((f) => ({
          questionKey: f.questionKey,
          airtableFieldId: f.fieldId,
          label: f.label,
          required: f.required,
        })),
      };

      setSavingForm(true);
      const res = await api.post("/forms", payload);

      setSuccessMessage(`Form "${res.data.title}" saved successfully.`);
      setError("");

      const formsRes = await api.get("/forms");
      setForms(formsRes.data || []);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message || "Failed to save form. Check console.";
      setError(msg);
    } finally {
      setSavingForm(false);
    }
  };


  if (loadingUser && loadingBases) {
    return <div style={{ padding: "1rem" }}>Loading dashboard...</div>;
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
      <h1 style={{ marginBottom: "1rem" }}>Airtable Form Builder</h1>

      {error && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            backgroundColor: "#ffe5e5",
            color: "#b00020",
          }}
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            backgroundColor: "#e6ffed",
            color: "#0f5132",
          }}
        >
          {successMessage}
        </div>
      )}

      <section
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      >
        <h2 style={{ marginBottom: "0.5rem" }}>Logged-in Airtable User</h2>

        {!userInfo ? (
          <p>Not logged in. Click "Login with Airtable" first.</p>
        ) : (
          <div>
            <p>
              <strong>User ID:</strong> {userInfo.id}
            </p>
            <p>
              <strong>Email:</strong> {userInfo.email || "N/A"}
            </p>
          </div>
        )}
      </section>

      <section
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      >
        <h2 style={{ marginBottom: "0.75rem" }}>1. Select a Base</h2>

        {loadingBases ? (
          <p>Loading bases...</p>
        ) : bases.length === 0 ? (
          <p>No bases found. Check Airtable permissions.</p>
        ) : (
          <>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Base:
            </label>
            <select
              value={selectedBaseId}
              onChange={handleBaseChange}
              style={{
                padding: "0.5rem",
                minWidth: "260px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            >
              <option value="">-- Choose a base --</option>
              {bases.map((base) => (
                <option key={base.id} value={base.id}>
                  {base.name}
                </option>
              ))}
            </select>
          </>
        )}
      </section>

      <section
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      >
        <h2 style={{ marginBottom: "0.75rem" }}>2. Select a Table</h2>

        {!selectedBaseId ? (
          <p>Select a base first.</p>
        ) : loadingTables ? (
          <p>Loading tables...</p>
        ) : tables.length === 0 ? (
          <p>No tables found in this base.</p>
        ) : (
          <>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Table:
            </label>
            <select
              value={selectedTableId}
              onChange={handleTableChange}
              style={{
                padding: "0.5rem",
                minWidth: "260px",
                borderRadius: "4px",
                border: "1px solid " + (selectedTableId ? "#ccc" : "#f00"),
              }}
            >
              <option value="">-- Choose a table --</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </>
        )}
      </section>

      <section
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      >
        <h2 style={{ marginBottom: "0.75rem" }}>
          3. Choose Fields for the Form
        </h2>

        {!selectedTableId ? (
          <p>Select a table to view its fields.</p>
        ) : loadingFields ? (
          <p>Loading fields...</p>
        ) : fields.length === 0 ? (
          <p>No supported fields found in this table.</p>
        ) : (
          <>
            <p style={{ marginBottom: "0.5rem" }}>
              Tick the fields you want in your form and edit their
              labels/required flag:
            </p>
            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {fields.map((field) => {
                const config = selectedFieldConfigs[field.id];
                const isSelected = !!config;
                return (
                  <li
                    key={field.id}
                    style={{
                      marginBottom: "0.6rem",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      border: "1px solid #eee",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleFieldCheckboxChange(field)}
                        style={{ marginRight: "0.5rem" }}
                      />
                      <div>
                        <div>
                          <strong>{field.name}</strong>{" "}
                          <span style={{ color: "#666", fontSize: "0.85rem" }}>
                            ({field.internalType})
                          </span>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div
                        style={{ marginTop: "0.5rem", marginLeft: "1.5rem" }}
                      >
                        <div style={{ marginBottom: "0.4rem" }}>
                          <label>
                            Label:{" "}
                            <input
                              type="text"
                              value={config.label}
                              onChange={(e) =>
                                handleFieldLabelChange(field.id, e.target.value)
                              }
                              style={{
                                padding: "0.3rem",
                                minWidth: "260px",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                              }}
                            />
                          </label>
                        </div>
                        <div>
                          <label>
                            <input
                              type="checkbox"
                              checked={config.required}
                              onChange={(e) =>
                                handleFieldRequiredChange(
                                  field.id,
                                  e.target.checked
                                )
                              }
                              style={{ marginRight: "0.4rem" }}
                            />
                            Required
                          </label>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <section
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      >
        <h2 style={{ marginBottom: "0.75rem" }}>4. Save Form Schema</h2>

        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Form title:{" "}
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              style={{
                padding: "0.4rem",
                minWidth: "320px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
          </label>
        </div>

        <button
          onClick={handleSaveForm}
          disabled={savingForm}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            border: "none",
            backgroundColor: savingForm ? "#888" : "#2563eb",
            color: "#fff",
            cursor: savingForm ? "default" : "pointer",
          }}
        >
          {savingForm ? "Saving..." : "Save Form"}
        </button>
      </section>

      <section
        style={{
          marginBottom: "2rem",
          padding: "1rem",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      >
        <h2 style={{ marginBottom: "0.75rem" }}>Your Saved Forms</h2>

        {loadingForms ? (
          <p>Loading forms...</p>
        ) : forms.length === 0 ? (
          <p>No forms saved yet.</p>
        ) : (
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {forms.map((form) => (
              <li
                key={form._id}
                style={{
                  marginBottom: "0.75rem",
                  paddingBottom: "0.75rem",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div>
                  <strong>{form.title}</strong>
                </div>

                <div style={{ fontSize: "0.85rem", color: "#555" }}>
                  Base: {form.airtableBaseName || form.airtableBaseId} | Table:{" "}
                  {form.airtableTableName || form.airtableTableId}
                </div>

                <div
                  style={{
                    marginTop: "0.5rem",
                    display: "flex",
                    gap: "0.75rem",
                  }}
                >
                  <Link
                    to={`/form/${form._id}`}
                    style={{ textDecoration: "underline", color: "#2563eb" }}
                  >
                    Open Form
                  </Link>
                  <Link
                    to={`/forms/${form._id}/responses`}
                    style={{ textDecoration: "underline", color: "#2563eb" }}
                  >
                    View Responses
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
