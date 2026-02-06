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

  useEffect(() => {
    const email = Cookies.get("email");
    if (!email) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/userprofile/${email}`);
        if (res.ok) {
          const data: IUserProfile = await res.json();
          setUser(data);
          if (data.addresses.length) setSelectedAddressIndex(0);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, []);

  if (!user) return <p className={styles.message}>Please log in to select address.</p>;
  if (cartItems.length === 0) return <p className={styles.message}>Your cart is empty.</p>;

  const handleAddAddress = () => {
    setUser((prev) => prev ? { ...prev, addresses: [...prev.addresses, newAddress] } : null);
    setNewAddress({ type: "Home", address: "" });
    setShowAddModal(false);
  };

  const handleEditAddress = () => {
    if (!user) return;
    const updatedAddresses = [...user.addresses];
    updatedAddresses[selectedAddressIndex] = editAddress;
    setUser({ ...user, addresses: updatedAddresses });
    setShowEditModal(false);
  };

  const handleProceedPayment = () => {
    if (!user) return;
    const selectedAddress = user.addresses[selectedAddressIndex];

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
    <>
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
            <FaUserCircle className={styles.avatar} />
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
    </>
  );
};

export default AddressPage;
