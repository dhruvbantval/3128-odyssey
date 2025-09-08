"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";

type MdFile = {
  name: string;
  slug: string;
  path: string;
};

const mdFiles: MdFile[] = [
  { name: "Common", slug: "common", path: "/md_files/common.md" },
  { name: "Practicals", slug: "practicals", path: "/md_files/practicals.md" },
  { name: "Github", slug: "github", path: "/md_files/github.md" },
  { name: "Other", slug: "other", path: "/md_files/other.md" },
];

export default function NaraskPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    common: false,
    practicals: false,
    github: false,
    other: false,
  });
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function loadPreviews() {
      const map: Record<string, string> = {};
      for (const file of mdFiles) {
        const res = await fetch(file.path);
        const text = await res.text();
        map[file.slug] = text.split("\n").slice(0, 6).join(" ");
      }
      setPreviews(map);
    }
    loadPreviews();
  }, []);

  const filteredFiles = mdFiles.filter((file) => {
    const matchesSearch =
      search.trim() === "" ||
      file.name.toLowerCase().includes(search.toLowerCase()) ||
      (previews[file.slug]?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const activeFilters = Object.entries(filters)
      .filter(([_, v]) => v)
      .map(([k]) => k);

    const matchesFilter = activeFilters.length === 0 || activeFilters.includes(file.slug);

    return matchesSearch && matchesFilter;
  });

  function toggleFilter(name: keyof typeof filters) {
    setFilters((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  return (
    <div className="min-h-screen relative bg-black p-8 text-white">
      {/* Header */}
      <header className="flex flex-col items-center gap-6 mb-8 relative">
        <button onClick={() => setMenuOpen(!menuOpen)} className="absolute left-0 top-0 p-2">
          <Menu className="w-7 h-7" />
        </button>
        <h1 className="text-4xl font-bold">NARASK</h1>
        <div className="flex w-full max-w-3xl gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="border rounded px-4 py-2 w-full text-black"
          />
        </div>
      </header>

      {/* Slide-in sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-black p-6 transform transition-transform duration-300 z-50 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        {Object.keys(filters).map((key) => (
          <label key={key} className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={filters[key as keyof typeof filters]}
              onChange={() => toggleFilter(key as keyof typeof filters)}
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        ))}
        <button
          onClick={() => setMenuOpen(false)}
          className="mt-6 bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
        >
          Close
        </button>
      </aside>

      {/* Results */}
      <main className="flex-1 mt-4">
        <h3 className="text-lg font-semibold mb-4">Results</h3>
        {filteredFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiles.map((file) => (
              <Link key={file.slug} href={`/docs/${file.slug}`}>
                <div className="border rounded-lg p-6 shadow hover:shadow-lg transition cursor-pointer bg-gray-900">
                  <h2 className="text-xl font-semibold mb-2">{file.name}</h2>
                  <p className="text-gray-400 text-sm">{previews[file.slug] || "Loading..."}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No results found.</p>
        )}
      </main>
    </div>
  );
}
