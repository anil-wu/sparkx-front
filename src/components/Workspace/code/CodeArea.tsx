"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from '@/i18n/client';
import ProjectPanel from '../project/ProjectPanel';

interface CodeAreaProps {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  projectId?: string;
  userId?: number;
  userToken?: string;
}

type FileTreeNode = {
  path: string;
  name: string;
  type: "folder" | "file";
  children?: FileTreeNode[];
};

type FileViewKind = "image" | "audio" | "video" | "markdown" | "json" | "text" | "binary";

type LoadedFile = {
  path: string;
  sizeBytes: number;
  mime: string;
  kind: FileViewKind;
  content: string | null;
  rawUrl: string;
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const fixed = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(fixed)} ${units[unitIndex]}`;
}

function getFileExt(p: string) {
  const lastDot = p.lastIndexOf(".");
  if (lastDot < 0) return "";
  return p.slice(lastDot + 1).toLowerCase();
}

function guessKind(filePath: string, mime: string, isBinary: boolean): FileViewKind {
  const ext = getFileExt(filePath);
  const m = String(mime || "").toLowerCase();

  if (m.startsWith("image/")) return "image";
  if (m.startsWith("audio/")) return "audio";
  if (m.startsWith("video/")) return "video";

  if (ext === "md" || ext === "markdown") return "markdown";
  if (ext === "json") return "json";

  if (m.startsWith("text/")) return "text";
  if (m.includes("json")) return "json";
  if (m.includes("xml") || m.includes("yaml") || m.includes("javascript") || m.includes("typescript")) return "text";

  return isBinary ? "binary" : "text";
}

type MdBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "blockquote"; lines: string[] }
  | { type: "code"; lang: string; text: string };

function parseMarkdownBlocks(markdown: string): MdBlock[] {
  const lines = String(markdown || "").replaceAll("\r\n", "\n").split("\n");
  const blocks: MdBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";

    const fenceMatch = line.match(/^\s*```(?:\s*(\S+))?\s*$/);
    if (fenceMatch) {
      const lang = (fenceMatch[1] || "").trim();
      i += 1;
      const codeLines: string[] = [];
      while (i < lines.length && !/^\s*```/.test(String(lines[i] ?? ""))) {
        codeLines.push(lines[i] ?? "");
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({ type: "code", lang, text: codeLines.join("\n") });
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({ type: "heading", level: headingMatch[1].length, text: headingMatch[2] || "" });
      i += 1;
      continue;
    }

    if (/^\s*$/.test(line)) {
      i += 1;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const qLines: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(String(lines[i] ?? ""))) {
        qLines.push(String(lines[i] ?? "").replace(/^\s*>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "blockquote", lines: qLines });
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(String(lines[i] ?? ""))) {
        items.push(String(lines[i] ?? "").replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(String(lines[i] ?? ""))) {
        items.push(String(lines[i] ?? "").replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const pLines: string[] = [];
    while (i < lines.length) {
      const l = String(lines[i] ?? "");
      if (/^\s*$/.test(l)) break;
      if (/^\s*```/.test(l)) break;
      if (/^(#{1,6})\s+/.test(l)) break;
      if (/^\s*>\s?/.test(l)) break;
      if (/^\s*[-*]\s+/.test(l)) break;
      if (/^\s*\d+\.\s+/.test(l)) break;
      pLines.push(l);
      i += 1;
    }
    blocks.push({ type: "paragraph", lines: pLines });
  }

  return blocks;
}

