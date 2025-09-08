"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";

export default function DocPage() {
  const { slug } = useParams(); // get [slug] from the URL
  const [markdown, setMarkdown] = useState("Loading...");

  useEffect(() => {
    if (!slug) return;

    // get markdown file from /public/md_files/[slug].md
    fetch(`/md_files/${slug}.md`)
      .then((res) => {
        if (!res.ok) throw new Error("File not found");
        return res.text();
      })
      .then((text) => setMarkdown(text))
      .catch(() => setMarkdown("Error: Could not load markdown file."));
  }, [slug]);

  return (
    <main className="p-8 max-w-3xl mx-auto text-white bg-black min-h-screen">
      <h1 className="text-3xl font-bold mb-6 capitalize">{slug}</h1>
      <article className="prose prose-invert">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </article>
    </main>
  );
}


