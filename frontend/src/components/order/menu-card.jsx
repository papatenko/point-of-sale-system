import { Plus, Minus } from "lucide-react";

export function MenuCard({ item, qty, onAdd, onQty }) {
  return (
    <div className="bg-background rounded-xl shadow-sm border border-border p-4 flex justify-between items-start gap-4 hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground">{item.item_name}</h3>
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.item_name}
            className="w-full h-40 object-cover rounded-md my-2"
          />
        )}
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
        <p className="font-bold text-amber-600 dark:text-amber-400">
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
              className="w-8 h-8 rounded-full border border-input hover:bg-muted flex items-center justify-center transition-colors"
            >
              <Minus size={14} />
            </button>
            <span className="text-sm font-bold w-5 text-center text-foreground">
              {qty}
            </span>
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
