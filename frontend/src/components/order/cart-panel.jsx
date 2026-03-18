import { ShoppingCart, Plus, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CartPanel({ items, total, onQty, onCheckout }) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-4">
        <h2 className="text-xl font-bold mb-4">Your Cart</h2>
        <div className="text-center py-10 text-gray-400">
          <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Your cart is empty</p>
          <p className="text-xs mt-1">Add items from the menu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-4">
      <h2 className="text-xl font-bold mb-4">Your Cart</h2>
      <div className="space-y-4 mb-5">
        {items.map((item) => (
          <div key={item.menuItemId} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight truncate">
                {item.name}
              </p>
              <p className="text-xs text-gray-400">
                ${item.price.toFixed(2)} each
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => onQty(item.menuItemId, item.quantity - 1)}
                className="w-6 h-6 rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
              >
                <Minus size={11} />
              </button>
              <span className="text-sm font-bold w-4 text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => onQty(item.menuItemId, item.quantity + 1)}
                className="w-6 h-6 rounded-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center"
              >
                <Plus size={11} />
              </button>
            </div>
            <p className="text-sm font-bold ml-1 w-14 text-right flex-shrink-0">
              ${(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
      <div className="border-t pt-4">
        <div className="flex justify-between font-bold text-base mb-4">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <Button
          onClick={onCheckout}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        >
          Checkout
        </Button>
      </div>
    </div>
  );
}
