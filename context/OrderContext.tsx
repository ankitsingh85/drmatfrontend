"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { CartItem } from "./CartContext";
import { API_URL } from "@/config/api";

export interface IOrder {
  _id?: string;
  userId?: string;
  orderType?: "product" | "treatment";
  products: {
    id: string;
    name?: string;
    quantity: number;
    price: number;
    image?: string;
    itemType?: "product" | "treatment";
  }[];
  totalAmount: number;
  address: { type: string; address: string };
  createdAt?: string;
}

interface OrderContextType {
  orders: IOrder[];
  createOrder: (
    items: CartItem[],
    total: number,
    address: { type: string; address: string },
    orderType?: "product" | "treatment"
  ) => Promise<void>;
  setOrders: React.Dispatch<React.SetStateAction<IOrder[]>>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [orders, setOrders] = useState<IOrder[]>([]);

  const createOrder = async (
    items: CartItem[],
    total: number,
    address: { type: string; address: string },
    orderType: "product" | "treatment" = "product"
  ) => {
    let userId = Cookies.get("userId") || localStorage.getItem("userId");
    if (!userId) {
      const token = Cookies.get("token");
      if (!token) throw new Error("Please log in to place an order");
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Please log in to place an order");
      const data = await res.json();
      const resolvedId = data._id || data.id;
      if (!resolvedId) throw new Error("User not logged in");
      userId = resolvedId;
      Cookies.set("userId", resolvedId);
      localStorage.setItem("userId", resolvedId);
    }
    if (!userId) throw new Error("User not logged in");

    try {
      const formattedProducts = items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        itemType: item.itemType === "treatment" ? "treatment" : "product",
      }));

      const derivedOrderType =
        items.length > 0 && items.every((item) => item.itemType === "treatment")
          ? "treatment"
          : orderType;

      const res = await axios.post(`${API_URL}/orders`, {
        userId,
        products: formattedProducts,
        totalAmount: total,
        address,
        orderType: derivedOrderType,
      });

      setOrders((prev) => [...prev, res.data]);
    } catch (err) {
      console.error("❌ Failed to create order:", err);
      throw err;
    }
  };

  return (
    <OrderContext.Provider value={{ orders, createOrder, setOrders }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrder must be used within OrderProvider");
  return context;
};
