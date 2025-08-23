"use client";

import { useState } from "react";

export default function Home() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    common: false,
    practicals: false,
    github: false,
    other: false,
  });

  const [results, setResults] = useState<string[]>([]);

  function runSearch() {
    // 🔹 Example: fake search results
    const sampleData = ["React", "Next.js", "TypeScript", "Tailwind"];
    const filtered = sampleData.filter((item) =>
      item.toLowerCase().includes(search.toLowerCase())
    );
    setResults(filtered);
  }

  function toggleFilter(name: keyof typeof filters) {
    setFilters((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <header className="flex flex-col items-center gap-4 mb-8">
        <h1 className="text-4xl font-bold">NARASK</h1>
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="border rounded px-3 py-2 w-64"
          />
          <button
            onClick={runSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </header>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-40 space-y-2">
          <h3 className="text-lg font-semibold">Filter</h3>
          {Object.keys(filters).map((key) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters[key as keyof typeof filters]}
                onChange={() => toggleFilter(key as keyof typeof filters)}
              />
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </label>
          ))}
        </aside>

        {/* Results */}
        <main className="flex-1">
          <h3 className="text-lg font-semibold mb-2">Results</h3>
          {results.length > 0 ? (
            <ul className="list-disc pl-5">
              {results.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No results yet. Try searching!</p>
          )}
        </main>
      </div>
    </div>
  );
}
