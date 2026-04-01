import { useState } from "react";

export default function SearchPage({ tabla }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (value) => {
    setQuery(value);

    if (!value) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/search?table=${tabla}&q=${value}`
      );

      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={`Search in ${tabla}...`}
        className="w-full p-2 border rounded mb-4"
      />

      {loading && <p>Searching...</p>}

      <div className="space-y-3">
        {results.map((item, i) => (
          <div key={i} className="p-3 border rounded">
            {item.item_name && (
              <>
                <p className="font-bold">{item.item_name}</p>
                <p>{item.description}</p>
              </>
            )}

            {item.first_name && (
              <>
                <p className="font-bold">
                  {item.first_name} {item.last_name}
                </p>
                <p>{item.email}</p>
              </>
            )}

            {item.truck_name && (
              <>
                <p className="font-bold">{item.truck_name}</p>
                <p>{item.current_location}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}