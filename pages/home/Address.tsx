"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/user/Address.module.css";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import { FaUserCircle, FaShoppingCart, FaCreditCard } from "react-icons/fa";
import { BsShieldCheck } from "react-icons/bs";
import { HiOutlineMail } from "react-icons/hi";
import { MdOutlineEdit, MdOutlineRadioButtonChecked } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { useCart } from "@/context/CartContext";
import { API_URL } from "@/config/api";

interface Address {
  type: string;
  address: string;
}

interface IUserProfile {
  _id?: string;
  email: string;
  name: string;
  addresses: Address[];
  profileImage?: string;
}

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const AddressPage: React.FC = () => {
  const router = useRouter();
  const { cartItems } = useCart();

  const [user, setUser] = useState<IUserProfile | null>(null);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAddress, setEditAddress] = useState<Address>({ type: "Home", address: "" });
  const [newAddress, setNewAddress] = useState<Address>({ type: "Home", address: "" });

  const normalizeProfileImage = (img?: string) => {
    if (!img) return "";
    if (img.startsWith("data:image/")) return img;
    if (img.startsWith("http")) return img;
    return `data:image/jpeg;base64,${img}`;
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
          const addresses = data.addresses || [];
          setUser({
            _id: data._id,
            email: data.email,
            name: data.name,
            addresses,
            profileImage: data.profileImage,
          });
          if (addresses.length) setSelectedAddressIndex(0);
        } else {
          router.replace("/Login?next=/home/Address");
        }
      } catch (err) {
        console.error(err);
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

  const saveAddressesToBackend = async (addresses: Address[]) => {
    if (!user?._id) return;
    try {
      await fetch(`${API_URL}/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          addresses,
        }),
      });
    } catch (err) {
      console.error("Failed to save address:", err);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.address.trim()) return;
    const updatedAddresses = [...(user?.addresses || []), newAddress];
    setUser((prev) => (prev ? { ...prev, addresses: updatedAddresses } : null));
    setNewAddress({ type: "Home", address: "" });
    setShowAddModal(false);
    await saveAddressesToBackend(updatedAddresses);
  };

  const handleEditAddress = async () => {
    if (!user) return;
    const updatedAddresses = [...user.addresses];
    updatedAddresses[selectedAddressIndex] = editAddress;
    setUser({ ...user, addresses: updatedAddresses });
    setShowEditModal(false);
    await saveAddressesToBackend(updatedAddresses);
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
        address: selectedAddress.address,
      },
    });
  };

  const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className={styles.page}>
      {/* Topbar with steps */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <img src="/logo.png" alt="Logo" width={155} height={45} onClick={() => router.push("/home")} />
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
        {/* Left Section */}
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
            <div className={styles.phone}>📧 {user.email}</div>
          </div>

          <div className={styles.addressBox}>
            <div className={styles.addressHeader}>
              <h3>Delivery Address</h3>
              <span className={styles.addLink} onClick={() => setShowAddModal(true)}>+ Add Address</span>
            </div>

            {user.addresses.map((addr, index) => (
              <div key={index} className={styles.addressCard}>
                <div className={styles.radioRow}>
                  <MdOutlineRadioButtonChecked
                    className={styles.radio}
                    onClick={() => setSelectedAddressIndex(index)}
                  />
                  <div className={styles.addressText}>{addr.address}</div>
                  <MdOutlineEdit
                    className={styles.editIcon}
                    onClick={() => { setSelectedAddressIndex(index); setEditAddress(addr); setShowEditModal(true); }}
                  />
                </div>
                <div className={styles.tagRow}><strong>{addr.type}</strong></div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section */}
        <div className={styles.right}>
          <h3 className={styles.summaryTitle}>
            Order Summary ({cartItems.length} items)
          </h3>
          {cartItems.map((item) => (
            <div key={item.id} className={styles.summaryRow}>
              <span>{item.name} x {item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
          <hr />
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span>₹{totalPrice}</span>
          </div>

          {/* Proceed to Pay Button */}
          <button className={styles.saveDeliver} onClick={handleProceedPayment}>
            Proceed to Pay ₹{totalPrice}
          </button>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h3>Add New Address</h3>
            <input placeholder="Address" value={newAddress.address} onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })} />
            <select value={newAddress.type} onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}>
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Other">Other</option>
            </select>
            <button onClick={handleAddAddress}>Save Address</button>
            <IoClose className={styles.closeBtn} onClick={() => setShowAddModal(false)} />
          </div>
        </div>
      )}

      {/* Edit Address Modal */}
      {showEditModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h3>Edit Address</h3>
            <input placeholder="Address" value={editAddress.address} onChange={(e) => setEditAddress({ ...editAddress, address: e.target.value })} />
            <select value={editAddress.type} onChange={(e) => setEditAddress({ ...editAddress, type: e.target.value })}>
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Other">Other</option>
            </select>
            <button onClick={handleEditAddress}>Save Changes</button>
            <IoClose className={styles.closeBtn} onClick={() => setShowEditModal(false)} />
          </div>
        </div>
      )}

      <MobileNavbar />
    </div>
  );
};

export default AddressPage;
