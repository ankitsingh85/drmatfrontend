"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/user/Address.module.css";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import { FaUserCircle, FaShoppingCart, FaCreditCard } from "react-icons/fa";
import { BsShieldCheck } from "react-icons/bs";
import {
  MdOutlineEdit,
  MdOutlineRadioButtonChecked,
  MdOutlineRadioButtonUnchecked,
} from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { useCart } from "@/context/CartContext";
import { API_URL } from "@/config/api";

interface Address {
  type: string;
  address?: string;
  fullName?: string;
  mobileNo?: string;
  houseNo?: string;
  street?: string;
  localArea?: string;
  pincode?: string;
  district?: string;
  state?: string;
}

interface IUserProfile {
  _id?: string;
  email: string;
  name: string;
  addresses: Address[];
  profileImage?: string;
}

const emptyAddress: Address = {
  type: "Home",
  address: "",
  fullName: "",
  mobileNo: "",
  houseNo: "",
  street: "",
  localArea: "",
  pincode: "",
  district: "",
  state: "",
};

const formatAddressText = (addr: Address) => {
  const parts = [
    addr.houseNo,
    addr.street,
    addr.localArea,
    addr.district,
    addr.state,
    addr.pincode,
  ]
    .map((v) => (v || "").trim())
    .filter(Boolean);
  return parts.join(", ");
};

const normalizeAddress = (addr: any): Address => {
  if (!addr || typeof addr !== "object") return { ...emptyAddress };
  const structured: Address = {
    type: addr.type || "Home",
    address: addr.address || "",
    fullName: addr.fullName || "",
    mobileNo: addr.mobileNo || "",
    houseNo: addr.houseNo || "",
    street: addr.street || "",
    localArea: addr.localArea || "",
    pincode: addr.pincode || "",
    district: addr.district || "",
    state: addr.state || "",
  };
  if (!structured.localArea && structured.address) {
    structured.localArea = structured.address;
  }
  return structured;
};

