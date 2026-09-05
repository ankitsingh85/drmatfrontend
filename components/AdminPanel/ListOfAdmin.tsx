"use client";

import { API_URL } from "@/config/api";
import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/listofadmin.module.css";
import createStyles from "@/styles/Dashboard/adminpages.module.css";
import FullPageLoader from "@/components/common/FullPageLoader";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import TableActions from "@/components/AdminPanel/common/TableActions";
import BulkSelectBar from "@/components/AdminPanel/common/BulkSelectBar";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import bulkStyles from "@/styles/Dashboard/bulkSelect.module.css";

type PermissionRow = {
  module: string;
  view: boolean;
  create: boolean;
  delete: boolean;
};

interface Admin {
  _id: string;

  empId: string;

  name: string;

  email: string;

  phone: string;

  role: string;

  customRoleLabel?: string;

  permissions?: PermissionRow[];

  createdAt: string;

  lastModifiedAt?: string;

  lastModifiedField?: string;
}

type RoleChoice = "admin" | "superadmin" | "manager" | "custom";

// Mirrors ADMIN_MODULES / ADMIN_MODULE_LABELS in dermatbackend/src/models/admin.ts.
// Fetched from /admins/modules on mount; these are the fallback so the
// permissions table still renders (with the keys the backend expects)
// if that call fails.
const FALLBACK_MODULES = [
  "admin",
  "user",
  "productCategory",
  "product",
  "courseType",
  "trainingType",
  "course",
  "workshopTraining",
  "doctor",
  "clinicCategory",
  "clinic",
  "b2bProductCategory",
  "b2bProduct",
  "serviceCategory",
  "treatment",
  "onlineConsultationService",
  "others",
];

const FALLBACK_MODULE_LABELS: Record<string, string> = {
  admin: "Admin",
  user: "User",
  productCategory: "Product Category",
  product: "Product",
  courseType: "Course Type",
  trainingType: "Training Type",
  course: "Course",
  workshopTraining: "Workshop Training",
  doctor: "Doctor",
  clinicCategory: "Clinic Category",
  clinic: "Clinic",
  b2bProductCategory: "B2B Product Category",
  b2bProduct: "B2B Product",
  serviceCategory: "Treatment Category",
  treatment: "Treatment Plans",
  onlineConsultationService: "Online Consultation Services",
  others: "Others (Top Products, Offers, Featured Section, Shorts, Hiring Requests)",
};

const FIXED_ROLES: RoleChoice[] = ["admin", "superadmin", "manager"];

const buildEmptyPermissions = (modules: string[]): PermissionRow[] =>
  modules.map((module) => ({ module, view: false, create: false, delete: false }));

const slugifyRole = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "manager";

type ListOfAdminProps = {
  canEdit?: boolean;
  canDelete?: boolean;
};

