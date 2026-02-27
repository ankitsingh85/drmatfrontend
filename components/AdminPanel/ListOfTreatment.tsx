"use client";
import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/listofcategory.module.css";
import { API_URL } from "@/config/api";

interface Treatment {
  _id: string;
  treatmentName: string;
  description: string;
  serviceCategory?: string;
  paymentOption?: string;
  mrp?: number;
  offerPrice?: number;
  createdAt?: string;
  clinic?:
    | {
        _id: string;
        clinicName: string;
      }
    | string;
}

const ListOfTreatment = () => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [search, setSearch] = useState("");
  const [filterClinic, setFilterClinic] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTreatments();
  }, []);

  const fetchTreatments = async () => {
    try {
      const res = await fetch(`${API_URL}/treatment-plans`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTreatments(data);
      } else {
        setError("Invalid data format");
      }
    } catch (err) {
      setError("Failed to fetch treatments");
    }
  };

  const clinicOptions = useMemo(() => {
    const map = new Map<string, string>();
    treatments.forEach((treatment) => {
      if (typeof treatment.clinic === "object" && treatment.clinic?._id) {
        map.set(treatment.clinic._id, treatment.clinic.clinicName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [treatments]);

  const filteredTreatments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return treatments.filter((treatment) => {
      const clinicName =
        typeof treatment.clinic === "object"
          ? treatment.clinic?.clinicName || ""
          : "";
      const isQueryMatch =
        treatment.treatmentName.toLowerCase().includes(query) ||
        clinicName.toLowerCase().includes(query);

      const isClinicMatch =
        filterClinic === "all" ||
        (typeof treatment.clinic === "object" &&
          treatment.clinic?._id === filterClinic);

      const isPaymentMatch =
        filterPayment === "all" || treatment.paymentOption === filterPayment;

      return isQueryMatch && isClinicMatch && isPaymentMatch;
    });
  }, [treatments, search, filterClinic, filterPayment]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTreatments.length / itemsPerPage)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterClinic, filterPayment, itemsPerPage]);

  const stripHtml = (value?: string) =>
    (value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  const handleDownloadCSV = () => {
    const rows = [
      [
        "Treatment Name",
        "Clinic",
        "Category",
        "Payment",
        "MRP",
        "Offer",
        "Description",
      ],
      ...filteredTreatments.map((treatment) => [
        treatment.treatmentName || "",
        typeof treatment.clinic === "object"
          ? treatment.clinic?.clinicName || ""
          : "",
        treatment.serviceCategory || "",
        treatment.paymentOption || "",
        treatment.mrp ?? "",
        treatment.offerPrice ?? "",
        stripHtml(treatment.description) || "",
      ]),
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
    link.download = "treatment-plans.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const printable = window.open("", "_blank");
    if (!printable) {
      alert("Unable to open print window. Please allow popups.");
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const rows = filteredTreatments
      .map(
        (treatment) => `<tr>
          <td>${escapeHtml(treatment.treatmentName || "-")}</td>
          <td>${escapeHtml(
            typeof treatment.clinic === "object"
              ? treatment.clinic?.clinicName || "-"
              : "-"
          )}</td>
          <td>${escapeHtml(treatment.serviceCategory || "-")}</td>
          <td>${escapeHtml(treatment.paymentOption || "-")}</td>
          <td>${escapeHtml(String(treatment.mrp ?? "-"))}</td>
          <td>${escapeHtml(String(treatment.offerPrice ?? "-"))}</td>
          <td>${escapeHtml(stripHtml(treatment.description) || "-")}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Treatment Plans</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Treatment Plans</h2>
          <table>
            <thead>
              <tr>
                <th>Treatment</th>
                <th>Clinic</th>
                <th>Category</th>
                <th>Payment</th>
                <th>MRP</th>
                <th>Offer</th>
                <th>Description</th>
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
  const paginatedTreatments = filteredTreatments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this treatment?")) return;
    try {
      const res = await fetch(`${API_URL}/treatment-plans/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTreatments(treatments.filter((t) => t._id !== id));
      } else {
        setError("Failed to delete treatment");
      }
    } catch (err) {
      setError("Failed to delete treatment");
    }
  };

  const handleEdit = (treatment: Treatment) => {
    setEditingTreatment(treatment);
    setEditName(treatment.treatmentName);
  };

  const handleUpdate = async () => {
    if (!editingTreatment) return;
    try {
      const res = await fetch(
        `${API_URL}/treatment-plans/${editingTreatment._id}`,
        {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ treatmentName: editName }),
        }
      );
      if (res.ok) {
        setTreatments(
          treatments.map((t) =>
            t._id === editingTreatment._id ? { ...t, treatmentName: editName } : t
          )
        );
        setEditingTreatment(null);
        setEditName("");
      } else {
        setError("Failed to update treatment");
      }
    } catch (err) {
      setError("Failed to update treatment");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>List of Treatments</h2>

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search treatments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />
        <select
          value={filterClinic}
          onChange={(e) => setFilterClinic(e.target.value)}
          className={styles.filter}
        >
          <option value="all">All Clinics</option>
          {clinicOptions.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
        </select>
        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className={styles.filter}
        >
          <option value="all">All Payments</option>
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
          <option value="EMI">EMI</option>
          <option value="Net Banking">Net Banking</option>
        </select>
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className={`${styles.filter} ${styles.pageFilter}`}
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
        <button
          type="button"
          className={styles.premiumButton}
          onClick={handleDownloadCSV}
        >
          Download Excel
        </button>
        <button
          type="button"
          className={styles.premiumButton}
          onClick={handleDownloadPDF}
        >
          Download PDF
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Treatment Name</th>
              <th>Clinic</th>
              <th>Category</th>
              <th>Payment</th>
              <th>MRP</th>
              <th>Offer</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTreatments.map((treatment) => (
              <tr key={treatment._id}>
                <td>
                  {editingTreatment?._id === treatment._id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={styles.editInput}
                    />
                  ) : (
                    treatment.treatmentName
                  )}
                </td>
                <td>
                  {typeof treatment.clinic === "object"
                    ? treatment.clinic?.clinicName
                    : "-"}
                </td>
                <td>{treatment.serviceCategory || "-"}</td>
                <td>{treatment.paymentOption || "-"}</td>
                <td>{treatment.mrp ?? "-"}</td>
                <td>{treatment.offerPrice ?? "-"}</td>
                <td>{stripHtml(treatment.description) || "-"}</td>
                <td>
                  {editingTreatment?._id === treatment._id ? (
                    <>
                      <button onClick={handleUpdate} className={styles.saveBtn}>
                        Save
                      </button>
                      <button
                        onClick={() => setEditingTreatment(null)}
                        className={styles.cancelBtn}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(treatment)}
                        className={styles.editBtn}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(treatment._id)}
                        className={styles.deleteBtn}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {paginatedTreatments.length === 0 && (
              <tr>
                <td colSpan={8}>No treatment plans found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
          Showing {paginatedTreatments.length} of {filteredTreatments.length}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={`${styles.premiumButton} ${
              currentPage === 1 ? styles.premiumButtonDisabled : ""
            }`}
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
            className={`${styles.premiumButton} ${
              currentPage === totalPages ? styles.premiumButtonDisabled : ""
            }`}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListOfTreatment;
