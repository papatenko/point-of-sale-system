import { ShoppingCart, Plus, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CartPanel({ items, total, onQty, onCheckout, checkoutLabel = "Checkout", disabled = false }) {
  if (items.length === 0) {
    return (
      <div className="bg-background rounded-xl shadow-sm border p-6 sticky top-4">
        <h2 className="text-xl font-bold mb-4 text-foreground">Your Cart</h2>
        <div className="text-center py-10 text-muted-foreground">
          <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Your cart is empty</p>
          <p className="text-xs mt-1">Add items from the menu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-xl shadow-sm border p-6 sticky top-4">
      <h2 className="text-xl font-bold mb-4 text-foreground">Your Cart</h2>
      <div className="space-y-4 mb-5">
        {items.map((item) => (
          <div key={item.menuItemId} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight truncate text-foreground">
                {item.name}
              </p>
              <p className="text-xs text-muted-foreground">
                ${item.price.toFixed(2)} each
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => onQty(item.menuItemId, item.quantity - 1)}
                className="w-6 h-6 rounded-full border border-input hover:bg-muted flex items-center justify-center"
              >
                <Minus size={11} />
              </button>
              <span className="text-sm font-bold w-4 text-center text-foreground">
                {item.quantity}
              </span>
              <button
                onClick={() => onQty(item.menuItemId, item.quantity + 1)}
                className="w-6 h-6 rounded-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center"
              >
                <Plus size={11} />
              </button>
            </div>
            {item.quantity >= 2 ? (
              <div className="text-right flex-shrink-0 w-14 ml-1">
                <p className="text-xs line-through text-muted-foreground/70">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  ${(item.price * (item.quantity - 1)).toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-sm font-bold ml-1 w-14 text-right flex-shrink-0 text-foreground">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="border-t pt-4">
        <div className="flex justify-between font-bold text-base mb-4 text-foreground">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <Button
          onClick={onCheckout}
          disabled={disabled}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-60"
        >
          {checkoutLabel}
        </Button>
      </div>
    </div>
  );
}
