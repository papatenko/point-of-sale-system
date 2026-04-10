import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "@/redux/cartSlice";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Clock } from "lucide-react";

function localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodayStr() {
  return localDateStr(new Date());
}

function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return localDateStr(d);
}

function isOutsideHours() {
  const h = new Date().getHours();
  return h < 10 || h >= 22;
}

function getAllTimeSlots() {
  const slots = [];
  for (let h = 10; h <= 22; h++) {
    for (const min of [0, 30]) {
      if (h === 22 && min === 30) continue;
      const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h >= 12 ? "PM" : "AM";
      const label = `${displayH}:${min.toString().padStart(2, "0")} ${ampm}`;
      const value = `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      slots.push({ value, label });
    }
  }
  return slots;
}

function getTimeSlotsForDate(dateStr) {
  const allSlots = getAllTimeSlots();
  if (dateStr !== getTodayStr()) return allSlots; // future date — all slots

  // Today: filter out past / current slots
  const now = new Date();
  const rounded = new Date(now);
  const m = rounded.getMinutes();
  if (m === 0) {
    // exactly on the hour — advance 30 min so current slot is excluded if right at hour
  } else if (m <= 30) {
    rounded.setMinutes(30, 0, 0);
  } else {
    rounded.setHours(rounded.getHours() + 1, 0, 0, 0);
  }

  return allSlots.filter((slot) => {
    const [h, min] = slot.value.split(":").map(Number);
    const slotTime = new Date(now);
    slotTime.setHours(h, min, 0, 0);
    return slotTime >= rounded;
  });
}

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((s) => s.cart.items);
  const cartTotal = cartItems.reduce((sum, i) => sum + (i.quantity >= 2 ? i.price * (i.quantity - 1) : i.price * i.quantity), 0);
  const user = useSelector((s) => s.auth.user);

  // Auth guard
  const token = localStorage.getItem("token");
  useEffect(() => {
    if (!token) {
      navigate({ to: "/auth/login", search: { redirect: "/checkout" } });
    }
  }, [token]);

  const outsideHours = isOutsideHours();
  // Outside hours: default to tomorrow since today has no slots
  const defaultDate = outsideHours ? getTomorrowStr() : getTodayStr();
  const initialSlots = getTimeSlotsForDate(defaultDate);

  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [licensePlate, setLicensePlate] = useState("");
  // Outside hours: scheduling is mandatory (toggle locked on)
  const [scheduleEnabled, setScheduleEnabled] = useState(outsideHours);
  const [scheduledDate, setScheduledDate] = useState(defaultDate);
  const [scheduledTime, setScheduledTime] = useState(
    initialSlots.length > 0 ? initialSlots[0].value : "",
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Your cart is empty.</p>
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
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customerEmail: user?.email ?? null,
          paymentMethod,
          licensePlate,
          scheduledDate: scheduleEnabled ? scheduledDate : null,
          scheduledTime: scheduleEnabled ? scheduledTime : null,
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
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link
          to="/order"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Menu
        </Link>

        <h1 className="text-3xl font-bold mb-8 text-foreground">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="md:col-span-3 space-y-5">
            {/* Pickup Location */}
            <div className="bg-background rounded-xl shadow-sm border p-6">
              <h2 className="text-base font-semibold mb-4 text-foreground">Pickup Location</h2>
              {trucksLoading ? (
                <p className="text-sm text-muted-foreground">Loading locations...</p>
              ) : trucks.length === 0 ? (
                <p className="text-sm text-destructive">
                  No pickup locations available.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {trucks.map((truck) => (
                    <label
                      key={truck.license_plate}
                      className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                        licensePlate === truck.license_plate
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                          : "border-border hover:bg-muted"
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
                        <p className="text-sm font-medium text-foreground">{truck.truck_name}</p>
                        {truck.current_location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
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
            <div className="bg-background rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <Clock size={16} className="text-amber-600" />
                  {outsideHours ? "Schedule Pickup (Required)" : "Schedule for Later"}
                </h2>
                {!outsideHours && (
                  <button
                    type="button"
                    onClick={() => setScheduleEnabled((v) => !v)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                      scheduleEnabled ? "bg-amber-600" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        scheduleEnabled ? "translate-x-4" : "translate-x-1"
                      }`}
                    />
                  </button>
                )}
              </div>
              {outsideHours ? (
                <p className="text-xs text-amber-600 mb-3">
                  We're currently closed. Please schedule a pickup for a future date.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mb-3">
                  Leave off to pick up as soon as your order is ready.
                </p>
              )}
              {scheduleEnabled && (() => {
                const slots = getTimeSlotsForDate(scheduledDate);
                return (
                  <div className="space-y-3">
                    {/* Date picker */}
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Pickup Date</label>
                      <input
                        type="date"
                        value={scheduledDate}
                        min={getTodayStr()}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          setScheduledDate(newDate);
                          const newSlots = getTimeSlotsForDate(newDate);
                          setScheduledTime(newSlots.length > 0 ? newSlots[0].value : "");
                        }}
                        className="w-full p-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-background"
                      />
                    </div>
                    {/* Time picker */}
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Pickup Time</label>
                      {slots.length === 0 ? (
                        <p className="text-xs text-destructive">No available time slots for today. Please select a future date.</p>
                      ) : (
                        <select
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full p-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-background"
                        >
                          {slots.map((slot) => (
                            <option key={slot.value} value={slot.value}>
                              {slot.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Payment Method */}
            <div className="bg-background rounded-xl shadow-sm border p-6">
              <h2 className="text-base font-semibold mb-4 text-foreground">Payment Method</h2>
              <div className="space-y-2.5">
                {[
                  { value: "credit", label: "Credit Card" },
                  { value: "debit", label: "Debit Card" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
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
              <p className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
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
            <div className="bg-background rounded-xl shadow-sm border p-6 sticky top-4">
              <h2 className="text-base font-semibold mb-4 text-foreground">Order Summary</h2>
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const original   = item.price * item.quantity;
                  const discounted = item.quantity >= 2 ? item.price * (item.quantity - 1) : null;
                  return (
                  <div
                    key={item.menuItemId}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-foreground">
                      {item.name}{" "}
                      <span className="text-muted-foreground">×{item.quantity}</span>
                    </span>
                    <div className="text-right">
                      {discounted !== null ? (
                        <>
                          <p className="text-xs line-through text-muted-foreground/70">${original.toFixed(2)}</p>
                          <p className="font-semibold text-amber-600 dark:text-amber-400">${discounted.toFixed(2)}</p>
                        </>
                      ) : (
                        <span className="font-medium text-foreground">${original.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
              <div className="border-t mt-4 pt-4 flex justify-between font-bold text-base text-foreground">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Online Pickup · Payment collected at pickup
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
