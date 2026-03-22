import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "@/redux/cartSlice";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";

// Decode JWT payload to get user info (no verification needed client-side)
function getEmailFromToken(token) {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload.email ?? null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((s) => s.cart.items);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Auth guard — must be logged in to checkout
  const token = localStorage.getItem("token");
  useEffect(() => {
    if (!token) {
      navigate({ to: "/auth/login", search: { redirect: "/checkout" } });
    }
  }, [token]);

  const customerEmail =
    localStorage.getItem("userEmail") ||
    (token ? getEmailFromToken(token) : null);

  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [licensePlate, setLicensePlate] = useState("");
  const [trucks, setTrucks] = useState([]);
  const [trucksLoading, setTrucksLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/trucks")
      .then((r) => r.json())
      .then((data) => {
        setTrucks(data);
        if (data.length > 0) setLicensePlate(data[0].license_plate);
      })
      .catch(() => {})
      .finally(() => setTrucksLoading(false));
  }, []);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <Link to="/order">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              Browse Menu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail,
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link
          to="/order"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Menu
        </Link>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="md:col-span-3 space-y-5">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-base font-semibold mb-4">Pickup Location</h2>
              {trucksLoading ? (
                <p className="text-sm text-gray-400">Loading locations...</p>
              ) : trucks.length === 0 ? (
                <p className="text-sm text-red-500">
                  No pickup locations available.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {trucks.map((truck) => (
                    <label
                      key={truck.license_plate}
                      className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                        licensePlate === truck.license_plate
                          ? "border-amber-500 bg-amber-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="licensePlate"
                        value={truck.license_plate}
                        checked={licensePlate === truck.license_plate}
                        onChange={() => setLicensePlate(truck.license_plate)}
                        className="accent-amber-600 mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {truck.truck_name}
                        </p>
                        {truck.current_location && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={11} />
                            {truck.current_location}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

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

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-6 text-base font-semibold disabled:opacity-60"
            >
              {submitting
                ? "Placing Order..."
                : `Place Order · $${cartTotal.toFixed(2)}`}
            </Button>
          </form>

          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-4">
              <h2 className="text-base font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-700">
                      {item.name}{" "}
                      <span className="text-gray-400">×{item.quantity}</span>
                    </span>
                    <span className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-4 pt-4 flex justify-between font-bold text-base">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                Online Pickup · Payment collected at pickup
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