function renderInlineMarkdown(text: string) {
  const nodes: React.ReactNode[] = [];
  const s = String(text || "");
  let i = 0;

  const pushText = (v: string) => {
    if (!v) return;
    nodes.push(v);
  };

  while (i < s.length) {
    const rest = s.slice(i);

    if (rest.startsWith("`")) {
      const end = rest.indexOf("`", 1);
      if (end > 0) {
        const code = rest.slice(1, end);
        nodes.push(
          <code key={`c_${i}`} className="px-1 py-0.5 rounded bg-gray-100 text-[11px] font-mono text-gray-800">
            {code}
          </code>,
        );
        i += end + 1;
        continue;
      }
      pushText("`");
      i += 1;
      continue;
    }

    if (rest.startsWith("[")) {
      const closeBracket = rest.indexOf("]");
      const openParen = closeBracket > 0 ? rest.indexOf("(", closeBracket) : -1;
      const closeParen = openParen > 0 ? rest.indexOf(")", openParen) : -1;
      if (closeBracket > 0 && openParen === closeBracket + 1 && closeParen > openParen + 1) {
        const label = rest.slice(1, closeBracket);
        const url = rest.slice(openParen + 1, closeParen);
        nodes.push(
          <a key={`a_${i}`} href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-words">
            {label || url}
          </a>,
        );
        i += closeParen + 1;
        continue;
      }
      pushText("[");
      i += 1;
      continue;
    }

    const nextSpecial = (() => {
      const nextTick = rest.indexOf("`");
      const nextBracket = rest.indexOf("[");
      const candidates = [nextTick, nextBracket].filter(n => n >= 0);
      if (candidates.length === 0) return -1;
      return Math.min(...candidates);
    })();

    if (nextSpecial < 0) {
      pushText(rest);
      break;
    }
    if (nextSpecial === 0) {
      pushText(rest[0] || "");
      i += 1;
      continue;
    }
    pushText(rest.slice(0, nextSpecial));
    i += nextSpecial;
  }

  return nodes;
}

function MarkdownPreview({ content }: { content: string }) {
  const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);
  const [forceRender, setForceRender] = useState(false);

  const stats = useMemo(() => {
    const text = String(content || "");
    const lines = text.replaceAll("\r\n", "\n").split("\n").length;
    return { chars: text.length, lines };
  }, [content]);

  const isLarge = stats.chars > 120_000 || stats.lines > 4_000 || blocks.length > 600;

  if (isLarge && !forceRender) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Markdown 文件较大（{formatBytes(stats.chars)} · {stats.lines} 行），为避免卡顿已自动以纯文本显示。
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setForceRender(true)}
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
          >
            仍要渲染 Markdown
          </button>
        </div>
        <CodePreview content={content} language="md" />
      </div>
    );
  }

  return (
    <div className="text-sm leading-6 text-gray-900 space-y-3">
      {isLarge && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
          已启用 Markdown 渲染（大文件可能较慢）。{" "}
          <button type="button" onClick={() => setForceRender(false)} className="text-blue-600 hover:text-blue-700 hover:underline">
            切回纯文本
          </button>
        </div>
      )}
      {blocks.map((b, idx) => {
        if (b.type === "heading") {
          const Tag = (["h1", "h2", "h3", "h4", "h5", "h6"][Math.min(5, Math.max(0, b.level - 1))] ||
            "h3") as keyof JSX.IntrinsicElements;
          const size =
            b.level === 1 ? "text-xl" : b.level === 2 ? "text-lg" : b.level === 3 ? "text-base" : "text-sm";
          return (
            <Tag key={idx} className={`${size} font-semibold mt-2`}>
              {renderInlineMarkdown(b.text)}
            </Tag>
          );
        }
        if (b.type === "code") {
          return (
            <pre key={idx} className="text-[12px] leading-5 bg-gray-50 border border-gray-200 rounded-xl p-3 overflow-auto">
              <code className="font-mono whitespace-pre">{b.text}</code>
            </pre>
          );
        }
        if (b.type === "blockquote") {
          return (
            <blockquote key={idx} className="border-l-4 border-gray-200 pl-3 text-gray-700 bg-gray-50/50 rounded-r-md py-1">
              {b.lines.map((l, li) => (
                <div key={li} className="whitespace-pre-wrap">
                  {renderInlineMarkdown(l)}
                </div>
              ))}
            </blockquote>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1">
              {b.items.map((it, ii) => (
                <li key={ii} className="whitespace-pre-wrap">
                  {renderInlineMarkdown(it)}
                </li>
              ))}
            </ul>
          );
        }
        if (b.type === "ol") {
          return (
            <ol key={idx} className="list-decimal pl-5 space-y-1">
              {b.items.map((it, ii) => (
                <li key={ii} className="whitespace-pre-wrap">
                  {renderInlineMarkdown(it)}
                </li>
              ))}
            </ol>
          );
        }
        return (
          <div key={idx} className="whitespace-pre-wrap">
            {renderInlineMarkdown(b.lines.join("\n"))}
          </div>
        );
      })}
    </div>
  );
}

