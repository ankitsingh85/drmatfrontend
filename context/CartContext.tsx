"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import { API_URL } from "@/config/api";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  discount?: string;
  discountPrice?: number;
  company?: string;
  image?: string;
  itemType?: "product" | "treatment";
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  wishlistItems: CartItem[];
  hydrated: boolean;
  addToCart: (product: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  addToWishlist: (product: Omit<CartItem, "quantity">) => void;
  removeFromWishlist: (id: string) => void;
  toggleWishlist: (product: Omit<CartItem, "quantity">) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const parseStored = (value: string | null): CartItem[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeItems = (items: any[]): CartItem[] =>
  items
    .filter((it) => it && typeof it.id === "string" && it.id)
    .map((it) => ({
      id: String(it.id),
      name: String(it.name || ""),
      price: Number(it.price || 0),
      mrp: it.mrp != null ? Number(it.mrp) : undefined,
      discount: it.discount,
      discountPrice: it.discountPrice != null ? Number(it.discountPrice) : undefined,
      company: it.company,
      image: it.image,
      itemType: it.itemType === "treatment" ? "treatment" : "product",
      quantity: Math.max(1, Number(it.quantity || 1)),
    }));

const toCompactItems = (items: CartItem[]): CartItem[] =>
  items.map(({ id, name, price, mrp, discount, discountPrice, company, image, itemType, quantity }) => ({
    id,
    name,
    price,
    mrp,
    discount,
    discountPrice,
    company,
    image,
    itemType,
    quantity,
  }));

const safeSetStorageItems = (key: string, items: CartItem[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(items));
    return;
  } catch (error) {
    // Quota can be exceeded by large optional fields (for example image data).
    if (!(error instanceof DOMException) || error.name !== "QuotaExceededError") return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(toCompactItems(items)));
  } catch {
    // Ignore storage failures and keep in-memory state.
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<CartItem[]>([]);
  const [identityKey, setIdentityKey] = useState("guest");
  const [userEmail, setUserEmail] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const refreshIdentity = () => {
    const email = Cookies.get("email") || "";
    const userId = Cookies.get("userId") || localStorage.getItem("userId") || "";
    const key = userId || email || "guest";
    setIdentityKey(key);
    setUserEmail(email);
  };

  const cartStorageKey = `cart:${identityKey}`;
  const wishlistStorageKey = `wishlist:${identityKey}`;

  const persistBackend = async (nextCart: CartItem[], nextWishlist: CartItem[]) => {
    if (!userEmail) return;
    try {
      const res = await fetch(`${API_URL}/users/by-email/${encodeURIComponent(userEmail)}`);
      if (!res.ok) return;
      const user = await res.json();
      if (!user?._id) return;

      await fetch(`${API_URL}/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name || "",
          email: user.email || userEmail,
          cartItems: nextCart,
          wishlistItems: nextWishlist,
        }),
      });
    } catch {
      // Ignore backend sync failures; local state remains.
    }
  };

  useEffect(() => {
    refreshIdentity();
    window.addEventListener("user-logged-in", refreshIdentity);
    window.addEventListener("user-logged-out", refreshIdentity);
    window.addEventListener("profile-updated", refreshIdentity);
    window.addEventListener("focus", refreshIdentity);
    window.addEventListener("storage", refreshIdentity);
    return () => {
      window.removeEventListener("user-logged-in", refreshIdentity);
      window.removeEventListener("user-logged-out", refreshIdentity);
      window.removeEventListener("profile-updated", refreshIdentity);
      window.removeEventListener("focus", refreshIdentity);
      window.removeEventListener("storage", refreshIdentity);
    };
  }, []);

  useEffect(() => {
    setHydrated(false);
    const localCart = parseStored(localStorage.getItem(cartStorageKey));
    const localWishlist = parseStored(localStorage.getItem(wishlistStorageKey));
    setCartItems(localCart);
    setWishlistItems(localWishlist);

    const hydrateFromBackend = async () => {
      if (!userEmail) return;
      try {
        const res = await fetch(`${API_URL}/users/by-email/${encodeURIComponent(userEmail)}`);
        if (!res.ok) return;
        const user = await res.json();
        const backendCart = normalizeItems(Array.isArray(user?.cartItems) ? user.cartItems : []);
        const backendWishlist = normalizeItems(
          Array.isArray(user?.wishlistItems) ? user.wishlistItems : []
        );

        if (backendCart.length || backendWishlist.length) {
          setCartItems(backendCart);
          setWishlistItems(backendWishlist);
          safeSetStorageItems(cartStorageKey, backendCart);
          safeSetStorageItems(wishlistStorageKey, backendWishlist);
        }
      } catch {
        // Ignore hydrate failures and continue with local state.
      }
    };

    hydrateFromBackend().finally(() => {
      setHydrated(true);
    });
  }, [identityKey, userEmail, cartStorageKey, wishlistStorageKey]);

  useEffect(() => {
    safeSetStorageItems(cartStorageKey, cartItems);
    safeSetStorageItems(wishlistStorageKey, wishlistItems);
    persistBackend(cartItems, wishlistItems);
  }, [cartItems, wishlistItems, cartStorageKey, wishlistStorageKey]);

  const addToCart = (product: Omit<CartItem, "quantity">, quantity = 1) => {
    setCartItems((prev) => {
      const normalizedProduct: Omit<CartItem, "quantity"> = {
        ...product,
        itemType: product.itemType === "treatment" ? "treatment" : "product",
      };
      const existing = prev.find((item) => item.id === normalizedProduct.id);
      if (existing) {
        // alert(`${normalizedProduct.name} is added`);
        return prev.map((item) =>
          item.id === normalizedProduct.id
            ? { ...item, quantity: item.quantity + quantity, itemType: item.itemType || normalizedProduct.itemType }
            : item
        );
      }
      // alert(`${normalizedProduct.name} is added`);
      return [...prev, { ...normalizedProduct, quantity }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const clearCart = () => setCartItems([]);

  const addToWishlist = (product: Omit<CartItem, "quantity">) => {
    setWishlistItems((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev;
      return [...prev, { ...product, quantity: 1 }];
    });
    // alert(`${product.name} added to wishlist`);
  };

  const removeFromWishlist = (id: string) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleWishlist = (product: Omit<CartItem, "quantity">) => {
    setWishlistItems((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        // alert(`${product.name} removed from wishlist`);
        return prev.filter((item) => item.id !== product.id);
      }
      // alert(`${product.name} added to wishlist`);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        wishlistItems,
        hydrated,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
