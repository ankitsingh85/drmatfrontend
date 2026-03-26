"use client";

import React, { useCallback, useEffect, useState } from "react";
import styles from "@/styles/user/Address.module.css";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import Image from "next/image";

import MobileNavbar from "@/components/Layout/MobileNavbar";
import Topbar from "@/components/Layout/Topbar";
import { FaUserCircle, FaShoppingCart, FaCreditCard } from "react-icons/fa";
import { BsShieldCheck } from "react-icons/bs";
import {
  MdOutlineEdit,
  MdOutlineRadioButtonChecked,
  MdOutlineRadioButtonUnchecked,
} from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { CartItem, useCart } from "@/context/CartContext";
import { API_URL } from "@/config/api";
// import {logo} from "@/public/logo.jpeg"
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

const ADDRESS_TYPES = ["Home", "Work", "Office"] as const;
type AddressType = (typeof ADDRESS_TYPES)[number];
const TREATMENT_CHECKOUT_KEY = "treatmentCheckout";

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

const sanitizeAddressType = (value?: string): AddressType => {
  if (value === "Work" || value === "Office") return value;
  return "Home";
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

const parseLegacyAddress = (value?: string) => {
  const source = (value || "").trim();
  if (!source) return {};
  const parts = source
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const parsed: Partial<Address> = {};
  if (parts[0]) parsed.houseNo = parts[0];
  if (parts[1]) parsed.street = parts[1];
  if (parts[2]) parsed.localArea = parts[2];
  if (parts[3]) parsed.district = parts[3];
  if (parts[4]) parsed.state = parts[4];
  if (parts[5]) parsed.pincode = parts[5].replace(/\D/g, "").slice(0, 6);
  if (!parsed.pincode) {
    const pincodeMatch = source.match(/\b\d{6}\b/);
    if (pincodeMatch) parsed.pincode = pincodeMatch[0];
  }
  return parsed;
};

const normalizeAddress = (addr: any): Address => {
  if (!addr || typeof addr !== "object") return { ...emptyAddress };
  const legacy = parseLegacyAddress(addr.address);
  return {
    type: sanitizeAddressType(addr.type),
    address: addr.address || "",
    fullName: addr.fullName || "",
    mobileNo: addr.mobileNo || "",
    houseNo: addr.houseNo || legacy.houseNo || "",
    street: addr.street || legacy.street || "",
    localArea: addr.localArea || legacy.localArea || "",
    pincode: addr.pincode || legacy.pincode || "",
    district: addr.district || legacy.district || "",
    state: addr.state || legacy.state || "",
  };
};

const toBackendAddress = (addr: Address): Address => ({
  ...addr,
  type: sanitizeAddressType(addr.type),
  fullName: (addr.fullName || "").trim(),
  mobileNo: (addr.mobileNo || "").replace(/\D/g, "").slice(0, 10),
  houseNo: (addr.houseNo || "").trim(),
  street: (addr.street || "").trim(),
  localArea: (addr.localArea || "").trim(),
  pincode: (addr.pincode || "").replace(/\D/g, "").slice(0, 6),
  district: (addr.district || "").trim(),
  state: (addr.state || "").trim(),
  address: formatAddressText(addr),
});

const AddressPage: React.FC = () => {
  const router = useRouter();
  const { cartItems, hydrated: cartHydrated } = useCart();

  const [user, setUser] = useState<IUserProfile | null>(null);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [checkoutLoaded, setCheckoutLoaded] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [editAddress, setEditAddress] = useState<Address>({ ...emptyAddress });
  const [newAddress, setNewAddress] = useState<Address>({ ...emptyAddress });
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const normalizeProfileImage = (img?: string) => {
    if (!img) return "";
    if (img.startsWith("data:image/")) return img;
    if (img.startsWith("http")) return img;
    return `data:image/jpeg;base64,${img}`;
  };

  const fetchPincodeMeta = async (pincode: string, mode: "new" | "edit") => {
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

  const fetchUser = useCallback(async () => {
    const email = Cookies.get("email");
    const token = Cookies.get("token");
    if (!email || !token) {
      router.replace("/Login?next=/home/Address");
      return;
    }

    try {
      setIsLoadingUser(true);
      const res = await fetch(`${API_URL}/users/by-email/${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        const rawAddresses = Array.isArray(data.addresses) ? data.addresses : [];
        const addresses = rawAddresses.length ? rawAddresses.map(normalizeAddress) : [];
        setUser({
          _id: data._id,
          email: data.email,
          name: data.name,
          addresses,
          profileImage: data.profileImage,
        });
        setSelectedAddressIndex((prev) => Math.min(prev, Math.max(0, addresses.length - 1)));
      } else {
        router.replace("/Login?next=/home/Address");
      }
    } catch {
      router.replace("/Login?next=/home/Address");
    } finally {
      setIsLoadingUser(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(TREATMENT_CHECKOUT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCheckoutItems(parsed);
        }
      }
    } catch {
      setCheckoutItems([]);
    } finally {
      setCheckoutLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!showEditModal || editingAddressIndex === null || !user?.addresses?.length) return;
    const current = user.addresses[editingAddressIndex];
    if (current) {
      setEditAddress(normalizeAddress(current));
    }
  }, [showEditModal, editingAddressIndex, user]);

  useEffect(() => {
    const handleAddressUpdated = () => {
      fetchUser();
    };
    window.addEventListener("addresses-updated", handleAddressUpdated);
    window.addEventListener("profile-updated", handleAddressUpdated);
    return () => {
      window.removeEventListener("addresses-updated", handleAddressUpdated);
      window.removeEventListener("profile-updated", handleAddressUpdated);
    };
  }, [fetchUser]);

  const activeItems = cartItems.length > 0 ? cartItems : checkoutItems;
  const isTreatmentCheckout = checkoutItems.length > 0 && cartItems.length === 0;

  useEffect(() => {
    if (isLoadingUser || !checkoutLoaded || !cartHydrated) return;
    if (activeItems.length === 0) {
      router.replace("/home/Cart");
    }
  }, [activeItems.length, cartHydrated, checkoutLoaded, isLoadingUser, router]);

  if (isLoadingUser || !user || !checkoutLoaded || !cartHydrated) {
    return (
      <div className={styles.page}>
        <Topbar />
        <p className={styles.message}>Loading...</p>
      </div>
    );
  }

  const saveAddressesToBackend = async (addresses: Address[], selectedIndex?: number) => {
    if (!user?._id) return;
    const effectiveSelected = selectedIndex ?? selectedAddressIndex;
    try {
      const payloadAddresses = addresses.map(toBackendAddress);
      const res = await fetch(`${API_URL}/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          addresses: payloadAddresses,
          address: formatAddressText(
            addresses[effectiveSelected] || addresses[0] || emptyAddress
          ),
        }),
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("addresses-updated"));
      }
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
    const payload = toBackendAddress(newAddress);
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
    updatedAddresses[selectedAddressIndex] = toBackendAddress(editAddress);
    setUser({ ...user, addresses: updatedAddresses });
    setShowEditModal(false);
    setEditingAddressIndex(null);
    await saveAddressesToBackend(updatedAddresses, selectedAddressIndex);
  };

  const handleOpenEditModal = (index: number) => {
    const selected = user?.addresses?.[index];
    if (!selected) return;
    setSelectedAddressIndex(index);
    setEditingAddressIndex(index);
    setEditAddress(normalizeAddress(selected));
    setShowEditModal(true);
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
        flow: isTreatmentCheckout ? "treatment" : "cart",
      },
    });
  };

  const subtotalMrp = activeItems.reduce(
    (acc, item) => acc + (item.mrp != null ? item.mrp : item.price) * item.quantity,
    0
  );

  const offerTotal = activeItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const totalDiscount = Math.max(0, subtotalMrp - offerTotal);
  const totalPayable = offerTotal;

  return (
    <div className={styles.page}>
      <Topbar />
      <div className={styles.header}>
        <div className={styles.logo}>
          
                  <h1>Address</h1>
                  </div>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.circleFilled}>
              <FaShoppingCart />
            </div>
            <div className={styles.labelActive}>
              {isTreatmentCheckout ? "Treatment" : "Cart"}
            </div>
          </div>
          <div className={styles.line}></div>
          <div className={styles.step}>
            <div className={styles.circleOutlined}>
              <FaCreditCard />
            </div>
            <div className={styles.labelActive}>Address</div>
          </div>
          <div className={styles.line}></div>
          <div className={styles.step}>
            <div className={styles.circleGrey}>
              <FaCreditCard />
            </div>
            <div className={styles.labelDisabled}>Payment</div>
          </div>
        </div>
      </div>

      <div className={styles.heroBand}>
        <div>
          <p className={styles.heroEyebrow}>Secure checkout</p>
          <h2 className={styles.heroTitle}>
            {isTreatmentCheckout
              ? "Confirm your treatment booking details"
              : "Choose your delivery address"}
          </h2>
          <p className={styles.heroCopy}>
            Review your saved addresses, select the one you want, and continue
            to a clean payment step.
          </p>
        </div>
        <div className={styles.heroBadge}>
          <BsShieldCheck />
          <span>Address verified</span>
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
              <div className={styles.secureLogin}>
                <BsShieldCheck /> You are securely logged in
              </div>
            </div>
            <div className={styles.phone}>Email: {user.email}</div>
          </div>

          <div className={styles.addressBox}>
            <div className={styles.addressHeader}>
              <h3>Delivery Address</h3>
              <span className={styles.addLink} onClick={() => setShowAddModal(true)}>
                + Add Address
              </span>
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
                      onClick={() => handleOpenEditModal(index)}
                    />
                  </div>
                  <div className={styles.tagRow}>
                    <strong>{sanitizeAddressType(addr.type)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.summaryTop}>
            <div>
              <p className={styles.summaryKicker}>Review your order</p>
              <h3 className={styles.summaryTitle}>
                {isTreatmentCheckout ? "Treatment booking summary" : "Cart summary"}
              </h3>
            </div>
            <div className={styles.summaryPill}>{activeItems.length} item(s)</div>
          </div>

          <div className={styles.summaryItems}>
            {activeItems.map((item) => (
              <div key={item.id} className={styles.summaryItem}>
                <div className={styles.summaryItemCopy}>
                  <span>{item.name}</span>
                  <small>Qty {item.quantity}</small>
                </div>
                <strong>Rs. {(item.price * item.quantity).toLocaleString("en-IN")}</strong>
              </div>
            ))}
          </div>

          <div className={styles.summaryBreakdown}>
            <div className={styles.summaryRow}>
              <span>Subtotal (MRP)</span>
              <span>Rs. {subtotalMrp.toLocaleString("en-IN")}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Offer Price</span>
              <span>Rs. {offerTotal.toLocaleString("en-IN")}</span>
            </div>
            <div className={styles.savingsNote}>
              You save Rs. {totalDiscount.toLocaleString("en-IN")}
            </div>
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>Rs. {totalPayable.toLocaleString("en-IN")}</span>
            </div>
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
                    onChange={(e) =>
                      setNewAddress((p) => ({ ...p, type: sanitizeAddressType(e.target.value) }))
                    }
                  >
                    {ADDRESS_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
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
                    onChange={(e) =>
                      setEditAddress((p) => ({ ...p, localArea: e.target.value }))
                    }
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
                    onChange={(e) =>
                      setEditAddress((p) => ({ ...p, type: sanitizeAddressType(e.target.value) }))
                    }
                  >
                    {ADDRESS_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={handleEditAddress}>Save Changes</button>
            </div>
            <IoClose
              className={styles.closeBtn}
              onClick={() => {
                setShowEditModal(false);
                setEditingAddressIndex(null);
              }}
            />
          </div>
        </div>
      )}

      <MobileNavbar />
    </div>
  );
};

export default AddressPage;
