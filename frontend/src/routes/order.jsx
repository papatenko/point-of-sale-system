import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addItem, updateQuantity } from "@/redux/cartSlice";
import { ShoppingCart, Plus, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/order")({
  component: OrderPage,
});

function OrderPage() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((s) => s.cart.items);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

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

  const categoryOrder = ["Entrees", "Sides", "Drinks", "Appetizers", "Desserts"];
  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  const getQty = (id) =>
    cartItems.find((i) => i.menuItemId === id)?.quantity ?? 0;

  const handleAdd = (item) => {
    dispatch(
      addItem({
        menuItemId: item.menu_item_id,
        name: item.item_name,
        price: parseFloat(item.price),
      })
    );
  };

  const handleQty = (menuItemId, qty) => {
    dispatch(updateQuantity({ menuItemId, quantity: qty }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Menu */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-2">Our Menu</h1>
            <p className="text-gray-500 mb-8">
              Order online for pickup — fresh and made to order.
            </p>

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
              <h2 className="text-xl font-bold">Your Cart</h2>
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
                navigate({ to: "/checkout" });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuCard({ item, qty, onAdd, onQty }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-start gap-4 hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900">{item.item_name}</h3>
        {item.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
        <p className="mt-3 font-bold text-amber-600">
          ${parseFloat(item.price).toFixed(2)}
        </p>
      </div>
      <div className="flex-shrink-0 mt-1">
        {qty === 0 ? (
          <button
            onClick={onAdd}
            className="w-9 h-9 rounded-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center transition-colors shadow-sm"
          >
            <Plus size={18} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onQty(qty - 1)}
              className="w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <Minus size={14} />
            </button>
            <span className="text-sm font-bold w-5 text-center">{qty}</span>
            <button
              onClick={() => onQty(qty + 1)}
              className="w-8 h-8 rounded-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CartPanel({ items, total, onQty, onCheckout }) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-4">
        <h2 className="text-xl font-bold mb-4">Your Cart</h2>
        <div className="text-center py-10 text-gray-400">
          <ShoppingCart
            size={40}
            className="mx-auto mb-3 opacity-30"
          />
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
