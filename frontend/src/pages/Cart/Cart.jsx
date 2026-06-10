import React, { useContext } from "react";
import { CartContext } from "../../context/CartContext";
import "./Cart.styles.css";
import { Link } from "react-router-dom";
import NavBar from "../../components/Navbar";

const PLACEHOLDER = "https://via.placeholder.com/100";

export const Cart = () => {
  const { cartItems, updateItemQuantity, removeItem, clearCart } = useContext(CartContext);

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <>
        <NavBar />
        <div className="cart-empty">
          <h2>Tus Favoritos está vacío</h2>
          <p>¡Explorá los productos y guardá los que más te gusten!</p>
          <Link to="/home" className="cart-empty-link">Ver productos</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="cart-container">
        <h1>Tus Favoritos</h1>
        <table className="cart-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Cantidad</th>
              <th>Subtotal</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map((item) => (
              <tr key={item._id}>
                <td>
                  <div className="cart-image-container">
                    <img
                      className="cart-image"
                      src={item.image || PLACEHOLDER}
                      alt={item.title}
                    />
                  </div>
                </td>
                <td>{item.title}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>
                  <div className="qty-controls">
                    <button className="qty-btn" onClick={() => updateItemQuantity(item._id, item.quantity - 1)}>−</button>
                    <span className="qty-value">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateItemQuantity(item._id, item.quantity + 1)}>+</button>
                  </div>
                </td>
                <td>${(item.price * item.quantity).toFixed(2)}</td>
                <td>
                  <button className="remove-btn" onClick={() => removeItem(item._id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="cart-summary">
          <h2>Total: ${total.toFixed(2)}</h2>
          <button className="clear-btn" onClick={clearCart}>Limpiar Favoritos</button>
        </div>
      </div>
    </>
  );
};

export default Cart;
