import { useCart } from "@/context/CartContext";

export default function Cart() {
  // const { cart, removeFromCart, clearCart } = useCart();

  // if (cart.length === 0) {
  //   return <h1>Your cart is empty</h1>;
  // }

  return (
    <div>
      {/* <h1>Your Cart</h1>
      <ul>
        {cart.map((item) => (
          <li key={item.id}>
            <h2>{item.name}</h2>
            <p>Price: ${item.price}</p>
            <p>Quantity: {item.quantity}</p>
            <button onClick={() => removeFromCart(item.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <button onClick={clearCart}>Clear Cart</button> */}
    </div>
  );
}