type CodeLanguage = "plain" | "json" | "ts" | "tsx" | "js" | "jsx" | "html" | "md";

type CodeTokenType = "plain" | "comment" | "string" | "keyword" | "number" | "boolean" | "null" | "tag" | "attr" | "punct";

type CodeToken = { type: CodeTokenType; text: string };

function getCodeLanguageFromPath(filePath: string): CodeLanguage {
  const ext = getFileExt(filePath);
  if (ext === "json") return "json";
  if (ext === "ts") return "ts";
  if (ext === "tsx") return "tsx";
  if (ext === "js") return "js";
  if (ext === "jsx") return "jsx";
  if (ext === "html" || ext === "htm") return "html";
  if (ext === "md" || ext === "markdown") return "md";
  return "plain";
}

function tokenClassName(type: CodeTokenType) {
  switch (type) {
    case "comment":
      return "text-gray-500 italic";
    case "string":
      return "text-emerald-700";
    case "keyword":
      return "text-blue-700 font-medium";
    case "tag":
      return "text-blue-700 font-semibold";
    case "attr":
      return "text-sky-800";
    case "punct":
      return "text-gray-500";
    case "number":
      return "text-fuchsia-700";
    case "boolean":
      return "text-rose-700 font-medium";
    case "null":
      return "text-rose-700 font-medium";
    default:
      return "text-gray-900";
  }
}

const TS_KEYWORDS = [
  "as",
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "finally",
  "for",
  "from",
  "function",
  "get",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "new",
  "of",
  "private",
  "protected",
  "public",
  "readonly",
  "return",
  "set",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "try",
  "type",
  "typeof",
  "var",
  "void",
  "while",
  "yield",
  "satisfies",
];

const TS_KEYWORDS_RE = new RegExp(`\\b(?:${TS_KEYWORDS.join("|")})\\b`, "g");
const TS_LITERAL_RE = /\b(?:true|false|null|undefined)\b/g;
const NUMBER_RE = /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g;

function classifyLiteral(word: string): CodeTokenType {
  if (word === "true" || word === "false") return "boolean";
  if (word === "null") return "null";
  if (word === "undefined") return "null";
  return "plain";
}

function highlightPlain(text: string, language: CodeLanguage): CodeToken[] {
  if (!text) return [];

  const tokens: CodeToken[] = [];
  const pushPlain = (s: string) => {
    if (!s) return;
    const last = tokens[tokens.length - 1];
    if (last && last.type === "plain") last.text += s;
    else tokens.push({ type: "plain", text: s });
  };

  const pushToken = (type: CodeTokenType, s: string) => {
    if (!s) return;
    tokens.push({ type, text: s });
  };

  const patterns: Array<{ re: RegExp; type: (match: string) => CodeTokenType }> = [];

  if (language === "json") {
    patterns.push({ re: TS_LITERAL_RE, type: classifyLiteral });
    patterns.push({ re: NUMBER_RE, type: () => "number" });
  } else if (language === "ts" || language === "tsx" || language === "js" || language === "jsx") {
    patterns.push({ re: TS_KEYWORDS_RE, type: () => "keyword" });
    patterns.push({ re: TS_LITERAL_RE, type: classifyLiteral });
    patterns.push({ re: NUMBER_RE, type: () => "number" });
  } else {
    return [{ type: "plain", text }];
  }

  const matches: Array<{ start: number; end: number; type: CodeTokenType; text: string }> = [];
  for (const p of patterns) {
    p.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = p.re.exec(text))) {
      const start = m.index;
      const end = start + m[0].length;
      matches.push({ start, end, type: p.type(m[0]), text: m[0] });
      if (m[0].length === 0) p.re.lastIndex += 1;
    }
  }

  matches.sort((a, b) => (a.start - b.start) || (b.end - a.end));

  let cursor = 0;
  for (const m of matches) {
    if (m.start < cursor) continue;
    pushPlain(text.slice(cursor, m.start));
    pushToken(m.type, m.text);
    cursor = m.end;
  }
  pushPlain(text.slice(cursor));

  return tokens;
}

