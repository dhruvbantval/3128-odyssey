"use client";

import { useEffect, useState, useRef } from "react";
import { Menu, ChevronDown, ChevronRight, Copy, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

const howToFile = { name: "How To Add Docs", slug: "howto", path: "/md_files/howto.md" };

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi"); // 'i' = case-insensitive
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-300 text-black px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}


export default function NaraskPage() {
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

  // Load markdown file list
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

  // Load sections whenever mdFiles changes
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

  // Load howto.md dynamically
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

  // Close sidebar when clicking outside
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
    h1: ({ children }: any) => (
      <h1 className="text-3xl font-bold mt-6 mb-4">
        {typeof children === "string" ? <Highlight text={children} query={search} /> : children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-semibold mt-5 mb-3">
        {typeof children === "string" ? <Highlight text={children} query={search} /> : children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-semibold mt-4 mb-2">
        {typeof children === "string" ? <Highlight text={children} query={search} /> : children}
      </h3>
    ),
    p: ({ children }: any) => (
      <p className="mb-3 text-gray-200 leading-relaxed">
        {typeof children === "string" ? <Highlight text={children} query={search} /> : children}
      </p>
    ),
    ul: (props: any) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
    ol: (props: any) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
    li: (props: any) => <li className="ml-4" {...props} />,  
  
    code: ({ className, children, ...props }: any) => {
      const isBlock = className?.includes("language-") || String(children).includes("\n");
      if (isBlock) {
        return (
          <div className="relative my-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(String(children).trim());
              }}
              className="absolute top-2 right-2 px-2 py-1 text-xs text-gray-300 bg-gray-700 rounded hover:bg-gray-600"
            >
              <Copy size={14} />
            </button>
            <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
              <code {...props} className={className}>
                {children}
              </code>
            </pre>
          </div>
        );
      }
      return (
        <code className="bg-gray-800 px-1.5 py-0.5 rounded text-sm" {...props}>
          {children}
        </code>
      );
    },
  };

  // Build display cards
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
    if (mode === "new" && !newDocTitle.trim()) {
      alert("Enter a filename for the new document.");
      return;
    }
    if (mode === "append" && !selectedFile) {
      alert("Select a file to append.");
      return;
    }
    if (!newDocContent.trim()) {
      alert("Documentation content cannot be empty.");
      return;
    }

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

        // reload file list so sidebar + tabs update
        const refresh = await fetch("/api/listDocs");
        const data = await refresh.json();
        if (data.success) setMdFiles(data.files);
      } else {
        alert(result.error || "Failed to save documentation");
      }
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
        <h1 className="text-4xl font-bold text-center">NARASK</h1>

        {/* Add Documentation Button */}
        <button
          onClick={() => setAddDocOpen(true)}
          className="absolute right-0 top-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg transition"
        >
          <Plus size={18} /> Add Documentation
        </button>

        {/* Search */}
        <div className="w-full max-w-3xl relative group">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: "0 0 8px 2px rgba(59,130,246,0.35)" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="relative border rounded-full border-gray-700 px-4 py-2 w-full text-white bg-black 
             focus:outline-none focus:ring-0 
             group-hover:shadow-[0_0_16px_5px_rgba(59,130,246,0.6)]
             transition-all duration-300"
          />
        </div>
      </header>

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
                  className={`px-4 py-2 rounded-lg font-medium ${
                    !showHowTo ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
                  }`}
                >
                  Write Documentation
                </button>
                <button
                  onClick={() => setShowHowTo(true)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    showHowTo ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
                  }`}
                >
                  How to Write Documentation
                </button>
              </div>

              {showHowTo ? (
                <div className="max-h-96 overflow-y-auto bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {howToInstructions || "Loading instructions..."}
                  </ReactMarkdown>
                </div>
              ) : (
                <form className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="new"
                        checked={mode === "new"}
                        onChange={() => setMode("new")}
                      />
                      Create new file
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="append"
                        checked={mode === "append"}
                        onChange={() => setMode("append")}
                      />
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
                  <button
                    type="button"
                    onClick={handleSaveDoc}
                    className="self-end px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500"
                  >
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
              
                setExpandedFiles((prev) => {
                  const newSet = new Set(prev);
                  newSet.add(file.slug);
                  return newSet;
                });
              
                setOpenDropdown(openDropdown === file.slug ? null : file.slug);
              
                setTimeout(() => {
                  document.getElementById(file.slug)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }, 300);
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
                  
                      // switch to the file tab if not already there
                      setActiveFilter(file.slug);
                  
                      setExpandedFiles((prev) => {
                        const newSet = new Set(prev);
                        newSet.add(file.slug);
                        return newSet;
                      });
                  
                      setExpandedSections((prev) => {
                        const newSet = new Set(prev);
                        newSet.add(sectionId);
                        return newSet;
                      });
                  
                      // wait a bit so React renders the right file tab before scrolling
                      setTimeout(() => {
                        document.getElementById(sectionId)?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }, 300);
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

      {/* Filters and Results */}
      <div className="w-full max-w-full mx-auto mt-6">
        <div className="flex border-gray-700">
          {mdFiles.map((file) => (
            <button
              key={file.slug}
              onClick={() => setActiveFilter(activeFilter === file.slug ? null : file.slug)}
              className={`px-6 py-2 rounded-t-lg font-medium transition-colors
                ${
                  activeFilter === file.slug
                    ? "bg-gray-900 text-blue-400 border-x border-t border-gray-700 -mb-px"
                    : "text-gray-400 hover:text-gray-200"
                }`}
            >
              {file.name}
            </button>
          ))}
          <button
            onClick={() => setActiveFilter(null)}
            className={`ml-auto px-6 py-2 rounded-t-lg font-medium transition-colors
              ${
                activeFilter === null
                  ? "bg-gray-900 text-blue-400 border-x border-t border-gray-700 -mb-px"
                  : "text-gray-400 hover:text-gray-200"
              }`}
          >
            All
          </button>
        </div>

        {/* Results Box */}
        <div className="border border-gray-700 rounded-b-lg rounded-tr-lg bg-gray-900 p-6">
          {displayCards.length > 0 ? (
            <div className="flex flex-col gap-6">
              {displayCards.map((item) => {
                if (item.type === "file") {
                  const fileId = item.file.slug;
                  const fileOpen = expandedFiles.has(fileId);

                  return (
                    <motion.div
                      key={fileId}
                      id={fileId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-700"
                    >
                      <button
                        className="flex items-center justify-between w-full text-left font-semibold text-lg"
                        onClick={() => {
                          setExpandedFiles((prev) => {
                            const newSet = new Set(prev);
                            if (newSet.has(fileId)) newSet.delete(fileId);
                            else newSet.add(fileId);
                            return newSet;
                          });

                          setTimeout(() => {
                            document.getElementById(fileId)?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 100);
                        }}
                      >
                        {item.file.name}
                        {fileOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </button>

                      <AnimatePresence>
                        {fileOpen && sections[fileId] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 space-y-4"
                          >
                            {sections[fileId].map((sec, idx) => {
                              const sectionId = `${fileId}-section-${idx}`;
                              const secOpen = expandedSections.has(sectionId);

                              return (
                                <motion.div
                                  key={sectionId}
                                  id={sectionId}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-gray-700 p-4 rounded-xl shadow border border-gray-600"
                                >
                                  <button
                                    className="flex items-center justify-between w-full text-left"
                                    onClick={() => {
                                      setExpandedSections((prev) => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(sectionId)) newSet.delete(sectionId);
                                        else newSet.add(sectionId);
                                        return newSet;
                                      });

                                      setTimeout(() => {
                                        document.getElementById(sectionId)?.scrollIntoView({
                                          behavior: "smooth",
                                          block: "start",
                                        });
                                      }, 100);
                                    }}
                                  >
                                    <span className="font-medium">{sec.heading}</span>
                                    {secOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                  </button>

                                  <AnimatePresence>
                                    {secOpen && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="mt-3"
                                      >
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                          {sec.fullText}
                                        </ReactMarkdown>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                } else if (item.type === "section") {
                  const fileId = item.file.slug;
                  const sectionId = `${fileId}-section-${item.idx}`;
                  const secOpen = expandedSections.has(sectionId);
                
                  return (
                    <motion.div
                      key={sectionId}
                      id={sectionId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700"
                    >
                      {/* Parent File Name */}
                      <div className="text-sm text-gray-400 mb-2">
                        In file: <span className="font-semibold">{item.file.name}</span>
                      </div>
                
                      {/* Section Heading */}
                      <button
                        className="flex items-center justify-between w-full text-left font-medium"
                        onClick={() => {
                          setExpandedSections((prev) => {
                            const newSet = new Set(prev);
                            if (newSet.has(sectionId)) newSet.delete(sectionId);
                            else newSet.add(sectionId);
                            return newSet;
                          });
                
                          setTimeout(() => {
                            document.getElementById(sectionId)?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }, 100);
                        }}
                      >
                        <span className="text-lg">
                          <Highlight text={item.section?.heading || ""} query={search} />
                        </span>
                        {secOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                
                      {/* Section Content */}
                      <AnimatePresence>
                        {secOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-3"
                          >
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                              {item.section?.fullText || ""}
                            </ReactMarkdown>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                }
                
                
                return null;
              })}
            </div>
          ) : (
            <p className="text-gray-400">No results found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
