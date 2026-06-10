import React, { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

const STORAGE_KEY = "popmart_cart";
const BACKEND = import.meta.env.VITE_URL_BACKEND;
const PLACEHOLDER = "https://via.placeholder.com/100";

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const normalize = (product) => ({
  ...product,
  quantity: 1,
  image:
    product.image ||
    product.productImage?.[0]?.secure_url ||
    PLACEHOLDER,
});

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(loadFromStorage);
  const token = () => localStorage.getItem("token");

  // Si hay sesión, los favoritos viven en el server; si no, en localStorage
  useEffect(() => {
    if (!token()) return;
    fetch(`${BACKEND}/api/users/me/favorites`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((favs) => setCartItems(Array.isArray(favs) ? favs.map(normalize) : []))
      .catch(() => {});
  }, []);

  // Persistencia local solo para invitados
  useEffect(() => {
    if (!token()) localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addItemToCart = (item) => {
    setCartItems((prev) => {
      if (prev.find((i) => i._id === item._id)) return prev;
      return [...prev, normalize(item)];
    });
    if (token()) {
      fetch(`${BACKEND}/api/users/me/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ productId: item._id }),
      }).catch(() => {});
    }
  };

  const updateItemQuantity = (itemId, quantity) => {
    const qty = Math.max(1, Number(quantity));
    setCartItems((prev) =>
      prev.map((i) => (i._id === itemId ? { ...i, quantity: qty } : i))
    );
  };

  const removeItem = (itemId) => {
    setCartItems((prev) => prev.filter((i) => i._id !== itemId));
    if (token()) {
      fetch(`${BACKEND}/api/users/me/favorites/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      }).catch(() => {});
    }
  };

  const clearCart = () => {
    if (token()) {
      cartItems.forEach((i) =>
        fetch(`${BACKEND}/api/users/me/favorites/${i._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token()}` },
        }).catch(() => {})
      );
    }
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addItemToCart, updateItemQuantity, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};
