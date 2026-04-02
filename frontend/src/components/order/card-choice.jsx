export function CardChoice({ paymentMethod, setPaymentMethod }) {
  return (
    <div className="bg-background rounded-xl shadow-sm border p-6">
      <h2 className="text-base font-semibold mb-4 text-foreground">Payment Method</h2>
      <div className="space-y-2.5">
        {[
          { value: "credit", label: "Credit Card at Pickup" },
          { value: "debit", label: "Debit Card at Pickup" },
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
  );
}
