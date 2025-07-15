// /components/ui/RichTextEditor.tsx - Ny editor med Tiptap
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import React from 'react';
import './tiptap.css';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      BulletList,
      OrderedList,
      ListItem,
      Heading.configure({ levels: [1, 2, 3] }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose p-2 min-h-[200px] border border-gray-300 rounded bg-white text-black',
        placeholder: placeholder || "",
      },
    },
  });

  if (!editor) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className="btn">B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className="btn">I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className="btn">U</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="btn">H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="btn">H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className="btn">H3</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className="btn">• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className="btn">1. List</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
