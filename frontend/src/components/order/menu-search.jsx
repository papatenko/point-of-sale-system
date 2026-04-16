import { useState } from "react";
import { Search, X } from "lucide-react";

export function MenuSearch({
  onSearchChange,
  placeholder = "Search menu...",
}) {
  const [query, setQuery] = useState("");

  const handleChange = (value) => {
    setQuery(value);
    onSearchChange?.(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearchChange?.("");
  };

  return (
    <div className="relative mb-6">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-10 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
