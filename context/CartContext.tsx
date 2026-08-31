"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
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
  itemType?: "product" | "treatment" | "consultation";
  quantity: number;
  // Only set for treatment items, once the user has picked which clinic
  // they'll visit for that treatment.
  clinicId?: string;
  clinicName?: string;
  clinicAddress?: string;
}

export const CART_TOAST_EVENT = "cart-item-added";

export type CartToastDetail = {
  message?: string;
  item?: CartItem;
  action?: "added" | "updated";
};

export type CartPreview = CartToastDetail;

export const emitCartToast = (detail: string | CartToastDetail) => {
  if (typeof window === "undefined") return;

  const payload: CartToastDetail =
    typeof detail === "string" ? { message: detail } : detail;

  window.dispatchEvent(
    new CustomEvent<CartToastDetail>(CART_TOAST_EVENT, {
      detail: payload,
    })
  );
};

interface CartContextType {
  cartItems: CartItem[];
  wishlistItems: CartItem[];
  hydrated: boolean;
  cartPreview: CartPreview | null;
  addToCart: (product: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setCartItemClinic: (
    id: string,
    clinic: { clinicId: string; clinicName: string; clinicAddress?: string }
  ) => void;
  clearCart: () => void;
  dismissCartPreview: () => void;
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
      itemType:
        it.itemType === "treatment" || it.itemType === "consultation"
          ? it.itemType
          : "product",
      quantity: Math.max(1, Number(it.quantity || 1)),
      clinicId: it.clinicId || undefined,
      clinicName: it.clinicName || undefined,
      clinicAddress: it.clinicAddress || undefined,
    }));

// Guest carts (no logged-in account) auto-expire after this long since the
// last time the cart was written to, so a stale guest cart doesn't linger
// forever on a shared/public device.
const GUEST_CART_TTL_MS = 60 * 60 * 1000;

// Combine two item lists by id, adding quantities for anything present in
// both — used both to merge a pre-login guest cart into the account cart,
// and to merge this device's local cart with whatever is already saved on
// the backend, instead of one silently overwriting the other.
const mergeCartItems = (base: CartItem[], incoming: CartItem[]): CartItem[] => {
  if (incoming.length === 0) return base;
  const merged = [...base];
  incoming.forEach((item) => {
    const idx = merged.findIndex((existing) => existing.id === item.id);
    if (idx === -1) {
      merged.push(item);
    } else {
      merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + item.quantity };
    }
  });
  return merged;
};

const mergeWishlistItems = (base: CartItem[], incoming: CartItem[]): CartItem[] => {
  if (incoming.length === 0) return base;
  const merged = [...base];
  incoming.forEach((item) => {
    if (!merged.some((existing) => existing.id === item.id)) merged.push(item);
  });
  return merged;
};

// Union two item lists by id, keeping the FIRST list's copy whenever an id
// appears in both (no quantity math). Used to reconcile local state against
// whatever the backend already has saved — those two are normally just two
// copies of the *same* cart, not two separate purchases, so unlike
// mergeCartItems this must never add their quantities together. Doing that
// on every reload/login is what caused cart quantities to snowball
// (1 -> 2 -> 4 -> ...) each time the hydration effect re-ran.
const unionItemsPreferFirst = (base: CartItem[], incoming: CartItem[]): CartItem[] => {
  if (incoming.length === 0) return base;
  const merged = [...base];
  incoming.forEach((item) => {
    if (!merged.some((existing) => existing.id === item.id)) merged.push(item);
  });
  return merged;
};

