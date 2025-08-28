"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { homedir } from "os";
import home from 'home.jpg';

export default function OdysseyPage() {
  const [tags, setTags] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [query, setQuery] = useState("");

  // Fake example dataset (replace with your real data)
  const data = [
    { content: "Common Resource", link: "/narask", summary: "Go to Narask", category: "common", value: 0, keys: ["common", "narask"] },
    { content: "Tech Docs", link: "/nartech", summary: "Explore Nartech", category: "practicals", value: 0, keys: ["tech", "nartech"] },
  ];

  useEffect(() => {
    runSearch();
  }, [query, tags]);

  function runSearch() {
    reset();
    const filteredData = getFilteredData();
    checkKeys(query, filteredData);
    setResults(sort(filteredData));
  }

  function reset() {
    data.forEach(obj => (obj.value = 0));
  }

  function checkKeys(query: string, filteredData: typeof data) {
    filteredData.forEach(obj => {
      obj.keys.forEach(key => {
        if (query.toLowerCase().includes(key.toLowerCase())) {
          obj.value++;
        }
      });
    });
  }

  function sort(filteredData: typeof data) {
    return filteredData.sort((a, b) => b.value - a.value);
  }

  function getFilteredData() {
    if (tags.length === 0) return data;
    return data.filter(obj => tags.includes(obj.category.toLowerCase()));
  }

  function toggleTag(tag: string, checked: boolean) {
    if (checked) {
      setTags([...tags, tag]);
    } else {
      setTags(tags.filter(t => t !== tag));
    }
  }

  return (
    <div className="h-screen w-full overflow-y-scroll snap-y snap-mandatory">
      {/* Navbar */}
      <div className="fixed top-0 left-0 w-full flex justify-between items-center p-4 bg-black bg-opacity-50 z-50">
        <div className="text-white text-2xl font-bold">ODYSSEY</div>
        <nav className="flex gap-4 text-white">
          <Link href="/narask">NARASK</Link>
          <Link href="/narpit">NARPIT</Link>
          <Link href="/nartech">NARTECH</Link>
          <a href="https://manta-scouting-neptune.vercel.app" target="_blank" rel="noopener noreferrer">narstrat</a>
        </nav>
      </div>

      {/* Cover Section */}
      <section className="relative flex flex-col justify-center items-center h-screen w-full snap-start bg-cover bg-center" style={{ backgroundImage: "url(/img/home.jpg)" }}>
        <div className="flex flex-col items-center justify-center text-center text-white z-10">
          <h1 className="text-8xl tracking-widest">ODYSSEY</h1>
          <div className="flex ml-4 text-4xl tracking-widest">
            <p>31</p>
            <p className="ml-2">28</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black to-transparent"></div>
      </section>

      {/* Project Menu */}
      <section id="project_menu" className="flex w-full h-screen snap-start">
        <Link href="/NARASK" className="project_item bg-[#08173a]">
          <p className="num">3</p>
          <h4>NARASK</h4>
        </Link>
        <Link href="/NARPIT" className="project_item bg-[#081e51]">
          <p className="num">1</p>
          <h4>NARPIT</h4>
        </Link>
        <Link href="/nartech" className="project_item bg-[#1e305b]">
          <p className="num">2</p>
          <h4>NARTECH</h4>
        </Link>
        <a href="https://manta-scouting-neptune.vercel.app" target="_blank" rel="noopener noreferrer" className="project_item bg-[#18316b]">
          <p className="num">8</p>
          <h4>Strat</h4>
        </a>
      </section>

      {/* Search Section */}
      <section className="p-8 bg-black text-white min-h-screen">
        <input
          type="text"
          placeholder="Search..."
          className="p-2 text-black rounded"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="flex gap-4 mt-4">
          {["common", "practicals", "github", "other"].map(tag => (
            <label key={tag}>
              <input
                type="checkbox"
                onChange={(e) => toggleTag(tag, e.target.checked)}
                checked={tags.includes(tag)}
              /> {tag}
            </label>
          ))}
        </div>

        <div id="results" className="mt-6">
          {results.map((result, i) => (
            <div key={i} className="mb-4 p-4 border border-gray-600 rounded">
              <a href={result.link} className="text-blue-400 underline">{result.content}</a>
              <p>{result.summary}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