function tokenizeLines(content: string, language: CodeLanguage) {
  const lines = String(content || "").replaceAll("\r\n", "\n").split("\n");
  const maxHighlightChars = 200_000;
  const maxHighlightLines = 6_000;
  const shouldHighlight = (language !== "plain" && content.length <= maxHighlightChars && lines.length <= maxHighlightLines);

  if (!shouldHighlight) {
    return { lines, tokensByLine: null as null | CodeToken[][] };
  }

  const tokensByLine: CodeToken[][] = [];

  if (language === "json") {
    for (const line of lines) {
      const tokens: CodeToken[] = [];
      let i = 0;
      while (i < line.length) {
        const ch = line[i] || "";
        if (ch === '"') {
          let j = i + 1;
          while (j < line.length) {
            const c = line[j] || "";
            if (c === "\\" && j + 1 < line.length) {
              j += 2;
              continue;
            }
            if (c === '"') {
              j += 1;
              break;
            }
            j += 1;
          }
          tokens.push({ type: "string", text: line.slice(i, j) });
          i = j;
          continue;
        }
        let j = i + 1;
        while (j < line.length && line[j] !== '"') j += 1;
        tokens.push(...highlightPlain(line.slice(i, j), language));
        i = j;
      }
      tokensByLine.push(tokens.length ? tokens : [{ type: "plain", text: "" }]);
    }
    return { lines, tokensByLine };
  }

  if (language === "ts" || language === "tsx" || language === "js" || language === "jsx") {
    let inBlockComment = false;
    for (const line of lines) {
      const tokens: CodeToken[] = [];
      let i = 0;

      while (i < line.length) {
        if (inBlockComment) {
          const end = line.indexOf("*/", i);
          if (end < 0) {
            tokens.push({ type: "comment", text: line.slice(i) });
            i = line.length;
            break;
          }
          tokens.push({ type: "comment", text: line.slice(i, end + 2) });
          i = end + 2;
          inBlockComment = false;
          continue;
        }

        const ch = line[i] || "";
        const next = line[i + 1] || "";

        if (ch === "/" && next === "/") {
          tokens.push({ type: "comment", text: line.slice(i) });
          i = line.length;
          break;
        }

        if (ch === "/" && next === "*") {
          const end = line.indexOf("*/", i + 2);
          if (end < 0) {
            tokens.push({ type: "comment", text: line.slice(i) });
            inBlockComment = true;
            i = line.length;
            break;
          }
          tokens.push({ type: "comment", text: line.slice(i, end + 2) });
          i = end + 2;
          continue;
        }

        if (ch === '"' || ch === "'" || ch === "`") {
          const quote = ch;
          let j = i + 1;
          while (j < line.length) {
            const c = line[j] || "";
            if (c === "\\" && j + 1 < line.length) {
              j += 2;
              continue;
            }
            if (c === quote) {
              j += 1;
              break;
            }
            j += 1;
          }
          tokens.push({ type: "string", text: line.slice(i, j) });
          i = j;
          continue;
        }

        let j = i + 1;
        while (j < line.length) {
          const c = line[j] || "";
          const n = line[j + 1] || "";
          if (c === '"' || c === "'" || c === "`") break;
          if (c === "/" && (n === "/" || n === "*")) break;
          j += 1;
        }
        tokens.push(...highlightPlain(line.slice(i, j), language));
        i = j;
      }

      tokensByLine.push(tokens.length ? tokens : [{ type: "plain", text: "" }]);
    }
    return { lines, tokensByLine };
  }

  if (language === "html") {
    let inHtmlComment = false;

    const isNameStart = (c: string) => /[A-Za-z_]/.test(c);
    const isNameChar = (c: string) => /[A-Za-z0-9:_-]/.test(c);

    for (const line of lines) {
      const tokens: CodeToken[] = [];
      let i = 0;

      const push = (type: CodeTokenType, text: string) => {
        if (!text) return;
        tokens.push({ type, text });
      };

      while (i < line.length) {
        if (inHtmlComment) {
          const end = line.indexOf("-->", i);
          if (end < 0) {
            push("comment", line.slice(i));
            i = line.length;
            break;
          }
          push("comment", line.slice(i, end + 3));
          i = end + 3;
          inHtmlComment = false;
          continue;
        }

        const commentStart = line.indexOf("<!--", i);
        const tagStart = line.indexOf("<", i);

        const next = (() => {
          if (commentStart < 0) return tagStart;
          if (tagStart < 0) return commentStart;
          return Math.min(commentStart, tagStart);
        })();

        if (next < 0) {
          push("plain", line.slice(i));
          break;
        }

        if (next > i) {
          push("plain", line.slice(i, next));
          i = next;
        }

        if (line.startsWith("<!--", i)) {
          const end = line.indexOf("-->", i + 4);
          if (end < 0) {
            push("comment", line.slice(i));
            inHtmlComment = true;
            i = line.length;
            break;
          }
          push("comment", line.slice(i, end + 3));
          i = end + 3;
          continue;
        }

        if (line[i] !== "<") {
          push("plain", line[i] || "");
          i += 1;
          continue;
        }

        push("punct", "<");
        i += 1;

        if (line[i] === "/") {
          push("punct", "/");
          i += 1;
        }

        let tagName = "";
        while (i < line.length && isNameChar(line[i] || "")) {
          tagName += line[i] || "";
          i += 1;
        }
        if (tagName) push("tag", tagName);

        while (i < line.length) {
          const ch = line[i] || "";
          if (ch === ">") {
            push("punct", ">");
            i += 1;
            break;
          }
          if (ch === "/" && (line[i + 1] || "") === ">") {
            push("punct", "/>");
            i += 2;
            break;
          }
          if (/\s/.test(ch)) {
            let j = i + 1;
            while (j < line.length && /\s/.test(line[j] || "")) j += 1;
            push("plain", line.slice(i, j));
            i = j;
            continue;
          }
          if (!isNameStart(ch)) {
            push("punct", ch);
            i += 1;
            continue;
          }

          let attrName = "";
          while (i < line.length && isNameChar(line[i] || "")) {
            attrName += line[i] || "";
            i += 1;
          }
          if (attrName) push("attr", attrName);

          while (i < line.length && /\s/.test(line[i] || "")) {
            push("plain", line[i] || "");
            i += 1;
          }

          if ((line[i] || "") === "=") {
            push("punct", "=");
            i += 1;
            while (i < line.length && /\s/.test(line[i] || "")) {
              push("plain", line[i] || "");
              i += 1;
            }
            const q = line[i] || "";
            if (q === '"' || q === "'") {
              let j = i + 1;
              while (j < line.length) {
                const c = line[j] || "";
                if (c === "\\" && j + 1 < line.length) {
                  j += 2;
                  continue;
                }
                if (c === q) {
                  j += 1;
                  break;
                }
                j += 1;
              }
              push("string", line.slice(i, j));
              i = j;
            } else {
              let j = i;
              while (j < line.length) {
                const c = line[j] || "";
                if (/\s/.test(c) || c === ">" || (c === "/" && (line[j + 1] || "") === ">")) break;
                j += 1;
              }
              push("string", line.slice(i, j));
              i = j;
            }
          }
        }
      }

      tokensByLine.push(tokens.length ? tokens : [{ type: "plain", text: "" }]);
    }

    return { lines, tokensByLine };
  }

  return { lines, tokensByLine: null as null | CodeToken[][] };
}

