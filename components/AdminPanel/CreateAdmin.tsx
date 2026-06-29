"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/adminpages.module.css";

/* ================= MODULES =================
   Mirrors ADMIN_MODULES in models/admin.ts. Fetched from
   /admins/modules on mount, with this as a fallback so the form still
   renders if that call fails.
*/
const FALLBACK_MODULES = [
  "Dashboard",
  "Clinics",
  "Clinic Categories",
  "B2B Products",
  "B2B Categories",
  "Treatment Plans",
  "Service Categories",
  "Customers",
  "Admins",
];

type PermissionRow = {
  module: string;
  view: boolean;
  create: boolean;
  delete: boolean;
};

type AccessLevel = "Super Admin" | "System Admin" | "Manager" | "Custom";

interface ExistingAdmin {
  _id: string;
  name: string;
  empId: string;
  role: string;
  customRoleLabel?: string;
  permissions: PermissionRow[];
}

const buildEmptyPermissions = (modules: string[]): PermissionRow[] =>
  modules.map((module) => ({ module, view: false, create: false, delete: false }));

const slugifyRole = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "manager";

export default function CreateAdmin() {
  const [userId] = useState(`ADM-${Date.now().toString().slice(-6)}`);
  const [modules, setModules] = useState<string[]>(FALLBACK_MODULES);
  const [moduleLabels, setModuleLabels] = useState<Record<string, string>>({});
  const [existingAdmins, setExistingAdmins] = useState<ExistingAdmin[]>([]);
  const [copyFromId, setCopyFromId] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    accessLevel: "Manager" as AccessLevel,
    customRoleLabel: "",
  });

  const [permissions, setPermissions] = useState<PermissionRow[]>(
    buildEmptyPermissions(FALLBACK_MODULES)
  );

  const [success, setSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    accessLevel: "",
    customRoleLabel: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    accessLevel: false,
    customRoleLabel: false,
  });

  const nameRegex = /^[A-Za-z ]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  /* ================= FETCH MODULES + EXISTING ADMINS ================= */
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch(`${API_URL}/admins/modules`);
        const data = await res.json();
        if (Array.isArray(data?.modules) && data.modules.length) {
          setModules(data.modules);
          setPermissions(buildEmptyPermissions(data.modules));
        }
        if (data?.labels && typeof data.labels === "object") {
          setModuleLabels(data.labels);
        }
      } catch (err) {
        console.error("Failed to fetch admin modules, using fallback list", err);
      }
    };

    const fetchAdmins = async () => {
      try {
        const res = await fetch(`${API_URL}/admins`);
        const data = await res.json();
        if (Array.isArray(data?.admins)) {
          setExistingAdmins(data.admins);
        }
      } catch (err) {
        console.error("Failed to fetch existing admins", err);
      }
    };

    fetchModules();
    fetchAdmins();
  }, []);

  const showPermissionsTable = form.accessLevel !== "Super Admin";

  /* ================= VALIDATION ================= */
  const validateField = (name: string, value: string, currentForm = form) => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Name is required";
        if (!nameRegex.test(value.trim())) {
          return "Name should contain only letters and spaces";
        }
        return "";
      case "email":
        if (!value.trim()) return "Email is required";
        if (!emailRegex.test(value.trim())) return "Enter a valid email address";
        return "";
      case "phone":
        if (!value.trim()) return "";
        if (!/^\d*$/.test(value)) {
          return "Contact No. can contain digits only";
        }
        if (value.length !== 10) {
          return "Contact No. must contain exactly 10 digits";
        }
        return "";
      case "password":
        if (!value) return "Password is required";
        if (!passwordRegex.test(value)) {
          return "Use 8+ chars with a letter, a number, and a symbol";
        }
        return "";
      case "confirmPassword":
        if (!value) return "Confirm password is required";
        if (value !== currentForm.password) return "Passwords do not match";
        return "";
      case "accessLevel":
        return "";
      case "customRoleLabel":
        if (currentForm.accessLevel === "Custom" && !value.trim()) {
          return "Enter a name for this custom role";
        }
        return "";
      default:
        return "";
    }
  };

  const validateForm = (currentForm = form) => {
    const nextErrors = {
      name: validateField("name", currentForm.name, currentForm),
      email: validateField("email", currentForm.email, currentForm),
      phone: validateField("phone", currentForm.phone, currentForm),
      password: validateField("password", currentForm.password, currentForm),
      confirmPassword: validateField(
        "confirmPassword",
        currentForm.confirmPassword,
        currentForm
      ),
      accessLevel: validateField(
        "accessLevel",
        currentForm.accessLevel,
        currentForm
      ),
      customRoleLabel: validateField(
        "customRoleLabel",
        currentForm.customRoleLabel,
        currentForm
      ),
    };

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const nextValue =
      name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    const nextForm = {
      ...form,
      [name]: nextValue,
    };

    setForm(nextForm);
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, nextValue, nextForm),
      ...(name === "password"
        ? {
            confirmPassword: validateField(
              "confirmPassword",
              nextForm.confirmPassword,
              nextForm
            ),
          }
        : {}),
      ...(name === "accessLevel"
        ? {
            customRoleLabel: validateField(
              "customRoleLabel",
              nextForm.customRoleLabel,
              nextForm
            ),
          }
        : {}),
    }));
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Switching to Super Admin clears the permissions table back to
    // empty since it isn't used / displayed for that tier.
    if (name === "accessLevel" && value === "Super Admin") {
      setCopyFromId("");
    }

    setSuccess("");
    setSubmitError("");
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value, form),
    }));
  };

  /* ================= PERMISSIONS TABLE HANDLERS ================= */
  const toggleCell = (module: string, action: "view" | "create" | "delete") => {
    setPermissions((prev) =>
      prev.map((row) =>
        row.module === module ? { ...row, [action]: !row[action] } : row
      )
    );
    setCopyFromId(""); // manual edits clear the "copied from" selection
  };

  const toggleRowAll = (module: string) => {
    setPermissions((prev) =>
      prev.map((row) => {
        if (row.module !== module) return row;
        const allOn = row.view && row.create && row.delete;
        return { ...row, view: !allOn, create: !allOn, delete: !allOn };
      })
    );
    setCopyFromId("");
  };

  const toggleColumnAll = (action: "view" | "create" | "delete") => {
    setPermissions((prev) => {
      const allOn = prev.every((row) => row[action]);
      return prev.map((row) => ({ ...row, [action]: !allOn }));
    });
    setCopyFromId("");
  };

  /* ================= COPY PERMISSIONS FROM EXISTING ADMIN ================= */
  const handleCopyFrom = (adminId: string) => {
    setCopyFromId(adminId);
    if (!adminId) return;

    const source = existingAdmins.find((a) => a._id === adminId);
    if (!source) return;

    // Map the source admin's saved permissions onto the current module
    // list, defaulting any module the source didn't have to "off".
    const sourceByModule = new Map(
      (source.permissions || []).map((p) => [p.module, p])
    );
    setPermissions(
      modules.map((module) => {
        const found = sourceByModule.get(module);
        return {
          module,
          view: Boolean(found?.view),
          create: Boolean(found?.create),
          delete: Boolean(found?.delete),
        };
      })
    );
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateForm();
    const hasErrors = Object.values(nextErrors).some(Boolean);
    setTouched({
      name: true,
      email: true,
      phone: false,
      password: true,
      confirmPassword: true,
      accessLevel: false,
      customRoleLabel: form.accessLevel === "Custom",
    });
    if (hasErrors) return;

    const roleMap: Record<AccessLevel, string> = {
      "Super Admin": "superadmin",
      "System Admin": "admin",
      Manager: "manager",
      Custom: slugifyRole(form.customRoleLabel),
    };

    const resolvedRole = roleMap[form.accessLevel];

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      ...(form.phone && { phone: form.phone.trim() }),
      role: resolvedRole,
      ...(form.accessLevel === "Custom"
        ? { customRoleLabel: form.customRoleLabel.trim() }
        : {}),
      // Super Admin's permissions are forced to full-access server-side
      // regardless of what's sent, but we still send the current table
      // for every other role.
      permissions: form.accessLevel === "Super Admin" ? [] : permissions,
    };

    try {
      const res = await fetch(`${API_URL}/admins`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSuccess("Admin account created successfully");
      setSubmitError("");
      setErrors({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        accessLevel: "",
        customRoleLabel: "",
      });
      setTouched({
        name: false,
        email: false,
        phone: false,
        password: false,
        confirmPassword: false,
        accessLevel: false,
        customRoleLabel: false,
      });
      window.dispatchEvent(new Event("admin-dashboard:create-success"));

      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        accessLevel: "Manager",
        customRoleLabel: "",
      });
      setPermissions(buildEmptyPermissions(modules));
      setCopyFromId("");
    } catch (err: any) {
      setSuccess("");
      setSubmitError(err.message || "Failed to create admin");
    }
  };

  const copyableAdmins = useMemo(
    () => existingAdmins.filter((a) => a.role !== "superadmin"),
    [existingAdmins]
  );

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Login / Profile</h3>
{/* 
          <div className={styles.field}>
            <label className={styles.label}>User ID</label>
            <input className={styles.readonlyInput} value={userId} disabled />
          </div> */}

          <div className={styles.field}>
            <label className={styles.label}>
              Name
              <span className={styles.required}> *</span>
            </label>
            <input
              className={styles.input}
              name="name"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter full name"
              required
            />
            {touched.name && errors.name && (
              <p className={styles.fieldError}>{errors.name}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Email
              <span className={styles.required}> *</span>
            </label>
            <input
              className={styles.input}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter email address"
              required
            />
            {touched.email && errors.email && (
              <p className={styles.fieldError}>{errors.email}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Contact No.</label>
            <input
              className={styles.input}
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter contact number"
              inputMode="numeric"
              maxLength={10}
              pattern="[0-9]{10}"
              title="Enter exactly 10 digits"
              required
            />
            {touched.phone && errors.phone && (
              <p className={styles.fieldError}>{errors.phone}</p>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Security</h3>

          <div className={styles.field}>
            <label className={styles.label}>
              Password
              <span className={styles.required}> *</span>
            </label>
            <input
              className={styles.input}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Create a password"
              minLength={8}
              autoComplete="new-password"
              title="Use at least 8 characters with letters, numbers, and a symbol"
              required
            />
            {touched.password && errors.password && (
              <p className={styles.fieldError}>{errors.password}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Confirm Password
              <span className={styles.required}> *</span>
            </label>
            <input
              className={styles.input}
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Re-enter password"
              minLength={8}
              autoComplete="new-password"
              required
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <p className={styles.fieldError}>{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Access Level</h3>

          <div className={styles.field}>
            <label className={styles.label}>Grant Access</label>
            <select
              className={styles.select}
              name="accessLevel"
              value={form.accessLevel}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              <option value="Super Admin">Super Admin</option>
              <option value="System Admin">System Admin</option>
              <option value="Manager">Manager</option>
              <option value="Custom">Custom Role...</option>
            </select>
            {form.accessLevel === "Super Admin" && (
              <p style={{ fontSize: "12px", color: "#666", marginTop: "6px" }}>
                Super Admin always has full access to every section and can
                never be deleted.
              </p>
            )}
          </div>

          {form.accessLevel === "Custom" && (
            <div className={styles.field}>
              <label className={styles.label}>
                Custom Role Name
                <span className={styles.required}> *</span>
              </label>
              <input
                className={styles.input}
                name="customRoleLabel"
                value={form.customRoleLabel}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. Support Staff"
              />
              {touched.customRoleLabel && errors.customRoleLabel && (
                <p className={styles.fieldError}>{errors.customRoleLabel}</p>
              )}
            </div>
          )}

          {/* ===== PERMISSIONS TABLE (everything except Super Admin) ===== */}
          {showPermissionsTable && (
            <div className={styles.field}>
              <label className={styles.label}>Module Permissions</label>

              {copyableAdmins.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <label style={{ fontSize: "13px", display: "block", marginBottom: "4px" }}>
                    Copy permissions from an existing admin (optional)
                  </label>
                  <select
                    className={styles.select}
                    value={copyFromId}
                    onChange={(e) => handleCopyFrom(e.target.value)}
                  >
                    <option value="">Start from blank</option>
                    {copyableAdmins.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name} ({a.customRoleLabel || a.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f4f4f4" }}>
                      <th style={{ textAlign: "left", padding: "8px", border: "1px solid #ddd" }}>
                        Module
                      </th>
                      {(["view", "create", "delete"] as const).map((action) => (
                        <th
                          key={action}
                          style={{
                            padding: "8px",
                            border: "1px solid #ddd",
                            textAlign: "center",
                            cursor: "pointer",
                          }}
                          onClick={() => toggleColumnAll(action)}
                          title={`Toggle ${action} for all modules`}
                        >
                          {action === "view"
                            ? "View"
                            : action === "create"
                            ? "Create / Modify"
                            : "Delete"}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((row) => (
                      <tr key={row.module}>
                        <td
                          style={{
                            padding: "8px",
                            border: "1px solid #ddd",
                            cursor: "pointer",
                          }}
                          onClick={() => toggleRowAll(row.module)}
                          title="Toggle all permissions for this module"
                        >
                          {moduleLabels[row.module] || row.module}
                        </td>
                        {(["view", "create", "delete"] as const).map((action) => (
                          <td
                            key={action}
                            style={{
                              padding: "8px",
                              border: "1px solid #ddd",
                              textAlign: "center",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={row[action]}
                              onChange={() => toggleCell(row.module, action)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {submitError && <p className={styles.submitError}>{submitError}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <button className={styles.submitBtn} type="submit">
          Save Admin
        </button>
      </form>
    </div>
  );
}