export default function ListOfAdmin({ canEdit = true, canDelete = true }: ListOfAdminProps) {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  /* 🔍 FILTER STATE */
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /* ✏️ EDIT STATE */
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [editForm, setEditForm] = useState<
    Partial<Admin & { password?: string; roleChoice?: RoleChoice }>
  >({});
  const [editPermissions, setEditPermissions] = useState<PermissionRow[]>([]);
  const [modules, setModules] = useState<string[]>(FALLBACK_MODULES);
  const [moduleLabels, setModuleLabels] = useState<Record<string, string>>(
    FALLBACK_MODULE_LABELS
  );

  const premiumButtonStyle: React.CSSProperties = {
    border: "none",
    borderRadius: 10,
    padding: "10px 16px",
    background: "linear-gradient(180deg, #2981b7 0%, #10678c 100%)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0.2,
    boxShadow: "0 4px 10px rgba(15, 23, 42, 0.14)",
    cursor: "pointer",
  };

  const premiumButtonDisabledStyle: React.CSSProperties = {
    opacity: 0.5,
    cursor: "not-allowed",
  };

  useEffect(() => {
    fetchAdmins();
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const res = await fetch(`${API_URL}/admins/modules`);
      const data = await res.json();
      if (Array.isArray(data?.modules) && data.modules.length) {
        setModules(data.modules);
      }
      if (data?.labels && typeof data.labels === "object") {
        setModuleLabels(data.labels);
      }
    } catch (error) {
      console.error("Failed to fetch admin modules, using fallback list", error);
    }
  };
  
const fetchAdmins = async () => {
  try {

    const res = await fetch(`${API_URL}/admins`);

    const data = await res.json();


    // old API response = array
    // new API response = {success:true, admins:[]}

    setAdmins(
      Array.isArray(data)
      ? data
      : data.admins || []
    );


  } 
  
  catch (error) {

    console.error(
      "Error fetching admins:",
      error
    );

    setAdmins([]);

  } 
  
  finally {

    setLoading(false);

  }
};

  /* ================= FILTERED ADMINS ================= */
  const filteredAdmins = useMemo(() => {
    let data = [...admins];

    if (search) {
      data = data.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.email.toLowerCase().includes(search.toLowerCase()) ||
          a.empId.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      data = data.filter((a) => a.role === roleFilter);
    }

    return data;
  }, [admins, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAdmins.slice(start, start + itemsPerPage);
  }, [filteredAdmins, currentPage, itemsPerPage]);

  const bulkSelection = useBulkSelection(paginatedAdmins, (admin) => admin._id);

  const summarizePermissions = (admin: Admin) => {
    if (admin.role === "superadmin") return "Full Access";
    const count = (admin.permissions || []).filter((p) => p.view).length;
    return `${count} module${count === 1 ? "" : "s"}`;
  };

  const handleDownloadCSV = () => {
    const rows = [

[
"Admin ID",
"Name",
"Email",
"Phone",
"Role",
"Custom Role",
"Permissions",
"Created",
"Last Modified",
"Last Modified Field"
],


...filteredAdmins.map((a)=>[

a.empId,

a.name,

a.email,

a.phone,

a.role,

a.customRoleLabel || "-",

summarizePermissions(a),

a.createdAt ? String(a.createdAt).slice(0, 10) : "-",

a.lastModifiedAt
?
new Date(a.lastModifiedAt)
.toLocaleString("en-IN")
:
"-",

a.lastModifiedField || "-"

])

];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "admins.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const printable = window.open("", "_blank");
    if (!printable) {
      toast.error("Unable to open print window. Please allow popups.");
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const rows = filteredAdmins
      .map(
        (a) => `<tr>
          <td>${escapeHtml(a.empId)}</td>
          <td>${escapeHtml(a.name)}</td>
          <td>${escapeHtml(a.email)}</td>
          <td>${escapeHtml(a.phone || "-")}</td>
          <td>${escapeHtml(a.role)}</td>
          <td>${escapeHtml(a.customRoleLabel || "-")}</td>
          <td>${escapeHtml(summarizePermissions(a))}</td>
          <td>${escapeHtml(a.createdAt ? String(a.createdAt).slice(0, 10) : "-")}</td>
          <td>${escapeHtml(a.lastModifiedAt ? String(a.lastModifiedAt).slice(0, 10) : "-")}</td>
          <td>${escapeHtml(a.lastModifiedField || "-")}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Admins List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Admins List</h2>
          <table>
            <thead>
              <tr>
                <th>Admin ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Custom Role</th>
                <th>Permissions</th>
                <th>Created</th>
                <th>Last Modified</th>
                <th>Last Modified Field</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printable.document.close();
    printable.focus();
    printable.print();
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    if (!(await confirmDialog("Are you sure you want to delete this admin?", { danger: true }))) return;
    await fetch(`${API_URL}/admins/${id}`, { method: "DELETE" });
    fetchAdmins();
  };

  /* ================= EDIT ================= */
  const handleEdit = (admin: Admin) => {
    const isCustom = !FIXED_ROLES.includes(admin.role as RoleChoice);

    setEditingAdmin(admin);
    setEditForm({
      empId: admin.empId,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      roleChoice: isCustom ? "custom" : (admin.role as RoleChoice),
      customRoleLabel: admin.customRoleLabel || (isCustom ? admin.role : ""),
      password: "",
    });

    // Merge the admin's saved permissions onto the current module list —
    // any module they don't have a saved row for defaults to no access.
    const byModule = new Map((admin.permissions || []).map((p) => [p.module, p]));
    setEditPermissions(
      modules.map((module) => {
        const found = byModule.get(module);
        return {
          module,
          view: Boolean(found?.view),
          create: Boolean(found?.create),
          delete: Boolean(found?.delete),
        };
      })
    );
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  /* ================= EDIT PERMISSIONS TABLE HANDLERS ================= */
  const toggleEditCell = (module: string, action: "view" | "create" | "delete") => {
    setEditPermissions((prev) =>
      prev.map((row) =>
        row.module === module ? { ...row, [action]: !row[action] } : row
      )
    );
  };

  const toggleEditRowAll = (module: string) => {
    setEditPermissions((prev) =>
      prev.map((row) => {
        if (row.module !== module) return row;
        const allOn = row.view && row.create && row.delete;
        return { ...row, view: !allOn, create: !allOn, delete: !allOn };
      })
    );
  };

  const toggleEditColumnAll = (action: "view" | "create" | "delete") => {
    setEditPermissions((prev) => {
      const allOn = prev.every((row) => row[action]);
      return prev.map((row) => ({ ...row, [action]: !allOn }));
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    const roleChoice = editForm.roleChoice || "admin";
    const roleMap: Record<RoleChoice, string> = {
      admin: "admin",
      superadmin: "superadmin",
      manager: "manager",
      custom: slugifyRole(editForm.customRoleLabel || ""),
    };
    const resolvedRole = roleMap[roleChoice];

    const payload: any = {
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      role: resolvedRole,
      ...(roleChoice === "custom"
        ? { customRoleLabel: (editForm.customRoleLabel || "").trim() }
        : {}),
      // Super Admin's permissions are forced to full-access server-side
      // regardless of what's sent, but we still send the current table
      // for every other role so the edit is actually saved.
      permissions: resolvedRole === "superadmin" ? [] : editPermissions,
    };
    if (editForm.password) payload.password = editForm.password;

    await fetch(`${API_URL}/admins/${editingAdmin._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setEditingAdmin(null);
    setEditForm({});
    setEditPermissions([]);
    fetchAdmins();
    toast.success("Admin updated successfully");
  };

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <div className={styles.container}>
      {/* <h1 className={styles.heading}>List of Admin</h1> */}

      {/* 🔍 SEARCH & FILTER */}
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by name, email or Admin ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className={styles.filter}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Super Admin</option>
          <option value="manager">Manager</option>
        </select>
        <select
          className={`${styles.filter} ${styles.pageFilter}`}
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}/page
            </option>
          ))}
        </select>
        <button type="button" style={premiumButtonStyle} onClick={handleDownloadCSV}>
          Download CSV
        </button>
        <button type="button" style={premiumButtonStyle} onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <BulkSelectBar
        endpointPath="admins"
        selectedIds={Array.from(bulkSelection.selectedIds)}
        noun="admins"
        canDelete={canDelete}
        onClear={bulkSelection.clear}
        onDeleted={(deletedIds) => {
          setAdmins((prev) => prev.filter((admin) => !deletedIds.includes(admin._id)));
          bulkSelection.removeIds(deletedIds);
        }}
      />
      {filteredAdmins.length === 0 ? (
        <div className={styles.noData}>No admins found.</div>
      ) : (
        <div className={`${styles.tableWrapper} ${bulkStyles.tableScroll}`}>
          <table className={styles.table}>
           <thead>
<tr>

  {canDelete && (
    <th className={bulkStyles.checkboxCell}>
      <input
        type="checkbox"
        checked={bulkSelection.isAllSelected}
        ref={(el) => {
          if (el) el.indeterminate = bulkSelection.isSomeSelected;
        }}
        onChange={bulkSelection.toggleAll}
        aria-label="Select all admins on this page"
      />
    </th>
  )}

  <th>Admin ID</th>

  <th>Name</th>

  <th>Email</th>

  <th>Contact No.</th>

  <th>Role</th>

  <th>Custom Role</th>

  <th>Permissions</th>

  <th>Created</th>

  <th>Last Modified</th>

  <th>Last Modified Field</th>

  <th>Actions</th>

</tr>
</thead>

            <tbody>
              {paginatedAdmins.map((admin) => (
               <tr key={admin._id}>

{canDelete && (
  <td className={bulkStyles.checkboxCell}>
    <input
      type="checkbox"
      checked={bulkSelection.isSelected(admin._id)}
      onChange={() => bulkSelection.toggle(admin._id)}
      aria-label={`Select ${admin.name}`}
    />
  </td>
)}

{/* ADMIN ID */}

<td>

 {admin.empId}

</td>



<td>

 {admin.name}

</td>



<td>

 {admin.email}

</td>



<td>

 {admin.phone}

</td>




<td>

 <span
 className={`${styles.badge} ${styles[admin.role]}`}
 >

 {admin.role}

 </span>

</td>

<td>
 {admin.customRoleLabel || "-"}
</td>

<td>
 {summarizePermissions(admin)}
</td>

<td>
 {admin.createdAt ? String(admin.createdAt).slice(0, 10) : "-"}
</td>

<td>
 {admin.lastModifiedAt ? String(admin.lastModifiedAt).slice(0, 10) : "-"}
</td>

<td>
 {admin.lastModifiedField || "-"}
</td>




                  {/* ✅ ICON ACTIONS */}
                  <td className={styles.actions}>
                    <TableActions
                      onEdit={() => handleEdit(admin)}
                      onDelete={() => handleDelete(admin._id)}
                      canEdit={canEdit}
                      canDelete={canDelete}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {filteredAdmins.length > 0 && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <p style={{ margin: 0 }}>
            Showing {paginatedAdmins.length} of {filteredAdmins.length}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              style={{
                ...premiumButtonStyle,
                ...(currentPage === 1 ? premiumButtonDisabledStyle : {}),
              }}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <span style={{ alignSelf: "center" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              style={{
                ...premiumButtonStyle,
                ...(currentPage === totalPages ? premiumButtonDisabledStyle : {}),
              }}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ================= INLINE EDIT FORM ================= */}
      {editingAdmin && (
        <div className={createStyles.container} style={{ marginTop: 40 }}>
          <h1 className={createStyles.heading}>Edit Admin</h1>

          <form className={createStyles.form} onSubmit={handleEditSubmit}>
            <div className={createStyles.section}>
              <h2 className={createStyles.sectionTitle}>Admin Information</h2>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Employee ID</label>
                <input
                  value={editForm.empId || ""}
                  disabled
                  className={createStyles.input}
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Name</label>
                <input
                  name="name"
                  value={editForm.name || ""}
                  onChange={handleEditChange}
                  className={createStyles.input}
                  required
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Email</label>
                <input
                  name="email"
                  value={editForm.email || ""}
                  onChange={handleEditChange}
                  className={createStyles.input}
                  required
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Phone</label>
                <input
                  name="phone"
                  value={editForm.phone || ""}
                  onChange={handleEditChange}
                  className={createStyles.input}
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Role</label>
                <select
                  name="roleChoice"
                  value={editForm.roleChoice || "admin"}
                  onChange={handleEditChange}
                  className={createStyles.select}
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                  <option value="manager">Manager</option>
                  <option value="custom">Custom Role...</option>
                </select>
                {editForm.roleChoice === "superadmin" && (
                  <p style={{ fontSize: "12px", color: "#666", marginTop: "6px" }}>
                    Super Admin always has full access to every section.
                  </p>
                )}
              </div>

              {editForm.roleChoice === "custom" && (
                <div className={createStyles.field}>
                  <label className={createStyles.label}>Custom Role Name</label>
                  <input
                    name="customRoleLabel"
                    value={editForm.customRoleLabel || ""}
                    onChange={handleEditChange}
                    className={createStyles.input}
                    placeholder="e.g. Support Staff"
                    required
                  />
                </div>
              )}
            </div>

            {editForm.roleChoice !== "superadmin" && (
              <div className={createStyles.section}>
                <h2 className={createStyles.sectionTitle}>Module Permissions</h2>

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
                            onClick={() => toggleEditColumnAll(action)}
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
                      {editPermissions.map((row) => (
                        <tr key={row.module}>
                          <td
                            style={{
                              padding: "8px",
                              border: "1px solid #ddd",
                              cursor: "pointer",
                            }}
                            onClick={() => toggleEditRowAll(row.module)}
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
                                onChange={() => toggleEditCell(row.module, action)}
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

            <div className={createStyles.section}>
              <h2 className={createStyles.sectionTitle}>Update Password</h2>
              <div className={createStyles.field}>
                <label className={createStyles.label}>
                  New Password (optional)
                </label>
                <input
                  type="password"
                  name="password"
                  value={editForm.password || ""}
                  onChange={handleEditChange}
                  className={createStyles.input}
                />
              </div>
            </div>

            <button type="submit" className={createStyles.submitBtn}>
              Update Admin
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