function CodePreview({ content, language = "plain" }: { content: string; language?: CodeLanguage }) {
  const [wrap, setWrap] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [content]);

  const highlighted = useMemo(() => tokenizeLines(content, language), [content, language]);
  const effectiveLines = highlighted.lines;
  const tokensByLine = highlighted.tokensByLine;
  const lineDigits = useMemo(() => String(Math.max(1, effectiveLines.length)).length, [effectiveLines.length]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {}
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs text-gray-600">
        <button type="button" onClick={() => setWrap(v => !v)} className="hover:text-gray-900 hover:underline">
          {wrap ? "不换行" : "自动换行"}
        </button>
        <button type="button" onClick={() => void copy()} className="hover:text-gray-900 hover:underline">
          {copied ? "已复制" : "复制"}
        </button>
        {tokensByLine ? <span className="text-[11px] text-gray-400">语法高亮</span> : null}
      </div>
      <div className="font-mono text-xs leading-5 text-gray-900">
        {effectiveLines.map((line, idx) => (
        <div key={idx} className="flex">
          <div className="shrink-0 select-none text-right text-gray-400 pr-4" style={{ width: `${lineDigits + 2}ch` }}>
            {idx + 1}
          </div>
          <div className={`${wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"} min-w-0 flex-1`}>
            {tokensByLine ? (
              tokensByLine[idx]?.map((t, ti) => (
                <span key={ti} className={tokenClassName(t.type)}>
                  {t.text}
                </span>
              ))
            ) : (
              <span>{line.length ? line : "\u00A0"}</span>
            )}
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}

export default function CodeArea({ isSidebarCollapsed: _isSidebarCollapsed, toggleSidebar, projectId, userId, userToken }: CodeAreaProps) {
  const { t } = useI18n();
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  const [tree, setTree] = useState<FileTreeNode | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);

  const [loadedFile, setLoadedFile] = useState<LoadedFile | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const workspaceMgrBaseUrl = "http://localhost:7070";
  const workspaceRoot = "game";

  const canLoadWorkspace = Boolean(projectId && userId);

  const loadTree = useCallback(async () => {
    if (!projectId || !userId) return;
    setTreeLoading(true);
    setTreeError(null);
    try {
      await fetch(`${workspaceMgrBaseUrl}/api/projects/create`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: String(userId), projectId, token: userToken || "" }),
      }).catch(() => null);

      const response = await fetch(
        `${workspaceMgrBaseUrl}/api/projects/tree?userId=${encodeURIComponent(String(userId))}&projectId=${encodeURIComponent(projectId)}&root=${encodeURIComponent(workspaceRoot)}&maxDepth=8`,
      );
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.ok !== true) {
        throw new Error(typeof data?.error === "string" ? data.error : `HTTP ${response.status}`);
      }
      setTree((data?.tree || null) as FileTreeNode | null);
    } catch (e) {
      setTree(null);
      setTreeError(e instanceof Error ? e.message : String(e));
    } finally {
      setTreeLoading(false);
    }
  }, [projectId, userId, userToken, workspaceMgrBaseUrl, workspaceRoot]);

  const loadFile = useCallback(
    async (relativePath: string) => {
      if (!projectId || !userId) return;
      setFileLoading(true);
      setFileError(null);
      try {
        const response = await fetch(
          `${workspaceMgrBaseUrl}/api/projects/file?userId=${encodeURIComponent(String(userId))}&projectId=${encodeURIComponent(projectId)}&root=${encodeURIComponent(workspaceRoot)}&path=${encodeURIComponent(relativePath)}&maxBytes=${encodeURIComponent(String(2 * 1024 * 1024))}`,
        );
        const data = await response.json().catch(() => null);
        if (!response.ok || data?.ok !== true) {
          throw new Error(typeof data?.error === "string" ? data.error : `HTTP ${response.status}`);
        }
        const mime = typeof data?.mime === "string" ? data.mime : "application/octet-stream";
        const sizeBytes = typeof data?.sizeBytes === "number" ? data.sizeBytes : 0;
        const isBinary = !!data?.isBinary;
        const kind = guessKind(relativePath, mime, isBinary);
        const maxBytesForRaw = Math.max(20 * 1024 * 1024, Math.min(sizeBytes || 0, 200 * 1024 * 1024));
        const rawUrl = `${workspaceMgrBaseUrl}/api/projects/file/raw?userId=${encodeURIComponent(String(userId))}&projectId=${encodeURIComponent(projectId)}&root=${encodeURIComponent(workspaceRoot)}&path=${encodeURIComponent(relativePath)}&maxBytes=${encodeURIComponent(String(maxBytesForRaw))}`;
        const content = typeof data?.content === "string" ? data.content : "";
        setLoadedFile({
          path: relativePath,
          mime,
          sizeBytes,
          kind,
          content: kind === "image" || kind === "audio" || kind === "video" || kind === "binary" ? null : content,
          rawUrl,
        });
      } catch (e) {
        setLoadedFile(null);
        setFileError(e instanceof Error ? e.message : String(e));
      } finally {
        setFileLoading(false);
      }
    },
    [projectId, userId, workspaceMgrBaseUrl, workspaceRoot],
  );

  useEffect(() => {
    if (!canLoadWorkspace) {
      setTree(null);
      setTreeError(null);
      setTreeLoading(false);
      setSelectedFilePath(null);
      setLoadedFile(null);
      setFileError(null);
      setFileLoading(false);
      return;
    }
    void loadTree();
  }, [canLoadWorkspace, loadTree]);

  const handleFileSelect = useCallback(
    (filePath: string) => {
      setSelectedFilePath(filePath);
      void loadFile(filePath);
    },
    [loadFile],
  );

  const rightHeader = useMemo(() => {
    if (!selectedFilePath) return null;
    const fileLabel = loadedFile?.path === selectedFilePath ? loadedFile : null;
    return (
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white">
        <div className="min-w-0">
          <div className="text-xs font-medium text-gray-700 truncate">{selectedFilePath}</div>
          {fileLabel && (
            <div className="text-[10px] text-gray-400 mt-0.5 truncate">
              {fileLabel.mime} · {formatBytes(fileLabel.sizeBytes)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {fileLabel?.rawUrl ? (
            <a
              href={fileLabel.rawUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-gray-600 hover:text-gray-800 hover:underline"
            >
              下载
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => selectedFilePath && void loadFile(selectedFilePath)}
            disabled={fileLoading}
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-60"
          >
            {t("chat.history_refresh")}
          </button>
        </div>
      </div>
    );
  }, [fileLoading, loadFile, loadedFile, selectedFilePath, t]);

  const prettyJson = useMemo(() => {
    if (!loadedFile || loadedFile.kind !== "json") return null;
    const raw = loadedFile.content ?? "";
    try {
      const obj = JSON.parse(raw);
      return JSON.stringify(obj, null, 2);
    } catch {
      return raw;
    }
  }, [loadedFile]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 左侧：ProjectPanel 文件结构 */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 overflow-hidden">
        <ProjectPanel 
          isCollapsed={false}
          toggleSidebar={toggleSidebar}
          tree={tree}
          isLoading={treeLoading}
          error={treeError}
          selectedFilePath={selectedFilePath}
          onRefresh={loadTree}
          onFileSelect={handleFileSelect}
        />
      </div>

      {/* 右侧：文件内容显示区域 */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        {selectedFilePath ? (
          <>
            {rightHeader}
            <div className="flex-1 overflow-auto p-4">
              {fileError ? (
                <div className="text-xs p-2 rounded-lg bg-red-50 text-red-700 border border-red-100">{fileError}</div>
              ) : fileLoading ? (
                <div className="text-sm text-gray-500">{t("workspace.loading")}</div>
              ) : loadedFile && loadedFile.path === selectedFilePath ? (
                loadedFile.kind === "image" ? (
                  <div className="w-full">
                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <img src={loadedFile.rawUrl} alt={loadedFile.path} className="w-full h-auto object-contain max-h-[70vh]" loading="lazy" />
                    </div>
                  </div>
                ) : loadedFile.kind === "audio" ? (
                  <div className="space-y-3">
                    <audio controls preload="metadata" className="w-full">
                      <source src={loadedFile.rawUrl} />
                    </audio>
                    <div className="text-xs text-gray-500">{loadedFile.path}</div>
                  </div>
                ) : loadedFile.kind === "video" ? (
                  <div className="space-y-3">
                    <video controls preload="metadata" className="w-full max-h-[70vh] rounded-xl border border-gray-200 bg-black">
                      <source src={loadedFile.rawUrl} />
                    </video>
                    <div className="text-xs text-gray-500">{loadedFile.path}</div>
                  </div>
                ) : loadedFile.kind === "markdown" ? (
                  <MarkdownPreview content={loadedFile.content ?? ""} />
                ) : loadedFile.kind === "json" ? (
                  <div className="overflow-auto">
                    <CodePreview content={prettyJson ?? ""} language="json" />
                  </div>
                ) : loadedFile.kind === "text" ? (
                  <div className="overflow-auto">
                    <CodePreview content={loadedFile.content ?? ""} language={getCodeLanguageFromPath(loadedFile.path)} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-700">该文件为二进制格式，当前以下载/新窗口打开为主。</div>
                    <a
                      href={loadedFile.rawUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      打开/下载 {loadedFile.path}
                    </a>
                  </div>
                )
              ) : (
                <div className="text-sm text-gray-500">{t("workspace.loading")}</div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-sm">{t("code.no_file_selected")}</p>
              <p className="text-xs mt-2">{t("code.select_file_hint")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
