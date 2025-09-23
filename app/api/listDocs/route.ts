import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dirPath = path.join(process.cwd(), "public/md_files");
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith(".md"));

    const mdFiles = files.map(file => ({
      name: file.replace(".md", "").replace(/^\w/, c => c.toUpperCase()), // Capitalize
      slug: file.replace(".md", ""),
      path: `/md_files/${file}`,
    }));

    return NextResponse.json({ success: true, files: mdFiles });
  } catch (err: any) {
    console.error("Error reading md files:", err);
    return NextResponse.json({ success: false, error: "Failed to list markdown files" }, { status: 500 });
  }
}
