import React, { useRef, useMemo, useEffect } from 'react';
import { SupportedLanguage } from '../../types';
import { highlightCode } from '../../utils/highlighter';

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onBlur: () => void;
  selectedLang: SupportedLanguage;
  editorFontSize: number;
}

export const CodeEditor = React.memo(({
  code,
  onCodeChange,
  onKeyDown,
  onBlur,
  selectedLang,
  editorFontSize
}: CodeEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const handleScroll = () => {
    if (textareaRef.current) {
      if (gutterRef.current) gutterRef.current.scrollTop = textareaRef.current.scrollTop;
      if (highlightRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
        highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    }
  };

  useEffect(() => {
    handleScroll();
  }, [code, selectedLang]);

  const lineNumbers = useMemo(() => {
    const lines = code.split('\n');
    return Array.from({ length: Math.max(lines.length, 1) }, (_, i) => i + 1);
  }, [code]);

  const lineHeight = Math.round(editorFontSize * 1.55);
  const paddingTop = Math.round(editorFontSize * 0.75);

  return (
    <div className="editor-textarea-container flex-1 min-h-0 relative flex bg-[var(--bg-editor)]">
      {/* Line Numbers Gutter */}
      <div 
        className="editor-gutter shrink-0 text-right select-none opacity-40 font-mono border-r border-[var(--border-element)] bg-[var(--bg-editor)]" 
        ref={gutterRef}
        style={{
          fontSize: `${Math.max(10, editorFontSize - 2)}px`,
          paddingTop: `${paddingTop}px`,
          paddingBottom: `${paddingTop}px`,
          width: '45px',
          overflow: 'hidden'
        }}
      >
        {lineNumbers.map((num) => (
          <div 
            key={num} 
            className="editor-gutter-line px-2"
            style={{
              height: `${lineHeight}px`,
              lineHeight: `${lineHeight}px`,
            }}
          >
            {num}
          </div>
        ))}
      </div>

      {/* Editor Content Area */}
      <div className="editor-input-area flex-1 relative min-h-0 overflow-hidden">
        <pre 
          ref={highlightRef} 
          className="editor-highlight absolute inset-0 m-0 pointer-events-none whitespace-pre font-mono z-0" 
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlightCode(code, selectedLang) }}
          style={{
            fontSize: `${editorFontSize}px`,
            lineHeight: `${lineHeight}px`,
            paddingTop: `${paddingTop}px`,
            paddingBottom: `${paddingTop}px`,
            paddingLeft: '1rem',
            overflow: 'hidden'
          }}
        />
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onKeyDown={onKeyDown}
          onScroll={handleScroll}
          onBlur={onBlur}
          className="editor-textarea absolute inset-0 w-full h-full bg-transparent border-none outline-none resize-none font-mono caret-[var(--accent-primary)] z-10 text-transparent selection:bg-indigo-500/30"
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          style={{
            fontSize: `${editorFontSize}px`,
            lineHeight: `${lineHeight}px`,
            paddingTop: `${paddingTop}px`,
            paddingBottom: `${paddingTop}px`,
            paddingLeft: '1rem',
            whiteSpace: 'pre',
            overflow: 'auto'
          }}
        />
      </div>
    </div>
  );
});
