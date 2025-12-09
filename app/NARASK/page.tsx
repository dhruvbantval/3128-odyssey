"use client";

import { useEffect, useState, useRef } from "react";
import { Menu, ChevronDown, ChevronRight, Copy, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import dynamic from "next/dynamic";

// Dynamically import react-pdf to avoid SSR issues
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false }
);
const Page = dynamic(
  () => import("react-pdf").then((mod) => mod.Page),
  { ssr: false }
);

type MdFile = {
  name: string;
  slug: string;
  path: string;
};

type Section = {
  heading: string;
  preview: string;
  fullText: string;
};

type SectionsMap = Record<string, Section[]>;

type PdfFile = {
  name: string;
  url: string;
};

// highlight component
const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <>
      {parts.map((part, idx) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={idx} className="bg-yellow-400 text-black">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};

export default function NaraskPage() {
  // --- TABS ---
  const [activeTab, setActiveTab] = useState<"software" | "barketing">("software");

  // --- SOFTWARE STATE ---
  const [mdFiles, setMdFiles] = useState<MdFile[]>([]);
  const [sections, setSections] = useState<SectionsMap>({});
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [howToInstructions, setHowToInstructions] = useState<string>("");

  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  const [mode, setMode] = useState<"new" | "append">("new");
  const [selectedFile, setSelectedFile] = useState<string>("");

  const sidebarRef = useRef<HTMLDivElement>(null);
  const howToFile = { name: "How To Add Docs", slug: "howto", path: "/md_files/howto.md" };

  // --- BARKETING STATE ---
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<PdfFile | null>(null);

  // --- LOAD PDFs ---
  useEffect(() => {
    const loadPdfs = async () => {
      try {
        const res = await fetch("/api/barketing/listPdfs");
        const data = await res.json();
        if (data.success) setPdfFiles(data.files);
      } catch (err) {
        console.error("Failed to load PDFs:", err);
      }
    };
    loadPdfs();
  }, []);

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    try {
      const res = await fetch("/api/barketing/uploadPdf", { method: "POST", body: formData });
      const result = await res.json();
      if (result.success) {
        alert("PDF uploaded!");
        const refresh = await fetch("/api/barketing/listPdfs");
        const data = await refresh.json();
        if (data.success) setPdfFiles(data.files);
      } else {
        alert("Upload failed: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    }
  };

  // --- LOAD MARKDOWN FILES ---
  useEffect(() => {
    const loadMdFiles = async () => {
      try {
        const res = await fetch("/api/listDocs");
        const data = await res.json();
        if (data.success) setMdFiles(data.files);
      } catch (err) {
        console.error("Failed to load md files:", err);
      }
    };
    loadMdFiles();
  }, []);

  useEffect(() => {
    const loadSections = async () => {
      const sectionMap: SectionsMap = {};
      for (const file of mdFiles) {
        try {
          const res = await fetch(file.path);
          const text = await res.text();
          const rawSections = text.split(/^##\s+/m).slice(1);
          sectionMap[file.slug] = rawSections.map((section) => {
            const lines = section.split("\n");
            const heading = lines[0].trim();
            const fullText = lines.slice(1).join("\n").trim();
            const preview = lines.slice(1, 5).join(" ").trim();
            return { heading, preview, fullText };
          });
        } catch (err) {
          console.error(`Failed to load ${file.name}:`, err);
        }
      }
      setSections(sectionMap);
    };
    if (mdFiles.length) loadSections();
  }, [mdFiles]);

  useEffect(() => {
    async function loadHowTo() {
      try {
        const res = await fetch(howToFile.path);
        const text = await res.text();
        setHowToInstructions(text);
      } catch (err) {
        console.error("Failed to load howto.md:", err);
      }
    }
    loadHowTo();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuOpen && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const markdownComponents = {
    h1: ({ children }: any) => <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-2xl font-semibold mt-5 mb-3">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>,
    p: ({ children }: any) => <p className="mb-3 text-gray-200 leading-relaxed">{children}</p>,
    ul: (props: any) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
    ol: (props: any) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
    li: (props: any) => <li className="ml-4" {...props} />,
    code: ({ className, children, ...props }: any) => (
      <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
        <code {...props} className={className}>
          {children}
        </code>
      </pre>
    ),
  };

  // --- Build Display Cards ---
  let displayCards: { type: "file" | "section"; file: MdFile; section?: Section; idx?: number }[] = [];
  if (search.trim() === "" && !activeFilter) {
    displayCards = mdFiles.map((file) => ({ type: "file", file }));
  } else {
    mdFiles.forEach((file) => {
      if (sections[file.slug]) {
        sections[file.slug].forEach((section, idx) => {
          const query = search.toLowerCase();
          const matches =
            section.heading.toLowerCase().includes(query) ||
            section.preview.toLowerCase().includes(query) ||
            section.fullText.toLowerCase().includes(query);
          if ((!activeFilter || activeFilter === file.slug) && (search.trim() === "" || matches)) {
            displayCards.push({ type: "section", file, section, idx });
          }
        });
      }
    });
  }

  const handleSaveDoc = async () => {
    if (mode === "new" && !newDocTitle.trim()) return alert("Enter a filename.");
    if (mode === "append" && !selectedFile) return alert("Select a file to append.");
    if (!newDocContent.trim()) return alert("Content cannot be empty.");

    try {
      const filename = mode === "new" ? newDocTitle.trim() : selectedFile;
      const res = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, content: newDocContent, mode }),
      });
      const result = await res.json();
      if (result.success) {
        alert("Documentation saved!");
        setAddDocOpen(false);
        setNewDocTitle("");
        setNewDocContent("");
        setSelectedFile("");

        const refresh = await fetch("/api/listDocs");
        const data = await refresh.json();
        if (data.success) setMdFiles(data.files);
      } else alert(result.error || "Failed to save");
    } catch (err) {
      console.error(err);
      alert("Error saving documentation");
    }
  };

  return (
    <div className="min-h-screen relative bg-black p-8 text-white">
      {/* Header */}
      <header className="flex flex-col items-center gap-6 mb-8 relative">
        <button onClick={() => setMenuOpen(!menuOpen)} className="absolute left-0 top-0 p-2">
          <Menu className="w-7 h-7" />
        </button>

        {/* Tabs */}
        <div className="flex">
          <button
            onClick={() => setActiveTab("software")}
            className={`px-6 py-2 bg-black relative ${
              activeTab === "software"
                ? "after:block after:absolute after:-bottom-1 after:left-0 after:w-full after:h-1 after:bg-white"
                : ""
            }`}
          >
            Software
          </button>
          <button
            onClick={() => setActiveTab("barketing")}
            className={`px-6 py-2 bg-black relative ${
              activeTab === "barketing"
                ? "after:block after:absolute after:-bottom-1 after:left-0 after:w-full after:h-1 after:bg-white"
                : ""
            }`}
          >
            Barketing
          </button>
        </div>

        <h1 className="text-4xl font-bold text-center">NARASK</h1>

        <button
          onClick={() => setAddDocOpen(true)}
          className="absolute right-0 top-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg transition"
        >
          <Plus size={18} /> Add Documentation
        </button>

        <div className="w-full max-w-3xl relative group">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="relative border rounded-full border-gray-700 px-4 py-2 w-full text-white bg-black focus:outline-none"
          />
        </div>
      </header>

      {/* SOFTWARE SECTION */}
      {activeTab === "software" && (
        <>
          {/* Add Documentation Modal */}
          <AnimatePresence>
            {addDocOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-gray-900 p-6 rounded-2xl w-full max-w-3xl text-white relative"
                >
                  <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-white"
                    onClick={() => setAddDocOpen(false)}
                  >
                    ✕
                  </button>
                  <h2 className="text-2xl font-bold mb-4">Add Documentation</h2>

                  <div className="flex gap-4 mb-4">
                    <button
                      onClick={() => setShowHowTo(false)}
                      className={`px-4 py-2 rounded-lg font-medium ${!showHowTo ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"}`}
                    >
                      Write Documentation
                    </button>
                    <button
                      onClick={() => setShowHowTo(true)}
                      className={`px-4 py-2 rounded-lg font-medium ${showHowTo ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"}`}
                    >
                      How to Write Documentation
                    </button>
                  </div>

                  {showHowTo ? (
                    <div className="max-h-96 overflow-y-auto bg-gray-800 p-4 rounded-lg border border-gray-700">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{howToInstructions || "Loading instructions..."}</ReactMarkdown>
                    </div>
                  ) : (
                    <form className="flex flex-col gap-4">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input type="radio" value="new" checked={mode === "new"} onChange={() => setMode("new")} />
                          Create new file
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" value="append" checked={mode === "append"} onChange={() => setMode("append")} />
                          Add to existing file
                        </label>
                      </div>

                      {mode === "new" ? (
                        <input
                          type="text"
                          value={newDocTitle}
                          onChange={(e) => setNewDocTitle(e.target.value)}
                          placeholder="Enter new document filename..."
                          className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none"
                        />
                      ) : (
                        <select
                          value={selectedFile}
                          onChange={(e) => setSelectedFile(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none"
                        >
                          <option value="">Select file to append</option>
                          {mdFiles.map((f) => (
                            <option key={f.slug} value={f.slug}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      )}

                      <textarea
                        value={newDocContent}
                        onChange={(e) => setNewDocContent(e.target.value)}
                        placeholder="Write your documentation in markdown..."
                        rows={12}
                        className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none font-mono"
                      />
                      <button type="button" onClick={handleSaveDoc} className="self-end px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500">
                        Save
                      </button>
                    </form>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sidebar */}
          <aside
            ref={sidebarRef}
            className={`fixed top-0 left-0 h-full w-72 bg-black p-6 transform transition-transform duration-500 ease-in-out z-50 overflow-y-auto ${
              menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <h3 className="text-lg font-semibold mb-4">Sections</h3>
            {mdFiles.map((file) => (
              <div key={file.slug} className="mb-4">
                <button
                  className="flex items-center justify-between w-full text-left font-semibold py-2 hover:text-blue-400"
                  onClick={() => {
                    setActiveFilter(file.slug);
                    setExpandedFiles((prev) => new Set(prev.add(file.slug)));
                    setOpenDropdown(openDropdown === file.slug ? null : file.slug);
                    setTimeout(() => document.getElementById(file.slug)?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
                  }}
                >
                  {file.name}
                  {openDropdown === file.slug ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {openDropdown === file.slug && sections[file.slug] && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="pl-4 mt-2 space-y-2 text-gray-300"
                    >
                      {sections[file.slug].map((sec, idx) => (
                        <li
                          key={idx}
                          className="cursor-pointer hover:text-blue-400"
                          onClick={() => {
                            const sectionId = `${file.slug}-section-${idx}`;
                            setActiveFilter(file.slug);
                            setExpandedFiles((prev) => new Set(prev.add(file.slug)));
                            setExpandedSections((prev) => new Set(prev.add(sectionId)));
                            setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
                          }}
                        >
                          {sec.heading}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </aside>

          {/* Filters & Results */}
<div className="w-full max-w-full mx-auto mt-6">
  {/* Filters */}
  <div className="flex border-gray-700">
    {mdFiles.map((file) => (
      <button
        key={file.slug}
        onClick={() => setActiveFilter(activeFilter === file.slug ? null : file.slug)}
        className={`px-3 py-1 border rounded-lg mr-2 mb-2 text-sm ${
          activeFilter === file.slug ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border-gray-700"
        }`}
      >
        {file.name}
      </button>
    ))}
  </div>

  {/* Results */}
  <div className="mt-4 space-y-6">
    {displayCards.length > 0 ? (
      displayCards.map((card, idx) =>
        card.type === "file" ? (
          <div key={idx} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
            <h3
              className="font-semibold text-lg cursor-pointer flex justify-between items-center"
              onClick={() => {
                const expanded = new Set(expandedFiles);
                if (expanded.has(card.file.slug)) expanded.delete(card.file.slug);
                else expanded.add(card.file.slug);
                setExpandedFiles(expanded);
              }}
            >
              {card.file.name}
              {expandedFiles.has(card.file.slug) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </h3>

            {/* Expand sections inside file */}
            <AnimatePresence>
              {expandedFiles.has(card.file.slug) && sections[card.file.slug] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-3 space-y-4"
                >
                  {sections[card.file.slug].map((section, secIdx) => {
                    const sectionId = `${card.file.slug}-section-${secIdx}`;
                    return (
                      <div
                        key={sectionId}
                        id={sectionId}
                        className="bg-gray-800 p-3 rounded-lg cursor-pointer hover:bg-gray-700"
                        onClick={() => {
                          const expanded = new Set(expandedSections);
                          if (expanded.has(sectionId)) expanded.delete(sectionId);
                          else expanded.add(sectionId);
                          setExpandedSections(expanded);
                        }}
                      >
                        <h4 className="font-semibold text-md flex justify-between items-center">
                          <Highlight text={section.heading} query={search} />
                          {expandedSections.has(sectionId) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </h4>

                        <AnimatePresence>
                          {expandedSections.has(sectionId) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-2 text-sm text-gray-200"
                            >
                              <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                                {section.fullText}
                              </ReactMarkdown>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          // Direct section card when filtering/searching
          <div
            key={idx}
            id={`${card.file.slug}-section-${card.idx}`}
            className="bg-gray-900 p-4 rounded-lg border border-gray-700"
          >
            <h4 className="font-semibold text-lg">
              <Highlight text={card.section!.heading} query={search} />
            </h4>
            <p className="text-gray-300">
              <Highlight text={card.section!.preview} query={search} />
            </p>
            <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
              {card.section!.fullText}
            </ReactMarkdown>
          </div>
        )
      )
    ) : (
      <p className="text-gray-400">No results found.</p>
    )}
  </div>
</div>

        </>
      )}

      {/* BARKETING SECTION */}
      {activeTab === "barketing" && (
        <section className="mt-8">
          <h2 className="text-3xl font-bold mb-4">Barketing Documentation</h2>
          <label className="block mb-4 cursor-pointer">
            <span className="bg-blue-600 px-4 py-2 rounded">Upload PDF</span>
            <input type="file" accept="application/pdf" onChange={handleUploadPdf} className="hidden" />
          </label>
          <div className="space-y-3">
            {pdfFiles.map((pdf) => (
              <div
                key={pdf.name}
                className="bg-gray-800 p-3 rounded cursor-pointer hover:bg-gray-700"
                onClick={() => setSelectedPdf(pdf)}
              >
                {pdf.name}
              </div>
            ))}
          </div>
          {selectedPdf && (
            <div className="mt-6 bg-gray-900 p-4 rounded-xl">
              <h3 className="text-xl font-semibold mb-2">{selectedPdf.name}</h3>
              <div className="border border-gray-700 rounded-lg overflow-hidden flex justify-center">
                <Document file={selectedPdf.url}>
                  <Page pageNumber={1} width={800} />
                </Document>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
