"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { CartItem } from "./CartContext";
import { API_URL } from "@/config/api";
import { loadRazorpayScript } from "@/lib/loadRazorpay";

export interface IOrder {
  _id?: string;
  userId?: string;
  clinicId?: string;
  doctorId?: string;
  b2bUserId?: string;
  ownerType?: "user" | "clinic" | "doctor" | "b2buser";
  orderType?: "product" | "treatment" | "consultation";
  products: {
    id: string;
    name?: string;
    quantity: number;
    price: number;
    image?: string;
    itemType?: "product" | "treatment" | "consultation";
    clinicId?: string;
    clinicName?: string;
    clinicAddress?: string;
  }[];
  totalAmount: number;
  couponCode?: string;
  discountAmount?: number;
  address: { type: string; address: string };
  createdAt?: string;
}

interface OrderContextType {
  orders: IOrder[];
  createOrder: (
    items: CartItem[],
    total: number,
    address: { type: string; address: string },
    orderType?: "product" | "treatment" | "consultation",
    options?: {
      ownerType?: "user" | "clinic" | "doctor" | "b2buser";
      clinicId?: string;
      doctorId?: string;
      b2bUserId?: string;
      couponCode?: string;
      discountAmount?: number;
    }
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
    orderType: "product" | "treatment" | "consultation" = "product",
    options?: {
      ownerType?: "user" | "clinic" | "doctor" | "b2buser";
      clinicId?: string;
      doctorId?: string;
      b2bUserId?: string;
      couponCode?: string;
      discountAmount?: number;
    }
  ) => {
    const role = Cookies.get("role")?.toLowerCase();
    const ownerType =
      options?.ownerType ||
      (role === "clinic"
        ? "clinic"
        : role === "doctor"
        ? "doctor"
        : role === "b2buser"
        ? "b2buser"
        : "user");
    const clinicId = options?.clinicId || Cookies.get("clinicId") || localStorage.getItem("clinicId") || "";
    const doctorId = options?.doctorId || Cookies.get("doctorId") || localStorage.getItem("doctorId") || "";
    const b2bUserId =
      options?.b2bUserId || Cookies.get("b2bUserId") || localStorage.getItem("b2bUserId") || "";

    let userId = Cookies.get("userId") || localStorage.getItem("userId");
    if (ownerType === "user") {
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
    } else if (ownerType === "clinic" && !clinicId) {
      throw new Error("Clinic not logged in");
    } else if (ownerType === "doctor" && !doctorId) {
      throw new Error("Doctor not logged in");
    } else if (ownerType === "b2buser" && !b2bUserId) {
      throw new Error("B2B account not logged in");
    }

    try {
      const formattedProducts = items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        itemType:
          item.itemType === "treatment" || item.itemType === "consultation"
            ? item.itemType
            : "product",
        // The clinic the user picked at checkout for this treatment —
        // dropping this here was silently losing it before it ever
        // reached the backend, even though the clinic-picker modal had
        // already captured it on the cart item.
        clinicId: item.clinicId,
        clinicName: item.clinicName,
        clinicAddress: item.clinicAddress,
      }));

      // A cart that mixes treatments with products/consultations is split
      // into two separate orders sharing the same payment, instead of one
      // order whose orderType only reflects part of what's in it. This is
      // what lets the product half stay independently cancellable later
      // while the treatment half stays protected (self-cancel blocked,
      // clinic notified, shows up in the clinic's Treatment Booking tab) —
      // all of that already keys off an order's own orderType/items, which
      // only works correctly when an order is actually one or the other.
      const hasTreatmentItem = items.some((item) => item.itemType === "treatment");
      const hasNonTreatmentItem = items.some((item) => item.itemType !== "treatment");
      const isMixedCart = hasTreatmentItem && hasNonTreatmentItem;

      const treatmentProducts = formattedProducts.filter((p) => p.itemType === "treatment");
      const nonTreatmentProducts = formattedProducts.filter((p) => p.itemType !== "treatment");
      const sumPrice = (list: typeof formattedProducts) =>
        list.reduce((sum, p) => sum + p.price * p.quantity, 0);

      const derivedOrderType =
        items.length > 0 && items.every((item) => item.itemType === "treatment")
          ? "treatment"
          : items.length > 0 && items.every((item) => item.itemType === "consultation")
          ? "consultation"
          : orderType;

      const endpoint =
        ownerType === "doctor" ? `${API_URL}/doctor-orders` : `${API_URL}/orders`;

      const buildPayload = (
        products: typeof formattedProducts,
        amount: number,
        type: "product" | "treatment" | "consultation",
        includeCoupon: boolean
      ) =>
        ownerType === "doctor"
          ? {
              doctorId,
              ownerType: "doctor",
              products,
              totalAmount: amount,
              couponCode: includeCoupon ? options?.couponCode : undefined,
              discountAmount: includeCoupon ? options?.discountAmount : undefined,
              address,
              orderType: type,
            }
          : {
              userId: ownerType === "user" ? userId : undefined,
              clinicId: ownerType === "clinic" ? clinicId : undefined,
              b2bUserId: ownerType === "b2buser" ? b2bUserId : undefined,
              ownerType,
              products,
              totalAmount: amount,
              couponCode: includeCoupon ? options?.couponCode : undefined,
              discountAmount: includeCoupon ? options?.discountAmount : undefined,
              address,
              orderType: type,
            };

      // Non-treatment subset's own type: "consultation" only if every one
      // of those items is a consultation, otherwise "product" — same rule
      // derivedOrderType already used for a non-mixed cart.
      const nonTreatmentOrderType: "product" | "consultation" =
        nonTreatmentProducts.length > 0 &&
        nonTreatmentProducts.every((p) => p.itemType === "consultation")
          ? "consultation"
          : "product";

      const payloads = isMixedCart
        ? [
            // Coupon/discount is applied to the non-treatment order only —
            // it was validated against that service section at apply-time,
            // and splitting a discount across two independent orders would
            // need its own allocation logic that doesn't exist yet.
            buildPayload(nonTreatmentProducts, sumPrice(nonTreatmentProducts), nonTreatmentOrderType, true),
            buildPayload(treatmentProducts, sumPrice(treatmentProducts), "treatment", false),
          ]
        : [buildPayload(formattedProducts, total, derivedOrderType, true)];

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load payment gateway. Please check your internet connection.");
      }

      const { data: razorpayOrder } = await axios.post(`${API_URL}/payments/create-order`, {
        amount: total,
      });

      const savedOrders = await new Promise<IOrder[]>((resolve, reject) => {
        const razorpay = new (window as any).Razorpay({
          key: razorpayOrder.keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          order_id: razorpayOrder.orderId,
          name: "DrDermat",
          description: "Order payment",
          prefill: {
            name: Cookies.get("username") || "",
            email: Cookies.get("email") || "",
          },
          theme: { color: "#0f9d58" },
          handler: async (response: any) => {
            try {
              const { data: verification } = await axios.post(`${API_URL}/payments/verify`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (!verification.verified) {
                reject(new Error("Payment verification failed"));
                return;
              }

              const paymentFields = {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              };

              const results: IOrder[] = [];
              for (const onePayload of payloads) {
                const res = await axios.post(endpoint, { ...onePayload, ...paymentFields });
                results.push(res.data);
              }
              resolve(results);
            } catch (verifyErr) {
              reject(verifyErr);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled")),
          },
        });

        razorpay.on("payment.failed", () => reject(new Error("Payment failed")));
        razorpay.open();
      });

      setOrders((prev) => [...prev, ...savedOrders]);
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
