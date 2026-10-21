"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/config/api";
import styles from "@/styles/Dashboard/listofuser.module.css";
import editStyles from "@/styles/Dashboard/createUser.module.css";
import FullPageLoader from "@/components/common/FullPageLoader";
import { resolveMediaUrl, getExportSafeMediaValue } from "@/lib/media";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import {
  FiActivity,
  FiCalendar,
  FiCreditCard,
  FiEdit3,
  FiFileText,
  FiHome,
  FiUser,
} from "react-icons/fi";
import TableActions from "@/components/AdminPanel/common/TableActions";
import BulkSelectBar from "@/components/AdminPanel/common/BulkSelectBar";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import bulkStyles from "@/styles/Dashboard/bulkSelect.module.css";

interface User {
  _id: string;
  patientId: string;
  name: string;
  email: string;
  contactNo?: string;
  address?: string;
  profileImage?: string;
  createdAt: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  itemType?: "product" | "treatment" | "consultation";
  clinicName?: string;
  clinicAddress?: string;
}

interface OrderUser {
  _id?: string;
  email?: string;
}

interface Order {
  _id: string;
  userId: string | OrderUser;
  orderType?: "product" | "treatment" | "consultation";
  totalAmount: number;
  paymentStatus?: string;
  status?: string;
  paymentMethod?: string;
  address?: { type?: string; address?: string };
  products: OrderItem[];
  createdAt: string;
  razorpayPaymentId?: string;
  treatmentStartedAt?: string;
}

type UserDetailTab =
  | "my_orders"
  | "treatment_orders"
  | "test_booking"
  | "orders"
  | "my_consultation"
  | "medical_records"
  | "payment_methods";

const isTreatmentOrder = (order: Order) => {
  const orderType = String(order.orderType || "").toLowerCase();
  if (orderType === "treatment") return true;
  if (order.products?.some((item) => item.itemType === "treatment")) return true;

  const addressType = String(order.address?.type || "").toLowerCase();
  const addressText = String(order.address?.address || "").toLowerCase();
  return addressType === "other" || addressText.includes("treatment");
};

type ListOfUserProps = {
  canEdit?: boolean;
  canDelete?: boolean;
};

