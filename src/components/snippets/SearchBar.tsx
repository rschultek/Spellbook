import { useState, useEffect } from "react";
import { useDebounce } from "../../hooks/useDebounce";

interface Props {
  initialQuery?: string;
}

export default function SearchBar({ initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300); // 300ms debounce

  useEffect(() => {
    // Update URL with search query
    const url = new URL(window.location.href);
    if (debouncedQuery) {
      url.searchParams.set("q", debouncedQuery);
    } else {
      url.searchParams.delete("q");
    }
    window.history.replaceState({}, "", url);

    // Reload page to fetch new results
    if (debouncedQuery !== initialQuery) {
      window.location.href = url.toString();
    }
  }, [debouncedQuery]);

  const handleClear = () => {
    setQuery("");
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    window.location.href = url.toString();
  };

  return (
    <div className="relative flex-1">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search snippets..."
        className="w-full px-4 py-2 pl-10 pr-10 border rounded-md"
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      {query && (
        <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          ✕
        </button>
      )}
    </div>
  );
}
