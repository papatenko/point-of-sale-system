import { Plus, Minus, Info, X } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "@/services/api";

function IngredientsModal({ item, onClose }) {
  const [ingredients, setIngredients] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch on mount
  useEffect(() => {
    apiFetch(`/api/menu/${item.menu_item_id}/ingredients`)
      .then((data) => setIngredients(Array.isArray(data) ? data : []))
      .catch(() => setIngredients([]))
      .finally(() => setLoading(false));
  }, [item.menu_item_id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-xl shadow-xl w-full max-w-xs mx-4 p-5 border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground text-sm">{item.item_name}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Ingredients</p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : ingredients.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ingredient info available.</p>
        ) : (
          <ul className="space-y-1.5">
            {ingredients.map((ing, i) => (
              <li key={i} className="text-sm text-foreground">
                {ing.ingredient_name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function MenuCard({ item, qty, onAdd, onQty, compact = false }) {
  const [showIngredients, setShowIngredients] = useState(false);

  return (
    <div className="bg-background rounded-xl shadow-sm border border-border p-4 flex flex-col hover:shadow-md transition-shadow relative">
      {qty > 0 && (
        <div className="absolute top-4 right-4 bg-amber-600 dark:bg-amber-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {qty}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1 pr-8">
          <h3 className="font-semibold text-foreground">{item.item_name}</h3>
          <button
            onClick={() => setShowIngredients(true)}
            title="View ingredients"
            className="shrink-0 text-muted-foreground hover:text-amber-600 transition-colors mt-0.5"
          >
            <Info size={14} />
          </button>
        </div>
        {!compact && item.image_url && (
          <img
            src={item.image_url}
            alt={item.item_name}
            className="w-full h-40 object-cover rounded-md my-2"
          />
        )}
        {!compact && item.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {item.description}
          </p>
        )}
        {qty >= 2 ? (
          <div className="flex justify-between mt-1 space-y-0.5">
            <p className="text-sm line-through text-muted-foreground/70">
              ${parseFloat(item.price).toFixed(2)}
            </p>
            <span className="inline-block text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded px-1.5 py-0.5">
              1 item free!
            </span>
          </div>
        ) : (
          <p className="font-bold text-amber-600 dark:text-amber-400">
            ${parseFloat(item.price).toFixed(2)}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 mt-2">
        <button
          onClick={() => onQty(qty - 1)}
          className="w-full h-14 rounded-xl border border-input hover:bg-muted flex items-center justify-center transition-colors"
        >
          <Minus size={18} />
        </button>

        <button
          onClick={() => (qty > 0 ? onQty(qty + 1) : onAdd())}
          className="w-full h-14 rounded-xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white flex items-center justify-center transition-colors shadow-sm"
        >
          <Plus size={18} />
        </button>
      </div>

      {showIngredients && (
        <IngredientsModal item={item} onClose={() => setShowIngredients(false)} />
      )}
    </div>
  );
}
