export const handleCheckout = async (e) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
