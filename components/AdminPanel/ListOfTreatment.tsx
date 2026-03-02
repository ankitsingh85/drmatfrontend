"use client";
import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/listofcategory.module.css";
import { API_URL } from "@/config/api";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import editStyles from "@/styles/Dashboard/createUser.module.css";

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

interface TreatmentEditForm {
  treatmentName: string;
  clinicId: string;
  serviceCategory: string;
  paymentOption: string;
  mrp: string;
  offerPrice: string;
  description: string;
}

const ListOfTreatment = () => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [search, setSearch] = useState("");
  const [filterClinic, setFilterClinic] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [editForm, setEditForm] = useState<TreatmentEditForm>({
    treatmentName: "",
    clinicId: "",
    serviceCategory: "",
    paymentOption: "",
    mrp: "",
    offerPrice: "",
    description: "",
  });
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
    const clinicId =
      typeof treatment.clinic === "object"
        ? treatment.clinic?._id || ""
        : typeof treatment.clinic === "string"
        ? treatment.clinic
        : "";

    setEditingTreatment(treatment);
    setEditForm({
      treatmentName: treatment.treatmentName || "",
      clinicId,
      serviceCategory: treatment.serviceCategory || "",
      paymentOption: treatment.paymentOption || "",
      mrp: treatment.mrp != null ? String(treatment.mrp) : "",
      offerPrice: treatment.offerPrice != null ? String(treatment.offerPrice) : "",
      description: treatment.description || "",
    });
    setError("");
  };

  const handleUpdate = async () => {
    if (!editingTreatment) return;
    if (!editForm.treatmentName.trim()) {
      setError("Treatment name is required");
      return;
    }

    const parsedMrp =
      editForm.mrp.trim() === "" ? undefined : Number(editForm.mrp);
    const parsedOffer =
      editForm.offerPrice.trim() === "" ? undefined : Number(editForm.offerPrice);

    if (
      (parsedMrp !== undefined && Number.isNaN(parsedMrp)) ||
      (parsedOffer !== undefined && Number.isNaN(parsedOffer))
    ) {
      setError("MRP and Offer Price must be valid numbers");
      return;
    }

    const payload = {
      treatmentName: editForm.treatmentName.trim(),
      clinic: editForm.clinicId || undefined,
      serviceCategory: editForm.serviceCategory.trim(),
      paymentOption: editForm.paymentOption.trim(),
      mrp: parsedMrp,
      offerPrice: parsedOffer,
      description: editForm.description,
    };

    try {
      const res = await fetch(
        `${API_URL}/treatment-plans/${editingTreatment._id}`,
        {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        const clinicMatch = clinicOptions.find((c) => c.id === payload.clinic);
        setTreatments(
          treatments.map((t) =>
            t._id === editingTreatment._id
              ? {
                  ...t,
                  treatmentName: payload.treatmentName,
                  serviceCategory: payload.serviceCategory || undefined,
                  paymentOption: payload.paymentOption || undefined,
                  mrp: payload.mrp,
                  offerPrice: payload.offerPrice,
                  description: payload.description,
                  clinic: payload.clinic
                    ? {
                        _id: payload.clinic,
                        clinicName:
                          clinicMatch?.name ||
                          (typeof t.clinic === "object"
                            ? t.clinic?.clinicName || "-"
                            : "-"),
                      }
                    : t.clinic,
                }
              : t
          )
        );
        setEditingTreatment(null);
        setEditForm({
          treatmentName: "",
          clinicId: "",
          serviceCategory: "",
          paymentOption: "",
          mrp: "",
          offerPrice: "",
          description: "",
        });
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
        {/* <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className={`${styles.filter} ${styles.pageFilter}`}
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select> */}
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
                <td>{treatment.treatmentName}</td>
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
                  <>
                    <button
                      onClick={() => handleEdit(treatment)}
                      className={styles.editBtn}
                      title="Edit treatment"
                      aria-label="Edit treatment"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDelete(treatment._id)}
                      className={styles.deleteBtn}
                      title="Delete treatment"
                      aria-label="Delete treatment"
                    >
                      <FiTrash2 />
                    </button>
                  </>
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

      {editingTreatment && (
        <div className={editStyles.container} style={{ marginTop: 40 }}>
          <h1 className={editStyles.heading}>Edit Treatment</h1>

          <form
            className={editStyles.form}
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdate();
            }}
          >
            <div className={editStyles.section}>
              <h2 className={editStyles.sectionTitle}>Treatment Information</h2>

              <div className={editStyles.field}>
                <label className={editStyles.label}>Treatment Name</label>
                <input
                  type="text"
                  value={editForm.treatmentName}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      treatmentName: e.target.value,
                    }))
                  }
                  className={editStyles.input}
                  placeholder="Treatment name"
                />
              </div>

              <div className={editStyles.field}>
                <label className={editStyles.label}>Clinic</label>
                <select
                  value={editForm.clinicId}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, clinicId: e.target.value }))
                  }
                  className={editStyles.select}
                >
                  <option value="">Select clinic</option>
                  {clinicOptions.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={editStyles.field}>
                <label className={editStyles.label}>Category</label>
                <input
                  type="text"
                  value={editForm.serviceCategory}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      serviceCategory: e.target.value,
                    }))
                  }
                  className={editStyles.input}
                  placeholder="Service category"
                />
              </div>

              <div className={editStyles.field}>
                <label className={editStyles.label}>Payment Option</label>
                <select
                  value={editForm.paymentOption}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      paymentOption: e.target.value,
                    }))
                  }
                  className={editStyles.select}
                >
                  <option value="">Select payment option</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="EMI">EMI</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              <div className={editStyles.field}>
                <label className={editStyles.label}>MRP</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.mrp}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, mrp: e.target.value }))
                  }
                  className={editStyles.input}
                  placeholder="MRP"
                />
              </div>

              <div className={editStyles.field}>
                <label className={editStyles.label}>Offer Price</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.offerPrice}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, offerPrice: e.target.value }))
                  }
                  className={editStyles.input}
                  placeholder="Offer price"
                />
              </div>

              <div className={editStyles.fullField}>
                <label className={editStyles.label}>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className={editStyles.textarea}
                  placeholder="Treatment description"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className={editStyles.submitBtn}>
                Update Treatment
              </button>
              <button
                type="button"
                className={editStyles.submitBtn}
                onClick={() => {
                  setEditingTreatment(null);
                  setEditForm({
                    treatmentName: "",
                    clinicId: "",
                    serviceCategory: "",
                    paymentOption: "",
                    mrp: "",
                    offerPrice: "",
                    description: "",
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ListOfTreatment;
