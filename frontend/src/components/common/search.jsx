// import { useState } from "react";

// export default function SearchPage({ tabla }) {
//   const [query, setQuery] = useState("");
//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const handleSearch = async (value) => {
//     setQuery(value);

//     if (!value) {
//       setResults([]);
//       return;
//     }

//     setLoading(true);

//     try {
//       const res = await fetch(
//         `/api/search?table=${tabla}&q=${value}`
//       );

//       const data = await res.json();
//       setResults(data);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-6 max-w-xl mx-auto">
//       <input
//         value={query}
//         onChange={(e) => handleSearch(e.target.value)}
//         placeholder={`Search in ${tabla}...`}
//         className="w-full p-2 border rounded mb-4"
//       />

//       {loading && <p>Searching...</p>}

//       <div className="space-y-3">
//         {results.map((item, i) => (
//           <div key={i} className="p-3 border rounded">
//             {item.item_name && (
//               <>
//                 <p className="font-bold">{item.item_name}</p>
//                 <p>{item.description}</p>
//               </>
//             )}

//             {item.first_name && (
//               <>
//                 <p className="font-bold">
//                   {item.first_name} {item.last_name}
//                 </p>
//                 <p>{item.email}</p>
//               </>
//             )}

//             {item.truck_name && (
//               <>
//                 <p className="font-bold">{item.truck_name}</p>
//                 <p>{item.current_location}</p>
//               </>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }


// import { useState } from "react";

// export default function SearchPage({ tabla, onSelect }) {
//   const [query, setQuery] = useState("");
//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const handleSearch = async (value) => {
//   setQuery(value);

//   if (!value) {
//     setResults([]);
//     onSelect?.(null);
//     return;
//   }

//   setLoading(true);

//   try {
//     const res = await fetch(
//       `/api/search?table=${tabla}&q=${value}`
//     );

//     const data = await res.json();
//     const safeData = Array.isArray(data) ? data : [];

//     setResults(safeData);

//     // 🔥 ESTA ES LA MAGIA
//     onSelect?.(safeData);

//   } catch (err) {
//     console.error(err);
//   } finally {
//     setLoading(false);
//   }
// };

//   const handleSelect = (item) => {
//     // llena el input con lo seleccionado
//     if (item.item_name) setQuery(item.item_name);
//     else if (item.first_name) setQuery(item.first_name);
//     else if (item.truck_name) setQuery(item.truck_name);

//     setResults([]); // oculta sugerencias

//     // manda el item al padre
//     onSelect?.(item);
//   };

//   return (
//     <div className="mb-6">
//       <input
//         value={query}
//         onChange={(e) => handleSearch(e.target.value)}
//         placeholder={`Search in ${tabla}...`}
//         className="w-full p-2 border rounded mb-2"
//       />

//       {loading && <p className="text-sm text-gray-400">Searching...</p>}

//       {results.length > 0 && (
//         <div className="border rounded bg-white shadow-sm max-h-60 overflow-y-auto">
//           {results.map((item, i) => (
//             <div
//               key={i}
//               onClick={() => handleSelect(item)}
//               className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
//             >
//               {item.item_name && (
//                 <p className="font-medium">{item.item_name}</p>
//               )}

//               {item.first_name && (
//                 <p className="font-medium">
//                   {item.first_name} {item.last_name}
//                 </p>
//               )}

//               {item.truck_name && (
//                 <p className="font-medium">{item.truck_name}</p>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

import { useState } from "react";

export default function SearchPage({ tabla, onSelect, placeholder }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (value) => {
    setQuery(value);

    if (!value) {
      setResults([]);
      onSelect?.(null);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/search?table=${tabla}&q=${value}`
      );

      const data = await res.json();
      const safeData = Array.isArray(data) ? data : [];

      setResults(safeData);

      // 🔥 manda resultados al padre
      onSelect?.(safeData);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    // llena el input
    if (item.item_name) setQuery(item.item_name);

    setResults([]);

    // manda SOLO uno si hacen click
    onSelect?.([item]);
  };

  return (
    <div className="mb-6">
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder ?? `Search in ${tabla}...`}
        className="w-full p-2 border border-input rounded bg-background text-foreground mb-2"
      />

      {loading && <p className="text-sm text-muted-foreground">Searching...</p>}

      {results.length > 0 && (
        <div className="border border-border rounded bg-background shadow-sm max-h-60 overflow-y-auto">
          {results.map((item, i) => (
            <div
              key={i}
              onClick={() => handleSelect(item)}
              className="p-2 hover:bg-muted cursor-pointer text-sm text-foreground"
            >
              {item.item_name && (
                <p className="font-medium">{item.item_name}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}