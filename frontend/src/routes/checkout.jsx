import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "@/redux/cartSlice";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Clock } from "lucide-react";

function getAvailableTimeSlots() {
  const now = new Date();
  const slots = [];

  // Round current time up to the next 30-min boundary
  const rounded = new Date(now);
  const m = rounded.getMinutes();
  if (m === 0) {
    // exactly on the hour — keep
  } else if (m <= 30) {
    rounded.setMinutes(30, 0, 0);
  } else {
    rounded.setHours(rounded.getHours() + 1, 0, 0, 0);
  }

  for (let h = 10; h <= 22; h++) {
    for (const min of [0, 30]) {
      if (h === 22 && min === 30) continue;
      const slot = new Date(now);
      slot.setHours(h, min, 0, 0);
      if (slot < rounded) continue; // past slot

      const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h >= 12 ? "PM" : "AM";
      const label = `${displayH}:${min.toString().padStart(2, "0")} ${ampm}`;
      const value = `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      slots.push({ value, label });
    }
  }
  return slots;
}

function isAfterClosing() {
  const now = new Date();
  return now.getHours() >= 22;
}

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((s) => s.cart.items);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const user = useSelector((s) => s.auth.user);

  // Auth guard
  const token = localStorage.getItem("token");
  useEffect(() => {
    if (!token) {
      navigate({ to: "/auth/login", search: { redirect: "/checkout" } });
    }
  }, [token]);

  const timeSlots = getAvailableTimeSlots();
  const closed = isAfterClosing();

  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [licensePlate, setLicensePlate] = useState("");
  const [scheduledTime, setScheduledTime] = useState(
    timeSlots.length > 0 ? timeSlots[0].value : "",
  );
  const [trucks, setTrucks] = useState([]);
  const [trucksLoading, setTrucksLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/trucks")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setTrucks(list);
        if (list.length > 0) setLicensePlate(list[0].license_plate);
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

  if (closed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <p className="text-xl font-semibold text-gray-800">We're closed</p>
          <p className="text-gray-500 text-sm">
            Online ordering is available 10:00 AM – 10:00 PM.
          </p>
          <Link to="/order">
            <Button variant="outline" className="mt-2">Back to Menu</Button>
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
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customerEmail: user?.email ?? null,
          paymentMethod,
          licensePlate,
          scheduledTime,
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
            {/* Pickup Location */}
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
                        <p className="text-sm font-medium">{truck.truck_name}</p>
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

            {/* Scheduled Pickup Time */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
                <Clock size={16} className="text-amber-600" />
                Pickup Time
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Select your preferred pickup time (10:00 AM – 10:00 PM).
              </p>
              {timeSlots.length === 0 ? (
                <p className="text-sm text-red-500">
                  No available times today. We close at 10:00 PM.
                </p>
              ) : (
                <select
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                  {timeSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Payment Method */}
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
              disabled={submitting || timeSlots.length === 0}
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
