import { useState, useCallback } from "react";
import { SEARCH_TABLES } from "@/data/search";

const normalizeArrayResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

async function fetchAllSearchData(tables) {
  const token = localStorage.getItem("token");
  const makeAuthHeaders = () =>
    token ? { Authorization: `Bearer ${token}` } : undefined;

  const fetchPromises = tables.map(async (table) => {
    const res = await fetch(table.endpoint, { headers: makeAuthHeaders() });
    const data = await res.json();
    return { table, res, data };
  });

  const results = await Promise.all(fetchPromises);

  const data = {};
  const errors = [];

  for (const { table, res, data: tableData } of results) {
    if (!res.ok) {
      errors.push(`${table.type}: ${tableData?.error || "Failed to load"}`);
    } else {
      data[table.type] = normalizeArrayResponse(tableData);
    }
  }

  return { data, errors };
}

function searchData(data, tables, term, limit = 50) {
  const searchTermLower = term.trim().toLowerCase();
  const matches = (...fields) =>
    fields.some((f) =>
      String(f ?? "")
        .toLowerCase()
        .includes(searchTermLower),
    );

  const out = [];

  for (const table of tables) {
    if (out.length >= limit) break;

    const items = data[table.type] || [];

    for (const item of items) {
      if (out.length >= limit) break;

      const searchValues = table.searchFields.map((field) => item[field]);
      if (!matches(...searchValues)) continue;

      out.push({
        type: table.type,
        id: item[table.idField],
        title: table.getTitle ? table.getTitle(item) : item[table.titleField],
        details: table.getDetails(item),
      });
    }
  }

  return out;
}

export function useSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  const search = useCallback(async (term) => {
    if (!term.trim()) return;

    setLoading(true);
    setFetchError(null);
    setHasSearched(true);

    try {
      const { data, errors } = await fetchAllSearchData(SEARCH_TABLES);

      if (errors.length > 0) {
        setFetchError(errors.join(" | "));
        setSearchResults([]);
        setLoading(false);
        return;
      }

      const results = searchData(data, SEARCH_TABLES, term, 50);
      setSearchResults(results);
    } catch (err) {
      setFetchError("Failed to search database");
      setSearchResults([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    loading,
    hasSearched,
    searchResults,
    fetchError,
    search,
  };
}
