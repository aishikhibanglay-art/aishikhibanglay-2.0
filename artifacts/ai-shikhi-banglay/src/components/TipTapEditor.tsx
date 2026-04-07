import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, List, ListOrdered, Quote, Heading2, Undo, Redo, Code
} from "lucide-react";

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function TipTapEditor({
  content,
  onChange,
  placeholder = "আপনার চিন্তা শেয়ার করুন...",
  minHeight = "120px",
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose-editor focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${
        active
          ? "bg-violet-500/20 text-violet-400"
          : "text-gray-500 hover:text-gray-300 hover:bg-gray-700/50"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden focus-within:border-violet-500 transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-700 flex-wrap">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="শিরোনাম"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold (굵게)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic (তির্যক)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="Code"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-700 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="বুলেট লিস্ট"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="ক্রমিক লিস্ট"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="উদ্ধৃতি"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-700 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          active={false}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          active={false}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div style={{ minHeight }} className="px-4 py-3 text-sm text-gray-200">
        <style>{`
          .prose-editor p { margin: 0.25rem 0; }
          .prose-editor h2 { font-size: 1.1rem; font-weight: 700; color: white; margin: 0.5rem 0 0.25rem; }
          .prose-editor strong { font-weight: 700; color: white; }
          .prose-editor em { font-style: italic; }
          .prose-editor code { background: rgba(139,92,246,0.15); color: #a78bfa; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; }
          .prose-editor ul { list-style: disc; padding-left: 1.25rem; margin: 0.25rem 0; }
          .prose-editor ol { list-style: decimal; padding-left: 1.25rem; margin: 0.25rem 0; }
          .prose-editor blockquote { border-left: 3px solid #7c3aed; padding-left: 0.75rem; color: #9ca3af; margin: 0.25rem 0; }
          .prose-editor p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #4b5563;
            pointer-events: none;
            height: 0;
          }
        `}</style>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
