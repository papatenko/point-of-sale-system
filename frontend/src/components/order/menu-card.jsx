import { Plus, Minus } from "lucide-react";

export function MenuCard({ item, qty, onAdd, onQty, compact = false }) {
  return (
    <div className="bg-background rounded-xl shadow-sm border border-border p-4 flex flex-col hover:shadow-md transition-shadow relative">
      {qty > 0 && (
        <div className="absolute top-4 right-4 bg-amber-600 dark:bg-amber-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {qty}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground pr-8">{item.item_name}</h3>
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
    </div>
  );
}
