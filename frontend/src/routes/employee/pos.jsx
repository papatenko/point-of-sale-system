import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearCart, addItem, updateQuantity } from "@/redux/cartSlice";
import { X, CheckCircle } from "lucide-react";
import { MenuCard } from "@/components/order/menu-card";
import { CartPanel } from "@/components/order/cart-panel";

export const Route = createFileRoute("/employee/pos")({
  component: PosScreen,
});

function PosScreen() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [successOrder, setSuccessOrder] = useState(null); // { orderId, orderNumber }

  const dispatch = useDispatch();
  const cartItems = useSelector((s) => s.cart.items);
  const cartTotal = cartItems.reduce((sum, i) => sum + (i.quantity >= 2 ? i.price * (i.quantity - 1) : i.price * i.quantity), 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  // Get truck info from logged-in employee
  const user = useSelector((s) => s.auth.user);
  const licensePlate = user?.license_plate ?? null;

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((data) => {
        setMenu(Array.isArray(data) ? data : []);
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

  const categoryOrder = ["Entrees", "Sides", "Drinks", "Appetizers", "Desserts"];
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

  const handlePosCheckout = async () => {
    if (cartItems.length === 0) return;
    setError("");
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/pos/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          paymentMethod,
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
        setCartOpen(false);
        setSuccessOrder({ orderId: data.orderId, orderNumber: data.orderNumber });
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
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Menu */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="text-muted-foreground py-12 text-center">Loading menu...</div>
            ) : (
              sortedCategories.map((category) => (
                <section key={category} className="mb-10">
                  <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-border text-foreground">
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

          {/* Desktop sidebar */}
          <div className="hidden lg:flex flex-col w-80 flex-shrink-0 gap-4">
            {/* Truck badge */}
            {licensePlate && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                <span className="font-semibold">Truck:</span> {licensePlate}
              </div>
            )}

            <CartPanel
              items={cartItems}
              total={cartTotal}
              onQty={handleQty}
              onCheckout={handlePosCheckout}
              checkoutLabel={submitting ? "Placing Order..." : "Place Order"}
              disabled={submitting}
            />

            {/* Payment Method */}
            <div className="bg-background rounded-xl shadow-sm border p-5">
              <h2 className="text-sm font-semibold mb-3 text-foreground">Payment Method</h2>
              <div className="space-y-2">
                {[
                  { value: "cash", label: "Cash" },
                  { value: "credit", label: "Credit Card" },
                  { value: "debit", label: "Debit Card" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      paymentMethod === opt.value
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                        : "border-border hover:bg-muted"
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
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-destructive text-xs bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
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
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-foreground">Cart</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1 hover:bg-muted rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Payment method in mobile drawer */}
            <div className="mb-4">
              <p className="text-sm font-semibold mb-2 text-foreground">Payment</p>
              <div className="flex gap-2">
                {["cash", "credit", "debit"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPaymentMethod(opt)}
                    className={`flex-1 py-2 text-xs rounded-lg border transition-colors capitalize ${
                      paymentMethod === opt
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-semibold"
                        : "border-border text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <CartPanel
              items={cartItems}
              total={cartTotal}
              onQty={handleQty}
              onCheckout={handlePosCheckout}
              checkoutLabel={submitting ? "Placing Order..." : "Place Order"}
              disabled={submitting}
            />

            {error && (
              <p className="text-destructive text-xs mt-3 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Success modal */}
      {successOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center border border-border">
            <CheckCircle size={52} className="text-green-500 dark:text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-1 text-foreground">Order Placed!</h2>
            <p className="text-5xl font-black text-amber-600 my-4">
              #{successOrder.orderNumber}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Order ID: {successOrder.orderId}
            </p>
            <button
              onClick={() => setSuccessOrder(null)}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              New Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