const toCompactItems = (items: CartItem[]): CartItem[] =>
  items.map(
    ({
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
      clinicId,
      clinicName,
      clinicAddress,
    }) => ({
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
      clinicId,
      clinicName,
      clinicAddress,
    })
  );

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
  const [cartPreview, setCartPreview] = useState<CartPreview | null>(null);
  const [identityKey, setIdentityKey] = useState("guest");
  const [userEmail, setUserEmail] = useState("");
  const [currentRole, setCurrentRole] = useState("guest");
  const [hydrated, setHydrated] = useState(false);
  const scopeRef = useRef("guest");
  const prevRoleRef = useRef("guest");
  // Captures whatever guest cart/wishlist was on the device the moment a
  // guest logs in, so the upcoming hydration effect (for the new,
  // authenticated scope) can merge it in instead of it being wiped.
  const carryOverRef = useRef<{ cart: CartItem[]; wishlist: CartItem[] } | null>(null);
  // Kept in sync with the *current* scope's storage keys every render, so
  // refreshIdentity can still read "the cart we're about to switch away
  // from" at the instant a login event fires.
  const cartStorageKeyRef = useRef("");
  const wishlistStorageKeyRef = useRef("");

  const refreshIdentity = () => {
    const email = Cookies.get("email") || "";
    const userId = Cookies.get("userId") || localStorage.getItem("userId") || "";
    const clinicId = Cookies.get("clinicId") || localStorage.getItem("clinicId") || "";
    const role = Cookies.get("role")?.toLowerCase() || "guest";
    const storedScope =
      Cookies.get("cartScope") || localStorage.getItem("cartScope") || "";
    const b2bUserId = Cookies.get("b2bUserId") || localStorage.getItem("b2bUserId") || "";
    const fallbackScope =
      role === "clinic"
        ? `clinic:${clinicId || email || "guest"}`
        : role === "doctor"
        ? `doctor:${email || "guest"}`
        : role === "user"
        ? `user:${userId || email || "guest"}`
        : role === "b2buser"
        ? `b2buser:${b2bUserId || email || "guest"}`
        : `guest:${userId || email || clinicId || "guest"}`;
    const scope = storedScope || fallbackScope;
    const key = `cart:${scope}`;

    if (scope !== scopeRef.current) {
      const wasGuest = prevRoleRef.current === "guest";
      const isNowAuthenticated =
        role === "user" || role === "clinic" || role === "doctor" || role === "b2buser";

      if (wasGuest && isNowAuthenticated && cartStorageKeyRef.current) {
        const oldCartKey = cartStorageKeyRef.current;
        const oldWishlistKey = wishlistStorageKeyRef.current;
        const guestCart = parseStored(localStorage.getItem(oldCartKey));
        const guestWishlist = parseStored(localStorage.getItem(oldWishlistKey));
        const guestTs = Number(localStorage.getItem(`${oldCartKey}:ts`) || 0);
        const isExpired = guestTs > 0 && Date.now() - guestTs > GUEST_CART_TTL_MS;
        carryOverRef.current = isExpired ? null : { cart: guestCart, wishlist: guestWishlist };

        try {
          localStorage.removeItem(oldCartKey);
          localStorage.removeItem(oldWishlistKey);
          localStorage.removeItem(`${oldCartKey}:ts`);
        } catch {
          // Ignore storage failures; the carried-over copy already in
          // memory is what actually matters.
        }
      } else {
        carryOverRef.current = null;
      }

      setCartItems([]);
      setWishlistItems([]);
      setCartPreview(null);
    }

    scopeRef.current = scope;
    prevRoleRef.current = role;
    setIdentityKey(key);
    setUserEmail(email);
    setCurrentRole(role);
  };

  const cartStorageKey = `cart:${identityKey}`;
  const wishlistStorageKey = `wishlist:${identityKey}`;

  // Set the instant the user interacts with the cart/wishlist, so an
  // in-flight post-login backend hydration fetch (which may have been
  // kicked off before this action, and can resolve after it) knows its
  // result is now stale and must not clobber what the user just did — e.g.
  // removing an item right after login, before that one-time fetch
  // resolves, must not let it resurrect the just-removed item.
  const cartTouchedRef = useRef(false);
  // Bumped every time a new login/identity-hydration cycle starts, so a
  // slow-to-resolve fetch from a previous cycle (e.g. rapid logout ->
  // login -> logout -> login) can detect it's been superseded and discard
  // its result instead of applying stale data on top of the new identity.
  const hydrationGenRef = useRef(0);
  // Coalesces rapid-fire persistBackend calls: without this, removing two
  // items in quick succession fires two independent fetch+PUT sequences
  // that can land on the server out of order, with the older (stale) write
  // finishing last and silently undoing the newer one.
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    cartStorageKeyRef.current = cartStorageKey;
    wishlistStorageKeyRef.current = wishlistStorageKey;
  }, [cartStorageKey, wishlistStorageKey]);

  const persistBackend = async (nextCart: CartItem[], nextWishlist: CartItem[]) => {
    if (currentRole !== "user" || !userEmail) return;
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
    const gen = ++hydrationGenRef.current;
    cartTouchedRef.current = false;
    setHydrated(false);
    let localCart = parseStored(localStorage.getItem(cartStorageKey));
    let localWishlist = parseStored(localStorage.getItem(wishlistStorageKey));

    // Guest carts auto-expire after GUEST_CART_TTL_MS since they were last
    // written to, so a stale guest cart doesn't linger forever.
    if (currentRole === "guest") {
      const ts = Number(localStorage.getItem(`${cartStorageKey}:ts`) || 0);
      if (ts > 0 && Date.now() - ts > GUEST_CART_TTL_MS) {
        localCart = [];
        localWishlist = [];
        try {
          localStorage.removeItem(cartStorageKey);
          localStorage.removeItem(wishlistStorageKey);
          localStorage.removeItem(`${cartStorageKey}:ts`);
        } catch {
          // Ignore storage failures — the in-memory cart is already empty.
        }
      }
    }

    // If this identity switch was a guest logging in, fold whatever they
    // had in their guest cart into this (possibly already-populated)
    // account cart instead of losing it.
    const carryOver = carryOverRef.current;
    carryOverRef.current = null;
    if (carryOver) {
      localCart = mergeCartItems(localCart, carryOver.cart);
      localWishlist = mergeWishlistItems(localWishlist, carryOver.wishlist);
    }

    setCartItems(localCart);
    setWishlistItems(localWishlist);

    const hydrateFromBackend = async () => {
      if (currentRole !== "user" || !userEmail) return;
      try {
        const res = await fetch(`${API_URL}/users/by-email/${encodeURIComponent(userEmail)}`);
        if (!res.ok) return;
        const user = await res.json();
        const backendCart = normalizeItems(Array.isArray(user?.cartItems) ? user.cartItems : []);
        const backendWishlist = normalizeItems(
          Array.isArray(user?.wishlistItems) ? user.wishlistItems : []
        );

        // Discard this result if a newer login/identity cycle has since
        // started, or if the user already acted on their cart/wishlist
        // while this fetch was in flight — applying it now would silently
        // resurrect something the user just removed.
        if (hydrationGenRef.current !== gen || cartTouchedRef.current) return;

        if (backendCart.length || backendWishlist.length) {
          // Union against whatever is *currently* in state (via the
          // functional updater) rather than the `localCart`/`localWishlist`
          // snapshot captured when this effect started — this fetch is
          // async, so the user may have already added something in the
          // meantime, and overwriting with a stale snapshot would silently
          // discard it. Conflicts keep the current/local copy: local and
          // backend are normally two copies of the *same* cart, not two
          // separate purchases, so quantities must not be added together
          // here (that caused quantities to snowball on every reload/login).
          let finalCart: CartItem[] = [];
          setCartItems((prev) => {
            finalCart = unionItemsPreferFirst(prev, backendCart);
            return finalCart;
          });
          let finalWishlist: CartItem[] = [];
          setWishlistItems((prev) => {
            finalWishlist = unionItemsPreferFirst(prev, backendWishlist);
            return finalWishlist;
          });
          safeSetStorageItems(cartStorageKey, finalCart);
          safeSetStorageItems(wishlistStorageKey, finalWishlist);
        }
      } catch {
        // Ignore hydrate failures and continue with local state.
      }
    };

    hydrateFromBackend().finally(() => {
      if (hydrationGenRef.current === gen) setHydrated(true);
    });
  }, [identityKey, userEmail, cartStorageKey, wishlistStorageKey, currentRole]);

  useEffect(() => {
    safeSetStorageItems(cartStorageKey, cartItems);
    safeSetStorageItems(wishlistStorageKey, wishlistItems);
    if (currentRole === "guest") {
      try {
        localStorage.setItem(`${cartStorageKey}:ts`, String(Date.now()));
      } catch {
        // Ignore storage failures — expiry just won't be enforced this write.
      }
    }

    // Debounced: firing an independent fetch+PUT on every single change lets
    // two rapid edits (e.g. removing two items back to back) race each
    // other on the server, where the older/stale write can land last and
    // silently undo the newer one. Coalescing into one write of the final
    // state after a short pause avoids that.
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    const cartToPersist = cartItems;
    const wishlistToPersist = wishlistItems;
    persistTimerRef.current = setTimeout(() => {
      persistBackend(cartToPersist, wishlistToPersist);
    }, 600);
  }, [cartItems, wishlistItems, cartStorageKey, wishlistStorageKey, currentRole]);

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, []);

  // Proactively clear an expired guest cart while the tab stays open past
  // the 1-hour mark, instead of only checking on the next load/hydration.
  useEffect(() => {
    if (currentRole !== "guest") return;
    const interval = setInterval(() => {
      const ts = Number(localStorage.getItem(`${cartStorageKey}:ts`) || 0);
      if (ts > 0 && Date.now() - ts > GUEST_CART_TTL_MS) {
        setCartItems([]);
        setWishlistItems([]);
        try {
          localStorage.removeItem(cartStorageKey);
          localStorage.removeItem(wishlistStorageKey);
          localStorage.removeItem(`${cartStorageKey}:ts`);
        } catch {
          // Ignore storage failures.
        }
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentRole, cartStorageKey, wishlistStorageKey]);

  const addToCart = (product: Omit<CartItem, "quantity">, quantity = 1) => {
    if (
      currentRole !== "clinic" &&
      currentRole !== "doctor" &&
      currentRole !== "user" &&
      currentRole !== "b2buser" &&
      currentRole !== "guest"
    ) {
      return;
    }

    cartTouchedRef.current = true;

    const normalizedProduct: Omit<CartItem, "quantity"> = {
      ...product,
      itemType:
        product.itemType === "treatment" || product.itemType === "consultation"
          ? product.itemType
          : "product",
    };

    const existingItem = cartItems.find((item) => item.id === normalizedProduct.id);
    const nextQuantity = existingItem ? existingItem.quantity + quantity : quantity;
    const preview: CartPreview = {
      message: existingItem ? "Cart updated" : "Added to cart",
      item: { ...normalizedProduct, quantity: nextQuantity },
      action: existingItem ? "updated" : "added",
    };

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === normalizedProduct.id);
      if (existing) {
        return prev.map((item) =>
          item.id === normalizedProduct.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                itemType: item.itemType || normalizedProduct.itemType,
              }
            : item
        );
      }
      return [...prev, { ...normalizedProduct, quantity }];
    });

    setCartPreview(preview);
    emitCartToast(preview);
  };

  const removeFromCart = (id: string) => {
    cartTouchedRef.current = true;
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    cartTouchedRef.current = true;
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const setCartItemClinic = (
    id: string,
    clinic: { clinicId: string; clinicName: string; clinicAddress?: string }
  ) => {
    cartTouchedRef.current = true;
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              clinicId: clinic.clinicId,
              clinicName: clinic.clinicName,
              clinicAddress: clinic.clinicAddress,
            }
          : item
      )
    );
  };

  const clearCart = () => {
    cartTouchedRef.current = true;
    setCartItems([]);
  };
  const dismissCartPreview = () => setCartPreview(null);

  const addToWishlist = (product: Omit<CartItem, "quantity">) => {
    cartTouchedRef.current = true;
    setWishlistItems((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev;
      return [...prev, { ...product, quantity: 1 }];
    });
    // alert(`${product.name} added to wishlist`);
  };

  const removeFromWishlist = (id: string) => {
    cartTouchedRef.current = true;
    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleWishlist = (product: Omit<CartItem, "quantity">) => {
    cartTouchedRef.current = true;
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
        cartPreview,
        addToCart,
        removeFromCart,
        updateQuantity,
        setCartItemClinic,
        clearCart,
        dismissCartPreview,
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
