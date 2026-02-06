// components/Sidebar.tsx
import React, { useState } from "react";
import Link from "next/link";
import styles from "@/styles/components/Layout/Sidebar.module.css";
import Image from "next/image";

import {
  Users,
  CreditCard,
  Package,
  ShoppingCart,
  Box,
  Building,
  DollarSign,
  ChevronDown,
} from "lucide-react";
import { signOut } from "next-auth/react";

const Sidebar = () => {
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  const toggleMenu = (menu: string) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const menuItems = [
    {
      title: "User",
      icon: <Users size={18} />,
      subItems: [
        { name: "All User", path: "/admin/user/" },
        { name: "Create User", path: "/admin/user/adduser" },
      ],
    },
    {
      title: "Payment History",
      icon: <CreditCard size={18} />,
      path: "/admin/paymentHistory",
    },
    {
      title: "Services",
      icon: <Package size={18} />,
      subItems: [
        { name: "All Services", path: "/admin/services/" },
        { name: "Create Services", path: "/admin/services/addservices" },
      ],
    },
    {
      title: "Products Category",
      icon: <ShoppingCart size={18} />,
      subItems: [
        { name: "All Category", path: "/admin/productscategory/" },
        {
          name: "Create Category",
          path: "/admin/productscategory/addcategory",
        },
      ],
    },
    {
      title: "Products",
      icon: <Box size={18} />,
      subItems: [
        { name: "All Products", path: "/admin/products/" },
        { name: "Create Products", path: "/admin/products/addproducts" },
      ],
    },
    {
      title: "Clinics",
      icon: <Box size={18} />,
      subItems: [
        { name: "All Clinics", path: "/admin/clinics/" },
        { name: "Create Clinics", path: "/admin/clinics/addclinics" },
      ],
    },
    {
      title: "Vendor",
      icon: <Building size={18} />,
      subItems: [
        { name: "All Vendor", path: "/admin/vendor/" },
        { name: "Create Vendor", path: "/admin/vendor/addvendor" },
      ],
    },
    {
      title: "Payment Plans",
      icon: <DollarSign size={18} />,
      subItems: [
        { name: "All Payment Plans", path: "/admin/paymentplans/" },
        {
          name: "Create Payment Plans",
          path: "/admin/paymentplans/addpayment",
        },
      ],
    },
  ];

  return (
    <div className={styles.sidebar}>
      <Image
        className={styles.logo}
        src="/logo.png"
        alt="Logo"
        width={220}
        height={75}
      />
      <ul>
        {menuItems.map((menu) => (
          <li key={menu.title}>
            {menu.subItems ? (
              <>
                <div
                  className={styles.menuItem}
                  onClick={() => toggleMenu(menu.title)}
                >
                  {menu.icon}
                  <span>{menu.title}</span>
                  <ChevronDown
                    className={`${styles.dropdownIcon} ${
                      openMenus[menu.title] ? styles.open : ""
                    }`}
                  />
                </div>
                {openMenus[menu.title] && (
                  <ul className={styles.subMenu}>
                    {menu.subItems.map((sub) => (
                      <li key={sub.name}>
                        <Link href={sub.path}>{sub.name}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <Link href={menu.path || "#"} className={styles.menuItem}>
                {menu.icon}
                <span>{menu.title}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
      <button className={styles.signout} onClick={() => signOut()}>Signout</button>
    </div>
  );
};

export default Sidebar;