const AddressPage: React.FC = () => {
  const router = useRouter();
  const { cartItems } = useCart();

  const [user, setUser] = useState<IUserProfile | null>(null);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAddress, setEditAddress] = useState<Address>({ ...emptyAddress });
  const [newAddress, setNewAddress] = useState<Address>({ ...emptyAddress });

  const normalizeProfileImage = (img?: string) => {
    if (!img) return "";
    if (img.startsWith("data:image/")) return img;
    if (img.startsWith("http")) return img;
    return `data:image/jpeg;base64,${img}`;
  };

  const fetchPincodeMeta = async (
    pincode: string,
    mode: "new" | "edit"
  ) => {
    if (pincode.length !== 6) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      const office = data?.[0]?.PostOffice?.[0];
      if (!office) return;
      const patch = { district: office.District || "", state: office.State || "" };
      if (mode === "new") {
        setNewAddress((prev) => ({ ...prev, ...patch }));
      } else {
        setEditAddress((prev) => ({ ...prev, ...patch }));
      }
    } catch {
      // Ignore pincode lookup failures and allow manual entry.
    }
  };

  useEffect(() => {
    const email = Cookies.get("email");
    const token = Cookies.get("token");
    if (!email || !token) {
      router.replace("/Login?next=/home/Address");
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/users/by-email/${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          const rawAddresses = Array.isArray(data.addresses) ? data.addresses : [];
          const addresses = rawAddresses.length
            ? rawAddresses.map(normalizeAddress)
            : [];
          setUser({
            _id: data._id,
            email: data.email,
            name: data.name,
            addresses,
            profileImage: data.profileImage,
          });
          setSelectedAddressIndex(0);
        } else {
          router.replace("/Login?next=/home/Address");
        }
      } catch {
        router.replace("/Login?next=/home/Address");
      }
    };

    fetchUser();
  }, [router]);

  if (!user) return <p className={styles.message}>Loading...</p>;
  if (cartItems.length === 0) {
    router.replace("/home/Cart");
    return <p className={styles.message}>Your cart is empty. Redirecting...</p>;
  }

  const saveAddressesToBackend = async (
    addresses: Address[],
    selectedIndex?: number
  ) => {
    if (!user?._id) return;
    const effectiveSelected = selectedIndex ?? selectedAddressIndex;
    try {
      await fetch(`${API_URL}/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          addresses: addresses.map((addr) => ({
            ...addr,
            address: formatAddressText(addr),
          })),
          address: formatAddressText(
            addresses[effectiveSelected] || addresses[0] || emptyAddress
          ),
        }),
      });
    } catch (err) {
      console.error("Failed to save address:", err);
    }
  };

  const validateAddress = (addr: Address) => {
    if (
      !addr.fullName?.trim() ||
      !addr.mobileNo?.trim() ||
      !addr.houseNo?.trim() ||
      !addr.street?.trim() ||
      !addr.localArea?.trim() ||
      !addr.pincode?.trim() ||
      !addr.district?.trim() ||
      !addr.state?.trim()
    ) {
      alert("Please fill all address fields.");
      return false;
    }
    if (!/^\d{10}$/.test(addr.mobileNo || "")) {
      alert("Please enter a valid 10-digit mobile number.");
      return false;
    }
    if (!/^\d{6}$/.test(addr.pincode || "")) {
      alert("Please enter a valid 6-digit pincode.");
      return false;
    }
    return true;
  };

  const handleAddAddress = async () => {
    if (!validateAddress(newAddress)) return;
    const payload = { ...newAddress, address: formatAddressText(newAddress) };
    const updatedAddresses = [...(user?.addresses || []), payload];
    const nextIndex = updatedAddresses.length - 1;
    setUser((prev) => (prev ? { ...prev, addresses: updatedAddresses } : null));
    setSelectedAddressIndex(nextIndex);
    setNewAddress({ ...emptyAddress });
    setShowAddModal(false);
    await saveAddressesToBackend(updatedAddresses, nextIndex);
  };

  const handleEditAddress = async () => {
    if (!user) return;
    if (!validateAddress(editAddress)) return;
    const updatedAddresses = [...user.addresses];
    updatedAddresses[selectedAddressIndex] = {
      ...editAddress,
      address: formatAddressText(editAddress),
    };
    setUser({ ...user, addresses: updatedAddresses });
    setShowEditModal(false);
    await saveAddressesToBackend(updatedAddresses, selectedAddressIndex);
  };

  const handleProceedPayment = () => {
    if (!user || !user.addresses.length) {
      alert("Please add at least one delivery address.");
      return;
    }
    const selectedAddress = user.addresses[selectedAddressIndex];
    if (!selectedAddress) {
      alert("Please select a delivery address.");
      return;
    }

    router.push({
      pathname: "/home/PaymentPage",
      query: {
        type: selectedAddress.type,
        address: formatAddressText(selectedAddress),
      },
    });
  };

  const subtotalMrp = cartItems.reduce(
    (acc, item) => acc + (item.mrp != null ? item.mrp : item.price) * item.quantity,
    0
  );

  const offerTotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const totalDiscount = Math.max(0, subtotalMrp - offerTotal);
  const deliveryFee = offerTotal >= 499 ? 0 : 49;
  const totalPayable = offerTotal + deliveryFee;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <img
            src="/logo.png"
            alt="Logo"
            width={155}
            height={45}
            onClick={() => router.push("/home")}
          />
        </div>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.circleFilled}><FaShoppingCart /></div>
            <div className={styles.labelActive}>Cart</div>
          </div>
          <div className={styles.line}></div>
          <div className={styles.step}>
            <div className={styles.circleOutlined}><FaCreditCard /></div>
            <div className={styles.labelActive}>Address</div>
          </div>
          <div className={styles.line}></div>
          <div className={styles.step}>
            <div className={styles.circleGrey}><FaCreditCard /></div>
            <div className={styles.labelDisabled}>Payment</div>
          </div>
        </div>
      </div>

      <div className={styles.wrapper}>
        <div className={styles.left}>
          <div className={styles.userCard}>
            {user.profileImage ? (
              <img
                src={normalizeProfileImage(user.profileImage)}
                alt={user.name}
                className={styles.avatarImage}
              />
            ) : (
              <FaUserCircle className={styles.avatar} />
            )}
            <div className={styles.userInfo}>
              <div className={styles.username}>{user.name}</div>
              <div className={styles.secureLogin}><BsShieldCheck /> You are securely logged in</div>
            </div>
            <div className={styles.phone}>Email: {user.email}</div>
          </div>

          <div className={styles.addressBox}>
            <div className={styles.addressHeader}>
              <h3>Delivery Address</h3>
              <span className={styles.addLink} onClick={() => setShowAddModal(true)}>+ Add Address</span>
            </div>

            {user.addresses.map((addr, index) => {
              const isSelected = selectedAddressIndex === index;
              return (
                <div
                  key={index}
                  className={`${styles.addressCard} ${isSelected ? styles.addressSelected : ""}`}
                >
                  <div className={styles.radioRow}>
                    {isSelected ? (
                      <MdOutlineRadioButtonChecked
                        className={styles.radio}
                        onClick={() => setSelectedAddressIndex(index)}
                      />
                    ) : (
                      <MdOutlineRadioButtonUnchecked
                        className={styles.radio}
                        onClick={() => setSelectedAddressIndex(index)}
                      />
                    )}
                    <div className={styles.addressText}>
                      <strong>{addr.fullName || user.name}</strong>
                      <p>{formatAddressText(addr) || addr.address || "-"}</p>
                      <small>Phone: {addr.mobileNo || "-"}</small>
                    </div>
                    <MdOutlineEdit
                      className={styles.editIcon}
                      onClick={() => {
                        setSelectedAddressIndex(index);
                        setEditAddress(normalizeAddress(addr));
                        setShowEditModal(true);
                      }}
                    />
                  </div>
                  <div className={styles.tagRow}><strong>{addr.type || "Home"}</strong></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.right}>
          <h3 className={styles.summaryTitle}>Order Summary ({cartItems.length} items)</h3>
          {cartItems.map((item) => (
            <div key={item.id} className={styles.summaryRow}>
              <span>{item.name} x {item.quantity}</span>
              <span>Rs. {(item.price * item.quantity).toLocaleString("en-IN")}</span>
            </div>
          ))}
          <hr />
          <div className={styles.summaryRow}>
            <span>Subtotal (MRP)</span>
            <span>Rs. {subtotalMrp.toLocaleString("en-IN")}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Offer Price</span>
            <span>Rs. {offerTotal.toLocaleString("en-IN")}</span>
          </div>
          <div className={styles.savingsNote}>You save Rs. {totalDiscount.toLocaleString("en-IN")}</div>
          <div className={styles.summaryRow}>
            <span>Delivery Fee</span>
            <span>{deliveryFee === 0 ? "FREE" : `Rs. ${deliveryFee}`}</span>
          </div>
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span>Rs. {totalPayable.toLocaleString("en-IN")}</span>
          </div>

          <button className={styles.saveDeliver} onClick={handleProceedPayment}>
            Proceed to Pay Rs. {totalPayable.toLocaleString("en-IN")}
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h3>Add New Address</h3>
            <div className={styles.modalBody}>
              <div className={styles.modalGrid}>
                <div>
                  <label>Full Name</label>
                  <input
                    value={newAddress.fullName || ""}
                    onChange={(e) => setNewAddress((p) => ({ ...p, fullName: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Mobile No</label>
                  <input
                    value={newAddress.mobileNo || ""}
                    onChange={(e) =>
                      setNewAddress((p) => ({
                        ...p,
                        mobileNo: e.target.value.replace(/\D/g, "").slice(0, 10),
                      }))
                    }
                  />
                </div>
                <div>
                  <label>House No</label>
                  <input
                    value={newAddress.houseNo || ""}
                    onChange={(e) => setNewAddress((p) => ({ ...p, houseNo: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Street</label>
                  <input
                    value={newAddress.street || ""}
                    onChange={(e) => setNewAddress((p) => ({ ...p, street: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Local Area</label>
                  <input
                    value={newAddress.localArea || ""}
                    onChange={(e) => setNewAddress((p) => ({ ...p, localArea: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Pincode</label>
                  <input
                    value={newAddress.pincode || ""}
                    onChange={(e) => {
                      const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setNewAddress((p) => ({ ...p, pincode }));
                      fetchPincodeMeta(pincode, "new");
                    }}
                  />
                </div>
                <div>
                  <label>District</label>
                  <input
                    value={newAddress.district || ""}
                    onChange={(e) => setNewAddress((p) => ({ ...p, district: e.target.value }))}
                  />
                </div>
                <div>
                  <label>State</label>
                  <input
                    value={newAddress.state || ""}
                    onChange={(e) => setNewAddress((p) => ({ ...p, state: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Address Type</label>
                  <select
                    value={newAddress.type || "Home"}
                    onChange={(e) => setNewAddress((p) => ({ ...p, type: e.target.value }))}
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <button onClick={handleAddAddress}>Save Address</button>
            </div>
            <IoClose className={styles.closeBtn} onClick={() => setShowAddModal(false)} />
          </div>
        </div>
      )}

      {showEditModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h3>Edit Address</h3>
            <div className={styles.modalBody}>
              <div className={styles.modalGrid}>
                <div>
                  <label>Full Name</label>
                  <input
                    value={editAddress.fullName || ""}
                    onChange={(e) => setEditAddress((p) => ({ ...p, fullName: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Mobile No</label>
                  <input
                    value={editAddress.mobileNo || ""}
                    onChange={(e) =>
                      setEditAddress((p) => ({
                        ...p,
                        mobileNo: e.target.value.replace(/\D/g, "").slice(0, 10),
                      }))
                    }
                  />
                </div>
                <div>
                  <label>House No</label>
                  <input
                    value={editAddress.houseNo || ""}
                    onChange={(e) => setEditAddress((p) => ({ ...p, houseNo: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Street</label>
                  <input
                    value={editAddress.street || ""}
                    onChange={(e) => setEditAddress((p) => ({ ...p, street: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Local Area</label>
                  <input
                    value={editAddress.localArea || ""}
                    onChange={(e) => setEditAddress((p) => ({ ...p, localArea: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Pincode</label>
                  <input
                    value={editAddress.pincode || ""}
                    onChange={(e) => {
                      const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setEditAddress((p) => ({ ...p, pincode }));
                      fetchPincodeMeta(pincode, "edit");
                    }}
                  />
                </div>
                <div>
                  <label>District</label>
                  <input
                    value={editAddress.district || ""}
                    onChange={(e) => setEditAddress((p) => ({ ...p, district: e.target.value }))}
                  />
                </div>
                <div>
                  <label>State</label>
                  <input
                    value={editAddress.state || ""}
                    onChange={(e) => setEditAddress((p) => ({ ...p, state: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Address Type</label>
                  <select
                    value={editAddress.type || "Home"}
                    onChange={(e) => setEditAddress((p) => ({ ...p, type: e.target.value }))}
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <button onClick={handleEditAddress}>Save Changes</button>
            </div>
            <IoClose className={styles.closeBtn} onClick={() => setShowEditModal(false)} />
          </div>
        </div>
      )}

      <MobileNavbar />
    </div>
  );
};

export default AddressPage;
