import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Undo2,
  Redo2,
  RemoveFormatting,
  Minus,
  Table2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const extensions = [
  StarterKit,
  Underline,
  LinkExtension.configure({ openOnClick: false, protocols: ["http", "https"] }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Image.configure({ allowBase64: false }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
];

export function RichTextEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>;
  onChange: (json: Record<string, unknown>, html: string) => void;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const editor = useEditor({
    extensions,
    content,
    immediatelyRender: false,
    editorProps: { attributes: { class: "prose-copy min-h-96 max-w-none p-5 focus:outline-none" } },
    onUpdate: ({ editor: current }) => onChange(current.getJSON(), current.getHTML()),
  });
  useEffect(() => {
    if (editor && !editor.isFocused) editor.commands.setContent(content);
  }, [content, editor]);
  if (!editor) return <div className="min-h-96 border border-border bg-background" />;
  const openLink = () => {
    setLinkUrl(String(editor.getAttributes("link")["href"] ?? ""));
    setLinkOpen(true);
  };
  const applyLink = () => {
    const url = linkUrl.trim();
    if (!url) editor.chain().focus().unsetLink().run();
    else if (/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(url))
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    setLinkOpen(false);
  };
  const tools = [
    ["Bold", Bold, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold")],
    [
      "Italic",
      Italic,
      () => editor.chain().focus().toggleItalic().run(),
      editor.isActive("italic"),
    ],
    [
      "Underline",
      UnderlineIcon,
      () => editor.chain().focus().toggleUnderline().run(),
      editor.isActive("underline"),
    ],
    [
      "Strikethrough",
      Strikethrough,
      () => editor.chain().focus().toggleStrike().run(),
      editor.isActive("strike"),
    ],
    [
      "Bulleted list",
      List,
      () => editor.chain().focus().toggleBulletList().run(),
      editor.isActive("bulletList"),
    ],
    [
      "Numbered list",
      ListOrdered,
      () => editor.chain().focus().toggleOrderedList().run(),
      editor.isActive("orderedList"),
    ],
    [
      "Quote",
      Quote,
      () => editor.chain().focus().toggleBlockquote().run(),
      editor.isActive("blockquote"),
    ],
    ["Link", LinkIcon, openLink, editor.isActive("link")],
    [
      "Align left",
      AlignLeft,
      () => editor.chain().focus().setTextAlign("left").run(),
      editor.isActive({ textAlign: "left" }),
    ],
    [
      "Align centre",
      AlignCenter,
      () => editor.chain().focus().setTextAlign("center").run(),
      editor.isActive({ textAlign: "center" }),
    ],
    [
      "Align right",
      AlignRight,
      () => editor.chain().focus().setTextAlign("right").run(),
      editor.isActive({ textAlign: "right" }),
    ],
  ] as const;
  return (
    <div className="border border-border bg-background">
      <div
        className="flex flex-wrap gap-1 border-b border-border bg-secondary p-2"
        role="toolbar"
        aria-label="Article formatting"
      >
        <select
          aria-label="Text style"
          className="h-9 border border-input bg-background px-2 text-sm"
          value={
            editor.isActive("heading", { level: 1 })
              ? "h1"
              : editor.isActive("heading", { level: 2 })
                ? "h2"
                : editor.isActive("heading", { level: 3 })
                  ? "h3"
                  : "p"
          }
          onChange={(event) => {
            const value = event.target.value;
            if (value === "p") editor.chain().focus().setParagraph().run();
            else
              editor
                .chain()
                .focus()
                .toggleHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 })
                .run();
          }}
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        {tools.map(([label, Icon, action, active]) => (
          <Button
            key={label}
            type="button"
            size="icon"
            variant="ghost"
            aria-label={label}
            title={label}
            className={cn("size-9 min-h-9", active && "bg-accent")}
            onClick={action}
          >
            <Icon />
          </Button>
        ))}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Insert table"
          title="Insert table"
          className="size-9 min-h-9"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <Table2 />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Horizontal divider"
          title="Horizontal divider"
          className="size-9 min-h-9"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Undo"
          title="Undo"
          className="size-9 min-h-9"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Redo"
          title="Redo"
          className="size-9 min-h-9"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Clear formatting"
          title="Clear formatting"
          className="size-9 min-h-9"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <RemoveFormatting />
        </Button>
      </div>
      {linkOpen ? (
        <div className="grid gap-2 border-b border-border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="sr-only" htmlFor="article-link-url">
            Link address
          </label>
          <input
            id="article-link-url"
            autoFocus
            className="h-10 border border-input px-3"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="/internal-page or https://example.com"
            onKeyDown={(event) => {
              if (event.key === "Escape") setLinkOpen(false);
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
            }}
          />
          <Button type="button" onClick={applyLink}>
            Apply link
          </Button>
          <Button type="button" variant="outline" onClick={() => setLinkOpen(false)}>
            Cancel
          </Button>
        </div>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}