export default function ListOfUser({ canEdit = true, canDelete = true }: ListOfUserProps) {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User & { password?: string }>>(
    {}
  );

  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [viewOrders, setViewOrders] = useState<Order[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");
  const [activeDetailTab, setActiveDetailTab] = useState<UserDetailTab>("orders");
  const [cancellingOrderId, setCancellingOrderId] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/users`);
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  const filteredUsers = useMemo(() => {
    let data = [...users];

    if (search) {
      data = data.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.patientId.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      data = data.filter((u) => {
        const created = new Date(u.createdAt);
        const diff = now.getTime() - created.getTime();
        return dateFilter === "7"
          ? diff <= 7 * 24 * 60 * 60 * 1000
          : diff <= 30 * 24 * 60 * 60 * 1000;
      });
    }

    return data;
  }, [users, search, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFilter, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const bulkSelection = useBulkSelection(paginatedUsers, (u) => u._id);

  const handleDownloadCSV = () => {
    const rows = [
      ["Patient ID", "Profile", "Name", "Email", "Contact", "Address", "Created At"],
      ...filteredUsers.map((u) => [
        u.patientId,
        getExportSafeMediaValue(u.profileImage),
        u.name,
        u.email,
        u.contactNo || "",
        u.address || "",
        new Date(u.createdAt).toLocaleString(),
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
    link.download = "users.csv";
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

    const rows = filteredUsers
      .map(
        (u) => `<tr>
          <td>${escapeHtml(u.patientId)}</td>
          <td>${escapeHtml(
            getExportSafeMediaValue(u.profileImage)
          )}</td>
          <td>${escapeHtml(u.name)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td>${escapeHtml(u.contactNo || "-")}</td>
          <td>${escapeHtml(u.address || "-")}</td>
          <td>${escapeHtml(new Date(u.createdAt).toLocaleString())}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Users List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Users List</h2>
          <table>
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Profile</th>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Created At</th>
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

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog("Delete this user?", { danger: true }))) return;
    await fetch(`${API_URL}/users/${id}`, { method: "DELETE" });
    fetchUsers();
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      contactNo: user.contactNo || "",
      address: user.address || "",
      password: "",
    });
    setIsEditing(true);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const payload: any = {
      name: editForm.name,
      email: editForm.email,
      contactNo: editForm.contactNo,
      address: editForm.address,
    };

    if (editForm.password && editForm.password.trim() !== "") {
      payload.password = editForm.password;
    }

    await fetch(`${API_URL}/users/${editingUser._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    toast.success("User updated successfully");
    setIsEditing(false);
    setEditingUser(null);
    setEditForm({});
    fetchUsers();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingUser(null);
    setEditForm({});
  };

  const handleView = async (user: User) => {
    setActiveDetailTab("orders");
    setViewingUser(user);
    setViewOrders([]);
    setViewError("");
    setViewLoading(true);

    try {
      const [userRes, orderRes] = await Promise.all([
        fetch(`${API_URL}/users/by-email/${encodeURIComponent(user.email)}`),
        fetch(`${API_URL}/orders/all`),
      ]);

      if (userRes.ok) {
        const freshUser = await userRes.json();
        setViewingUser((prev) => ({ ...(prev || user), ...freshUser }));
      }

      if (!orderRes.ok) {
        const orderData = await orderRes.json().catch(() => ({}));
        throw new Error(orderData.message || "Failed to fetch orders");
      }

      const allOrders: Order[] = await orderRes.json();
      const filtered = allOrders
        .filter((o) => {
          const orderUserId =
            typeof o.userId === "string" ? o.userId : o.userId?._id;
          const orderEmail =
            typeof o.userId === "string" ? "" : o.userId?.email || "";
          return orderUserId === user._id || orderEmail === user.email;
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      setViewOrders(filtered);
    } catch (err: any) {
      setViewError(err.message || "Failed to load user details");
    } finally {
      setViewLoading(false);
    }
  };

  const closeView = () => {
    setViewingUser(null);
    setViewOrders([]);
    setViewError("");
    setViewLoading(false);
    setActiveDetailTab("orders");
  };

  // Admin-side cancellation — unlike the customer's own cancel action, this
  // is allowed for treatment bookings too (a patient can't self-cancel a
  // treatment, but support/admin can on their behalf). Reuses the existing
  // unrestricted admin status route rather than the owner-scoped /cancel
  // endpoint, since the admin isn't the order's owner.
  const handleAdminCancelOrder = async (order: Order) => {
    const ok = await confirmDialog("Cancel this order? This cannot be undone.", {
      title: "Cancel order",
      confirmLabel: "Cancel Order",
      danger: true,
    });
    if (!ok) return;

    try {
      setCancellingOrderId(order._id);
      const res = await fetch(`${API_URL}/orders/${order._id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Cancelled" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to cancel order");

      setViewOrders((prev) =>
        prev.map((o) => (o._id === order._id ? { ...o, status: "Cancelled" } : o))
      );
      toast.success("Order cancelled successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel order");
    } finally {
      setCancellingOrderId("");
    }
  };

  if (loading) return <FullPageLoader />;

  if (viewingUser) {
    const totalSpent = viewOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );
    const treatmentOrders = viewOrders.filter(isTreatmentOrder);

    return (
      <div className={styles.container}>
        <div className={styles.detailTopBar}>
          <button type="button" className={styles.backBtn} onClick={closeView}>
            Back to Users
          </button>
          <h1 className={styles.heading}>User Details</h1>
        </div>

        <section className={styles.heroSection}>
          <div className={styles.heroProfile}>
            {viewingUser.profileImage ? (
              <img
                src={resolveMediaUrl(viewingUser.profileImage) || viewingUser.profileImage}
                alt={viewingUser.name}
                className={styles.heroAvatar}
              />
            ) : (
              <div className={styles.heroAvatarFallback}>
                {viewingUser.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <div>
              <p className={styles.heroPatientId}>{viewingUser.patientId || "-"}</p>
              <h2 className={styles.heroName}>{viewingUser.name || "-"}</h2>
              <p className={styles.heroEmail}>{viewingUser.email || "-"}</p>
            </div>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.statCard}>
              <p>Total Orders</p>
              <strong>{viewOrders.length}</strong>
            </div>
            <div className={styles.statCard}>
              <p>Total Spent</p>
              <strong>Rs. {totalSpent.toLocaleString("en-IN")}</strong>
            </div>
            <div className={styles.statCard}>
              <p>Member Since</p>
              <strong>
                {viewingUser.createdAt
                  ? new Date(viewingUser.createdAt).toLocaleDateString("en-IN")
                  : "-"}
              </strong>
            </div>
          </div>
        </section>

        <section className={styles.detailsGrid}>
          <article className={styles.infoCard}>
            <h3>Contact Information</h3>
            <p><span>Mobile</span>{viewingUser.contactNo || "-"}</p>
            <p><span>Email</span>{viewingUser.email || "-"}</p>
            <p><span>Address</span>{viewingUser.address || "-"}</p>
          </article>

          <article className={styles.infoCard}>
            <h3>Account Information</h3>
            <p><span>Patient ID</span>{viewingUser.patientId || "-"}</p>
            <p><span>User ID</span>{viewingUser._id || "-"}</p>
            <p>
              <span>Created At</span>
              {viewingUser.createdAt
                ? new Date(viewingUser.createdAt).toLocaleString("en-IN")
                : "-"}
            </p>
          </article>
        </section>

        <section className={styles.tabSection}>
          <div className={styles.tabSidebar}>
           
            <button
              className={`${styles.tabBtn} ${
                activeDetailTab === "treatment_orders" ? styles.tabBtnActive : ""
              }`}
              onClick={() => setActiveDetailTab("treatment_orders")}
              type="button"
            >
              <span className={styles.tabLeft}>
                <FiCalendar />
                Treatment Order
              </span>
            </button>
            <button
              className={`${styles.tabBtn} ${
                activeDetailTab === "test_booking" ? styles.tabBtnActive : ""
              }`}
              onClick={() => setActiveDetailTab("test_booking")}
              type="button"
            >
              <span className={styles.tabLeft}>
                <FiEdit3 />
                Test Booking
              </span>
            </button>
            <button
              className={`${styles.tabBtn} ${
                activeDetailTab === "orders" ? styles.tabBtnActive : ""
              }`}
              onClick={() => setActiveDetailTab("orders")}
              type="button"
            >
              <span className={styles.tabLeft}>
                <FiActivity />
                Orders
              </span>
            </button>
            <button
              className={`${styles.tabBtn} ${
                activeDetailTab === "my_consultation" ? styles.tabBtnActive : ""
              }`}
              onClick={() => setActiveDetailTab("my_consultation")}
              type="button"
            >
              <span className={styles.tabLeft}>
                <FiUser />
                Consultation
              </span>
            </button>
            <button
              className={`${styles.tabBtn} ${
                activeDetailTab === "medical_records" ? styles.tabBtnActive : ""
              }`}
              onClick={() => setActiveDetailTab("medical_records")}
              type="button"
            >
              <span className={styles.tabLeft}>
                <FiFileText />
                Medical Records
              </span>
            </button>
            <button
              className={`${styles.tabBtn} ${
                activeDetailTab === "payment_methods" ? styles.tabBtnActive : ""
              }`}
              onClick={() => setActiveDetailTab("payment_methods")}
              type="button"
            >
              <span className={styles.tabLeft}>
                <FiCreditCard />
                Manage Payment Methods
              </span>
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeDetailTab === "orders" ? (
              <div className={styles.ordersSection}>
                <div className={styles.ordersHeader}>
                  <h3>Orders</h3>
                  <p>{viewLoading ? "Loading..." : `${viewOrders.length} orders found`}</p>
                </div>

                {viewLoading && <FullPageLoader />}
                {!viewLoading && viewError && (
                  <p className={styles.emptyState}>{viewError}</p>
                )}
                {!viewLoading && !viewError && viewOrders.length === 0 && (
                  <p className={styles.emptyState}>No orders found for this user.</p>
                )}

                {!viewLoading && !viewError && viewOrders.length > 0 && (
                  <div className={styles.ordersTableWrap}>
                    <table className={styles.ordersTable}>
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer Name</th>
                          <th>Orders</th>
                          <th>Order Date</th>
                          <th>Price</th>
                          <th>Order Status</th>
                          <th>Payment Method</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewOrders.map((order) => {
                          const statusText =
                            order.status || order.paymentStatus || "Pending";
                          const statusClass =
                            styles[statusText.toLowerCase()] || styles.pending;
                          const firstProduct = order.products?.[0];
                          const otherCount =
                            order.products && order.products.length > 1
                              ? ` +${order.products.length - 1} more`
                              : "";

                          return (
                            <tr key={order._id}>
                              <td>{order._id.slice(-8).toUpperCase()}</td>
                              <td>{viewingUser.name || "-"}</td>
                              <td>
                                {firstProduct
                                  ? `${firstProduct.name}${otherCount}`
                                  : "No items"}
                              </td>
                              <td>
                                {new Date(order.createdAt)
                                  .toLocaleDateString("en-GB")
                                  .replace(/\//g, ".")}
                              </td>
                              <td>
                                Rs. {Number(order.totalAmount || 0).toLocaleString("en-IN")}
                              </td>
                              <td>
                                <span className={`${styles.statusPill} ${statusClass}`}>
                                  {statusText}
                                </span>
                              </td>
                              <td>{order.paymentMethod || "N/A"}</td>
                              <td>
                                <button className={styles.rowActionBtn} type="button">
                                  ✎
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : activeDetailTab === "treatment_orders" ? (
              <div className={styles.ordersSection}>
                <div className={styles.ordersHeader}>
                  <h3>Treatment Orders</h3>
                  <p>
                    {viewLoading
                      ? "Loading..."
                      : `${treatmentOrders.length} treatment order(s) found`}
                  </p>
                </div>

                {viewLoading && <FullPageLoader />}
                {!viewLoading && viewError && (
                  <p className={styles.emptyState}>{viewError}</p>
                )}
                {!viewLoading && !viewError && treatmentOrders.length === 0 && (
                  <p className={styles.emptyState}>
                    No treatment orders found for this user.
                  </p>
                )}

                {!viewLoading && !viewError && treatmentOrders.length > 0 && (
                  <div className={styles.treatmentOrderGrid}>
                    {treatmentOrders.map((order) => {
                      const statusText =
                        order.status || order.paymentStatus || "Pending";
                      const statusClass =
                        styles[statusText.toLowerCase()] || styles.pending;
                      const canCancel =
                        order.status !== "Cancelled" && order.status !== "Delivered";

                      return (
                        <div key={order._id} className={styles.orderCard}>
                          <div className={styles.orderCardTop}>
                            <div>
                              <p className={styles.orderLabel}>Order ID</p>
                              <p className={styles.orderValue}>{order._id}</p>
                            </div>
                            <span className={`${styles.statusPill} ${statusClass}`}>
                              {statusText}
                            </span>
                          </div>

                          <div className={styles.orderMetaGrid}>
                            <div>
                              <p className={styles.orderLabel}>Booked On</p>
                              <p className={styles.orderValue}>
                                {new Date(order.createdAt).toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div>
                              <p className={styles.orderLabel}>Total Amount</p>
                              <p className={styles.orderValue}>
                                Rs. {Number(order.totalAmount || 0).toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div>
                              <p className={styles.orderLabel}>Payment Method</p>
                              <p className={styles.orderValue}>
                                {order.paymentMethod || "N/A"}
                              </p>
                            </div>
                            {order.razorpayPaymentId && (
                              <div>
                                <p className={styles.orderLabel}>Payment ID</p>
                                <p className={styles.orderValue}>
                                  {order.razorpayPaymentId}
                                </p>
                              </div>
                            )}
                          </div>

                          <p className={styles.orderLabel}>Treatment(s)</p>
                          <div className={styles.treatmentItemList}>
                            {order.products.map((item) => (
                              <div
                                key={`${order._id}-${item.id}`}
                                className={styles.treatmentItemRow}
                              >
                                <div>
                                  <p className={styles.treatmentItemName}>
                                    {item.name} x{item.quantity}
                                  </p>
                                  {item.clinicName && (
                                    <p className={styles.treatmentItemClinic}>
                                      Clinic: {item.clinicName}
                                      {item.clinicAddress ? ` — ${item.clinicAddress}` : ""}
                                    </p>
                                  )}
                                </div>
                                <p className={styles.treatmentItemPrice}>
                                  Rs. {(item.price * item.quantity).toLocaleString("en-IN")}
                                </p>
                              </div>
                            ))}
                          </div>

                          {order.status !== "Cancelled" && (
                            <div
                              className={
                                order.treatmentStartedAt
                                  ? styles.treatmentStartedNote
                                  : styles.treatmentPendingNote
                              }
                            >
                              {order.treatmentStartedAt
                                ? `Treatment Started — ${new Date(
                                    order.treatmentStartedAt
                                  ).toLocaleString("en-IN")}`
                                : "Not started yet — clinic hasn't OTP-verified the patient"}
                            </div>
                          )}

                          {canCancel && (
                            <button
                              type="button"
                              className={styles.cancelOrderBtn}
                              onClick={() => handleAdminCancelOrder(order)}
                              disabled={cancellingOrderId === order._id}
                            >
                              {cancellingOrderId === order._id
                                ? "Cancelling..."
                                : "Cancel Order"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.emptyTab}>
                <h3>
                  {activeDetailTab
                    .split("_")
                    .map((p) => p[0].toUpperCase() + p.slice(1))
                    .join(" ")}
                </h3>
                <p>No data available yet for this section.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Users</h1>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by ID, Name or Email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className={styles.filter}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="all">All Users</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
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
        <button
          type="button"
          className={styles.premiumButton}
          onClick={handleDownloadCSV}
        >
          Download CSV
        </button>
        <button
          type="button"
          className={styles.premiumButton}
          onClick={handleDownloadPDF}
        >
          Download PDF
        </button>
      </div>

      <BulkSelectBar
        endpointPath="users"
        selectedIds={Array.from(bulkSelection.selectedIds)}
        noun="users"
        canDelete={canDelete}
        onClear={bulkSelection.clear}
        onDeleted={(deletedIds) => {
          setUsers((prev) => prev.filter((u) => !deletedIds.includes(u._id)));
          bulkSelection.removeIds(deletedIds);
        }}
      />

      <div className={`${styles.tableWrap} ${bulkStyles.tableScroll}`}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
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
                    aria-label="Select all users on this page"
                  />
                </th>
              )}
              <th>Patient ID</th>
              <th>Profile</th>
              <th>Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Address</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedUsers.map((u) => (
              <tr key={u._id} className={styles.tableRow}>
                {canDelete && (
                  <td className={bulkStyles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={bulkSelection.isSelected(u._id)}
                      onChange={() => bulkSelection.toggle(u._id)}
                      aria-label={`Select ${u.name}`}
                    />
                  </td>
                )}
                <td>{u.patientId}</td>
                <td>
                  {u.profileImage ? (
                    <img
                      src={resolveMediaUrl(u.profileImage) || u.profileImage}
                      alt={u.name}
                      style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.contactNo || "-"}</td>
                <td>{u.address || "-"}</td>
                <td>{new Date(u.createdAt).toLocaleString()}</td>
                <td className={styles.actions}>
                  <TableActions
                    onView={() => handleView(u)}
                    onEdit={() => handleEdit(u)}
                    onDelete={() => handleDelete(u._id)}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr className={styles.tableRow}>
                <td colSpan={canDelete ? 9 : 8}>No users found.</td>
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
          Showing {paginatedUsers.length} of {filteredUsers.length}
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

      {isEditing && editingUser && (
        <div className={editStyles.container} style={{ marginTop: 40 }}>
          <h1 className={editStyles.heading}>Edit User</h1>

          <form className={editStyles.form} onSubmit={handleEditSubmit}>
            <div className={editStyles.section}>
              <h2 className={editStyles.sectionTitle}>User Information</h2>

              <input
                className={editStyles.input}
                value={editingUser.patientId}
                disabled
              />

              <input
                name="name"
                value={editForm.name || ""}
                onChange={handleEditChange}
                className={editStyles.input}
                placeholder="Name"
              />

              <input
                name="email"
                value={editForm.email || ""}
                onChange={handleEditChange}
                className={editStyles.input}
                placeholder="Email"
              />

              <input
                name="contactNo"
                value={editForm.contactNo || ""}
                onChange={handleEditChange}
                className={editStyles.input}
                placeholder="Contact Number"
              />

              <textarea
                name="address"
                value={editForm.address || ""}
                onChange={handleEditChange}
                className={editStyles.textarea}
                placeholder="Address"
              />
            </div>

            <div className={editStyles.section}>
              <h2 className={editStyles.sectionTitle}>Update Password</h2>
              <input
                type="password"
                name="password"
                value={editForm.password || ""}
                onChange={handleEditChange}
                className={editStyles.input}
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className={editStyles.submitBtn}>
                Update User
              </button>
              <button
                type="button"
                className={editStyles.submitBtn}
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
