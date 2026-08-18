"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <EditorLoader />,
});

interface CodeEditorProps {
  path: string;
  value: string;
  onChange: (value: string) => void;
  language: string;
  readOnly?: boolean;
}

function editorOptions(readOnly: boolean) {
  return {
    minimap: { enabled: false },
    fontSize: 13,
    fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Consolas, monospace",
    tabSize: 2,
    wordWrap: "on" as const,
    lineHeight: 20,
    renderLineHighlight: "all" as const,
    smoothScrolling: true,
    cursorBlinking: "smooth" as const,
    scrollBeyondLastLine: false,
    padding: { top: 12, bottom: 12 },
    automaticLayout: true,
    bracketPairColorization: { enabled: true },
    guides: { bracketPairs: true },
    readOnly,
    domReadOnly: readOnly,
  };
}

export function CodeEditor({ path, value, onChange, language, readOnly = false }: CodeEditorProps) {
  const [failed, setFailed] = useState(false);
  const monacoMounted = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (!monacoMounted.current) setFailed(true);
    }, 9000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [path]);

  if (failed) {
    return <FallbackEditor value={value} onChange={onChange} path={path} readOnly={readOnly} />;
  }

  return (
    <MonacoEditor
      key={path}
      height="100%"
      language={language}
      value={value}
      theme="vs-dark"
      onChange={(v) => onChange(v ?? "")}
      onMount={() => {
        monacoMounted.current = true;
      }}
      options={editorOptions(readOnly)}
      loading={<EditorLoader />}
    />
  );
}

function EditorLoader() {
  return (
    <div className="flex h-full items-center justify-center gap-2 bg-editor text-xs text-faint">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading editor…
    </div>
  );
}

function FallbackEditor({
  value,
  onChange,
  path,
  readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  path: string;
  readOnly?: boolean;
}) {
  const lines = value.split("\n");

  return (
    <div className="flex h-full bg-editor">
      <div
        className="select-none overflow-hidden border-r border-line bg-editor py-2 text-right font-mono text-[12px] leading-5 text-faint"
        style={{ minWidth: 44 }}
        aria-hidden
      >
        {lines.map((_, i) => (
          <div key={i} className="px-2">
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        spellCheck={false}
        className="h-full w-full resize-none bg-editor py-2 pr-4 font-mono text-[12.5px] leading-5 text-text outline-none"
        placeholder={`// ${path}`}
      />
    </div>
  );
}
