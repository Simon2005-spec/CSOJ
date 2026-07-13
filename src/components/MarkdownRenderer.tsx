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

  // 1. Extract block math: $$ ... $$
  let processed = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
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

  // 3. Parse Markdown with marked (it supports raw HTML by default!)
  let html = '';
  try {
    html = marked.parse(processed, { async: false }) as string;
  } catch (e) {
    html = processed;
  }

  // 4. Restore block math
  mathBlocks.forEach((math, index) => {
    try {
      const rendered = katex.renderToString(math, { displayMode: true, throwOnError: false });
      html = html.replaceAll(`MATHBLOCKPLACEHOLDERXYZ${index}`, rendered);
    } catch (e) {
      html = html.replaceAll(`MATHBLOCKPLACEHOLDERXYZ${index}`, `<span class="katex-error">${math}</span>`);
    }
  });

  // 5. Restore inline math
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
