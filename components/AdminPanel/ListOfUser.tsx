"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/config/api";
import styles from "@/styles/Dashboard/listofuser.module.css";
import editStyles from "@/styles/Dashboard/createUser.module.css";
import FullPageLoader from "@/components/common/FullPageLoader";
import { resolveMediaUrl } from "@/lib/media";
import {
  FiActivity,
  FiCalendar,
  FiCreditCard,
  FiEdit3,
  FiEye,
  FiFileText,
  FiHome,
  FiUser,
} from "react-icons/fi";

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
}

interface OrderUser {
  _id?: string;
  email?: string;
}

interface Order {
  _id: string;
  userId: string | OrderUser;
  totalAmount: number;
  paymentStatus?: string;
  status?: string;
  paymentMethod?: string;
  address?: { type?: string; address?: string };
  products: OrderItem[];
  createdAt: string;
}

type UserDetailTab =
  | "my_orders"
  | "my_lab_test"
  | "test_booking"
  | "orders"
  | "my_consultation"
  | "medical_records"
  | "payment_methods";

export default function ListOfUser() {
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

  const handleDownloadCSV = () => {
    const rows = [
      ["Patient ID", "Name", "Email", "Contact", "Address", "Created At"],
      ...filteredUsers.map((u) => [
        u.patientId,
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

    const rows = filteredUsers
      .map(
        (u) => `<tr>
          <td>${escapeHtml(u.patientId)}</td>
          <td>${escapeHtml(u.name)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td>${escapeHtml(u.contactNo || "-")}</td>
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
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
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
    if (!confirm("Delete this user?")) return;
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

    alert("User updated successfully");
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

  if (loading) return <FullPageLoader />;

  if (viewingUser) {
    const totalSpent = viewOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );

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
                activeDetailTab === "my_lab_test" ? styles.tabBtnActive : ""
              }`}
              onClick={() => setActiveDetailTab("my_lab_test")}
              type="button"
            >
              <span className={styles.tabLeft}>
                <FiCalendar />
                Lab Test
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

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th>Patient ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedUsers.map((u) => (
              <tr key={u._id} className={styles.tableRow}>
                <td>{u.patientId}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.contactNo || "-"}</td>
                <td>{new Date(u.createdAt).toLocaleString()}</td>
                <td className={styles.actions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleView(u)}
                    title="View user details"
                    aria-label={`View ${u.name}`}
                  >
                    <FiEye />
                  </button>
                  <button className={styles.actionBtn} onClick={() => handleEdit(u)}>
                    ✏️
                  </button>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleDelete(u._id)}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr className={styles.tableRow}>
                <td colSpan={6}>No users found.</td>
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
