import React, { useMemo } from 'react';
import { marked } from 'marked';
import katex from 'katex';

interface MarkdownRendererProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string;
}

export function renderMarkdownToHtml(text: string): string {
  if (!text) return '';

  const mathBlocks: string[] = [];
  const mathInlines: string[] = [];
  const codeBlocks: string[] = [];
  const inlineCodes: string[] = [];

  let processed = text;

  // 1. Extract block math: $$ ... $$
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    const placeholder = `MATHBLOCKPLACEHOLDERXYZ${mathBlocks.length}`;
    mathBlocks.push(math.trim());
    return placeholder;
  });

  // 2. Extract inline math: $ ... $
  processed = processed.replace(/\$([\s\S]+?)\$/g, (_, math) => {
    const placeholder = `MATHINLINEPLACEHOLDERXYZ${mathInlines.length}`;
    mathInlines.push(math.trim());
    return placeholder;
  });

  // 3. Extract fenced code blocks: ``` ... ```
  processed = processed.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = `CODEBLOCKPLACEHOLDERXYZ${codeBlocks.length}`;
    codeBlocks.push(match);
    return placeholder;
  });

  // 4. Extract inline code: `...`
  processed = processed.replace(/`[^`\n]+`/g, (match) => {
    const placeholder = `INLINECODEPLACEHOLDERXYZ${inlineCodes.length}`;
    inlineCodes.push(match);
    return placeholder;
  });

  // 5. Replace mathematical shorthand symbols on the remaining plain markdown text
  // Order is important so that longer symbols don't get partially replaced by shorter ones!
  processed = processed
    .replaceAll('<=>', '⇔')
    .replaceAll('<->', '↔')
    .replaceAll('=>', '⇒')
    .replaceAll('->', '→')
    .replaceAll('<=', '≤')
    .replaceAll('>=', '≥')
    .replaceAll('<-', '←');

  // 6. Restore inline code
  inlineCodes.forEach((code, index) => {
    processed = processed.replaceAll(`INLINECODEPLACEHOLDERXYZ${index}`, code);
  });

  // 7. Restore fenced code blocks
  codeBlocks.forEach((code, index) => {
    processed = processed.replaceAll(`CODEBLOCKPLACEHOLDERXYZ${index}`, code);
  });

  // 8. Parse Markdown with marked
  let html = '';
  try {
    html = marked.parse(processed, { async: false }) as string;
  } catch (e) {
    html = processed;
  }

  // 9. Restore block math
  mathBlocks.forEach((math, index) => {
    try {
      const rendered = katex.renderToString(math, { displayMode: true, throwOnError: false });
      html = html.replaceAll(`MATHBLOCKPLACEHOLDERXYZ${index}`, rendered);
    } catch (e) {
      html = html.replaceAll(`MATHBLOCKPLACEHOLDERXYZ${index}`, `<span class="katex-error">${math}</span>`);
    }
  });

  // 10. Restore inline math
  mathInlines.forEach((math, index) => {
    try {
      const rendered = katex.renderToString(math, { displayMode: false, throwOnError: false });
      html = html.replaceAll(`MATHINLINEPLACEHOLDERXYZ${index}`, rendered);
    } catch (e) {
      html = html.replaceAll(`MATHINLINEPLACEHOLDERXYZ${index}`, `<span class="katex-error">${math}</span>`);
    }
  });

  return html;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '', ...props }) => {
  const htmlContent = useMemo(() => renderMarkdownToHtml(content), [content]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      {...props}
    />
  );
};
