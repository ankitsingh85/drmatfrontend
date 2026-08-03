"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/listofcategory.module.css";
import createStyles from "@/styles/Dashboard/createcategory.module.css";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import TableActions from "@/components/AdminPanel/common/TableActions";

type PopulatedDoctor = {
  _id: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  specialist?: string;
};

type SlotEntry = { label: string; booked: boolean };

interface OnlineConsultationService {
  _id: string;
  serviceCode: string;
  serviceType: string;
  doctors: PopulatedDoctor[];
  imageUrl: string;
  consultationFee: number;
  offerPrice?: number;
  discountPercent?: number;
  timingSlots: string[];
  bookedSlots: string[];
  nextAvailableSlot?: string;
  isActive?: boolean;
}

const getDoctorName = (doctor: PopulatedDoctor) =>
  [doctor.title || "Dr.", doctor.firstName, doctor.lastName].filter(Boolean).join(" ") ||
  "Doctor";

type ListOfOnlineConsultationServiceProps = {
  canEdit?: boolean;
  canDelete?: boolean;
};

const ListOfOnlineConsultationService = ({
  canEdit = true,
  canDelete = true,
}: ListOfOnlineConsultationServiceProps) => {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [services, setServices] = useState<OnlineConsultationService[]>([]);
  const [allDoctors, setAllDoctors] = useState<PopulatedDoctor[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [editingService, setEditingService] =
    useState<OnlineConsultationService | null>(null);
  const [editServiceType, setEditServiceType] = useState("");
  const [editFee, setEditFee] = useState("");
  const [editOfferPrice, setEditOfferPrice] = useState("");
  const [editDiscountPercent, setEditDiscountPercent] = useState("");
  const [editDoctorIds, setEditDoctorIds] = useState<string[]>([]);
  const [editSlots, setEditSlots] = useState<SlotEntry[]>([]);
  const [editSlotInput, setEditSlotInput] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [error, setError] = useState("");

  const premiumButtonStyle: React.CSSProperties = {
    border: "1px solid #d6d6d6",
    borderRadius: 10,
    padding: "9px 14px",
    background: "linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%)",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0.2,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
    cursor: "pointer",
  };

  const premiumButtonDisabledStyle: React.CSSProperties = {
    opacity: 0.5,
    cursor: "not-allowed",
  };

  useEffect(() => {
    fetchServices();
    fetchDoctors();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_URL}/online-consultation-services`);
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch online consultation services:", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API_URL}/doctoradmin`);
      const data = await res.json();
      setAllDoctors(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
      setAllDoctors([]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog("Are you sure you want to delete this service?", { danger: true }))) return;

    try {
      const res = await fetch(`${API_URL}/online-consultation-services/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to delete service");
        return;
      }

      setServices((prev) => prev.filter((service) => service._id !== id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleToggleActive = async (service: OnlineConsultationService) => {
    const nextIsActive = service.isActive === false;

    setServices((prev) =>
      prev.map((item) =>
        item._id === service._id ? { ...item, isActive: nextIsActive } : item
      )
    );

    try {
      const formData = new FormData();
      formData.append("isActive", String(nextIsActive));

      const res = await fetch(`${API_URL}/online-consultation-services/${service._id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to update status");
    } catch (error) {
      console.error("Toggle active error:", error);
      setServices((prev) =>
        prev.map((item) =>
          item._id === service._id ? { ...item, isActive: service.isActive } : item
        )
      );
    }
  };

  const handleEdit = (service: OnlineConsultationService) => {
    setEditingService(service);
    setEditServiceType(service.serviceType);
    setEditFee(String(service.consultationFee ?? ""));
    setEditOfferPrice(service.offerPrice !== undefined ? String(service.offerPrice) : "");
    setEditDiscountPercent(
      service.discountPercent !== undefined ? String(service.discountPercent) : ""
    );
    setEditDoctorIds((service.doctors || []).map((doctor) => doctor._id));
    setEditSlots(
      (service.timingSlots || []).map((label) => ({
        label,
        booked: (service.bookedSlots || []).includes(label),
      }))
    );
    setEditSlotInput("");
    setPreviewUrl(resolveMediaUrl(service.imageUrl));
    setExistingImageUrl(service.imageUrl);
    setEditImage(null);
    setError("");
  };

  const toggleEditDoctor = (doctorId: string) => {
    setEditDoctorIds((prev) =>
      prev.includes(doctorId) ? prev.filter((id) => id !== doctorId) : [...prev, doctorId]
    );
  };

  const addEditSlot = () => {
    const label = editSlotInput.trim();
    if (!label) return;
    if (editSlots.some((slot) => slot.label.toLowerCase() === label.toLowerCase())) {
      setEditSlotInput("");
      return;
    }
    setEditSlots((prev) => [...prev, { label, booked: false }]);
    setEditSlotInput("");
  };

  const toggleEditSlotBooked = (label: string) => {
    setEditSlots((prev) =>
      prev.map((slot) => (slot.label === label ? { ...slot, booked: !slot.booked } : slot))
    );
  };

  const removeEditSlot = (label: string) => {
    setEditSlots((prev) => prev.filter((slot) => slot.label !== label));
  };

  const editNextAvailableSlotPreview = editSlots.find((slot) => !slot.booked)?.label || "";

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setError("Image must be <= 1MB");
      return;
    }

    setError("");
    setEditImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editServiceType.trim()) {
      setError("Service type is required");
      return;
    }

    if (editDoctorIds.length === 0) {
      setError("Please select at least one doctor");
      return;
    }

    const feeValue = Number(editFee);
    if (!editFee.trim() || Number.isNaN(feeValue) || feeValue < 0) {
      setError("Enter a valid consultation fee");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("serviceType", editServiceType.trim());
      formData.append("consultationFee", String(feeValue));
      if (editOfferPrice.trim()) formData.append("offerPrice", editOfferPrice.trim());
      if (editDiscountPercent.trim()) {
        formData.append("discountPercent", editDiscountPercent.trim());
      }
      formData.append("doctors", JSON.stringify(editDoctorIds));
      formData.append("timingSlots", JSON.stringify(editSlots.map((slot) => slot.label)));
      formData.append(
        "bookedSlots",
        JSON.stringify(editSlots.filter((slot) => slot.booked).map((slot) => slot.label))
      );
      if (editImage) {
        formData.append("imageUrl", editImage);
      }

      const res = await fetch(
        `${API_URL}/online-consultation-services/${editingService?._id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to update service");
        return;
      }

      setServices((prev) =>
        prev.map((service) => (service._id === data._id ? data : service))
      );
      setEditingService(null);
      setEditImage(null);
      setPreviewUrl(null);
      setExistingImageUrl("");
    } catch (error) {
      console.error("Update failed:", error);
      setError("Unexpected error occurred");
    }
  };

  const handleCloseModal = () => {
    setEditingService(null);
    setError("");
    setEditImage(null);
    setPreviewUrl(null);
    setExistingImageUrl("");
  };

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (service) =>
        service.serviceType.toLowerCase().includes(q) ||
        service.serviceCode?.toLowerCase().includes(q)
    );
  }, [services, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredServices.length / itemsPerPage)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredServices.slice(start, start + itemsPerPage);
  }, [filteredServices, currentPage, itemsPerPage]);

  const handleDownloadCSV = () => {
    const rows = [
      ["Service Code", "Service Type", "Doctors", "Consultation Fee", "Offer Price", "Discount %", "Next Available Slot", "Active"],
      ...filteredServices.map((service) => [
        service.serviceCode,
        service.serviceType,
        (service.doctors || []).map(getDoctorName).join("; "),
        String(service.consultationFee ?? ""),
        service.offerPrice !== undefined ? String(service.offerPrice) : "",
        service.discountPercent !== undefined ? String(service.discountPercent) : "",
        service.nextAvailableSlot || "",
        service.isActive === false ? "Inactive" : "Active",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "online-consultation-services.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <input
          className={styles.search}
          placeholder="Search by service type or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={itemsPerPage}
          style={premiumButtonStyle}
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
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Service Code</th>
              <th>Service Type</th>
              <th>Doctors</th>
              <th>Image</th>
              <th>Fee</th>
              <th>Offer / Discount</th>
              <th>Next Slot</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedServices.map((service) => (
              <tr key={service._id}>
                <td>{service.serviceCode}</td>
                <td>{service.serviceType}</td>
                <td>
                  {(service.doctors || []).length > 0
                    ? service.doctors.map(getDoctorName).join(", ")
                    : "—"}
                </td>
                <td>
                  <img
                    src={resolveMediaUrl(service.imageUrl) || service.imageUrl}
                    alt={service.serviceType}
                    className={styles.image}
                  />
                </td>
                <td>₹{service.consultationFee}</td>
                <td>
                  {service.offerPrice !== undefined ? `₹${service.offerPrice}` : "—"}
                  {service.discountPercent ? ` (${service.discountPercent}% off)` : ""}
                </td>
                <td>{service.nextAvailableSlot || "—"}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(service)}
                    disabled={!canEdit}
                    style={{
                      ...premiumButtonStyle,
                      background: service.isActive === false ? "#f1f5f9" : "#dcfce7",
                      color: service.isActive === false ? "#64748b" : "#166534",
                    }}
                  >
                    {service.isActive === false ? "Inactive" : "Active"}
                  </button>
                </td>
                <td>
                  <TableActions
                    onEdit={() => handleEdit(service)}
                    onDelete={() => handleDelete(service._id)}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                </td>
              </tr>
            ))}
            {paginatedServices.length === 0 && (
              <tr>
                <td colSpan={9}>No online consultation services found.</td>
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
          Showing {paginatedServices.length} of {filteredServices.length}
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

      {editingService && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: 560, width: "94%" }}>
            <h3>Edit Online Consultation Service</h3>
            {error && <p className={styles.error}>{error}</p>}
            <form onSubmit={handleEditSubmit}>
              <label>Service Type</label>
              <input
                type="text"
                value={editServiceType}
                onChange={(e) => setEditServiceType(e.target.value)}
                required
              />

              <label>Doctors</label>
              <div className={createStyles.checkboxScrollBox}>
                {allDoctors.length === 0 ? (
                  <span>No doctors found.</span>
                ) : (
                  allDoctors.map((doctor) => (
                    <label
                      key={doctor._id}
                      style={{ display: "block", marginBottom: "8px", cursor: "pointer" }}
                    >
                      <input
                        type="checkbox"
                        checked={editDoctorIds.includes(doctor._id)}
                        onChange={() => toggleEditDoctor(doctor._id)}
                      />{" "}
                      {getDoctorName(doctor)}
                      {doctor.specialist ? ` — ${doctor.specialist}` : ""}
                    </label>
                  ))
                )}
              </div>

              <label>Consultation Fee (INR)</label>
              <input
                type="text"
                inputMode="decimal"
                value={editFee}
                onChange={(e) => setEditFee(e.target.value.replace(/[^0-9.]/g, ""))}
                required
              />

              <label>Offer Price (INR)</label>
              <input
                type="text"
                inputMode="decimal"
                value={editOfferPrice}
                onChange={(e) => setEditOfferPrice(e.target.value.replace(/[^0-9.]/g, ""))}
              />

              <label>Discount %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={editDiscountPercent}
                onChange={(e) =>
                  setEditDiscountPercent(e.target.value.replace(/[^0-9.]/g, ""))
                }
              />

              <label>Timing Slots</label>
              <div className={createStyles.tagInputRow}>
                <input
                  type="text"
                  value={editSlotInput}
                  onChange={(e) => setEditSlotInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addEditSlot();
                    }
                  }}
                  placeholder="e.g. 10:00 AM - 10:30 AM"
                />
                <button
                  type="button"
                  className={createStyles.tagAddButton}
                  onClick={addEditSlot}
                >
                  Add
                </button>
              </div>

              {editSlots.length > 0 && (
                <div className={createStyles.tagChips}>
                  {editSlots.map((slot) => (
                    <div
                      key={slot.label}
                      className={`${createStyles.tagChip} ${
                        slot.booked ? createStyles.tagChipBooked : ""
                      }`}
                    >
                      <span className={createStyles.tagChipText}>{slot.label}</span>
                      <button
                        type="button"
                        className={createStyles.tagChipBookedToggle}
                        onClick={() => toggleEditSlotBooked(slot.label)}
                      >
                        {slot.booked ? "Booked" : "Mark booked"}
                      </button>
                      <button
                        type="button"
                        className={createStyles.tagChipRemove}
                        onClick={() => removeEditSlot(slot.label)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {editSlots.length > 0 && (
                <p className={createStyles.nextSlotBanner}>
                  Next available slot:{" "}
                  {editNextAvailableSlotPreview || "None — all slots are booked"}
                </p>
              )}

              <label>Service Image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {previewUrl && (
                <img src={previewUrl} className={styles.preview} alt="Preview" />
              )}
              {!editImage && existingImageUrl && (
                <p className={styles.noImage}>Using existing uploaded image</p>
              )}

              <div className={styles.modalActions}>
                <button type="submit" className={styles.saveBtn}>
                  Save
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListOfOnlineConsultationService;
