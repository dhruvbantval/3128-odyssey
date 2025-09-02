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


  function runSearch() {
    // 🔹 Example: fake search results
    const sampleData = ["React", "Next.js", "TypeScript", "Tailwind"];
    const filtered = sampleData.filter((item) =>
      item.toLowerCase().includes(search.toLowerCase())
    );
  }

  function toggleFilter(name: keyof typeof filters) {
    setFilters((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <header className="flex flex-col items-center gap-4 mb-8">
        <h1 className="text-4xl font-bold">NARPIT</h1>
        <div className="flex gap-2">
        </div>
      </header>
    </div>
  );
}