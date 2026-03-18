import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "@/redux/cartSlice";
import { addItem, updateQuantity } from "@/redux/cartSlice";
import { MenuCard } from "@/components/order/menu-card";
import { CartPanel } from "@/components/order/cart-panel";

export const Route = createFileRoute("/employee/pos")({
  component: PosScreen,
});

function PosScreen() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((s) => s.cart.items);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [licensePlate, setLicensePlate] = useState("");

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((data) => {
        setMenu(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const grouped = menu.reduce((acc, item) => {
    const cat = item.category_name;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categoryOrder = [
    "Entrees",
    "Sides",
    "Drinks",
    "Appetizers",
    "Desserts",
  ];
  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b),
  );

  const getQty = (id) =>
    cartItems.find((i) => i.menuItemId === id)?.quantity ?? 0;

  const handleAdd = (item) => {
    dispatch(
      addItem({
        menuItemId: item.menu_item_id,
        name: item.item_name,
        price: parseFloat(item.price),
      }),
    );
  };

  const handleQty = (menuItemId, qty) => {
    dispatch(updateQuantity({ menuItemId, quantity: qty }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: null,
          paymentMethod,
          licensePlate,
          items: cartItems.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      });
      const data = await res.json();
      if (data.orderId) {
        dispatch(clearCart());
        navigate({
          to: "/confirmation/$orderId",
          params: { orderId: String(data.orderId) },
        });
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Menu */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="text-gray-400 py-12 text-center">
                Loading menu...
              </div>
            ) : (
              sortedCategories.map((category) => (
                <section key={category} className="mb-10">
                  <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 text-gray-700">
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {grouped[category].map((item) => (
                      <MenuCard
                        key={item.menu_item_id}
                        item={item}
                        qty={getQty(item.menu_item_id)}
                        onAdd={() => handleAdd(item)}
                        onQty={(q) => handleQty(item.menu_item_id, q)}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>

          {/* Desktop cart panel */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <CartPanel
              items={cartItems}
              total={cartTotal}
              onQty={handleQty}
              onCheckout={() => navigate({ to: "/checkout" })}
            />
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-base font-semibold mb-4">Payment Method</h2>
              <div className="space-y-2.5">
                {[
                  { value: "credit", label: "Credit Card at Pickup" },
                  { value: "debit", label: "Debit Card at Pickup" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                      paymentMethod === opt.value
                        ? "border-amber-500 bg-amber-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={opt.value}
                      checked={paymentMethod === opt.value}
                      onChange={() => setPaymentMethod(opt.value)}
                      className="accent-amber-600"
                    />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile floating cart button */}
      {cartCount > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 rounded-xl shadow-xl flex justify-between items-center px-5 transition-colors"
          >
            <span className="bg-white text-amber-600 rounded-full w-6 h-6 text-sm font-bold flex items-center justify-center flex-shrink-0">
              {cartCount}
            </span>
            <span className="font-semibold">View Cart</span>
            <span className="font-bold">${cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Mobile cart drawer */}
      {cartOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setCartOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Cart</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <CartPanel
              items={cartItems}
              total={cartTotal}
              onQty={handleQty}
              onCheckout={() => {
                setCartOpen(false);
                handleSubmit();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
