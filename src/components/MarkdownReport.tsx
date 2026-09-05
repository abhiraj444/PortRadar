import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownReportProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownReport: React.FC<MarkdownReportProps> = ({ content, isStreaming = false }) => {
  // Parse markdown into HTML safely using marked with GitHub Flavored Markdown (tables, autolinks, tasklists)
  const htmlContent = useMemo(() => {
    if (!content) return '';

    // Separate out any accidental <thinking> tags if not already stripped
    let cleaned = content;
    const thinkingMatch = cleaned.match(/<thinking>([\s\S]*?)<\/thinking>/);
    if (thinkingMatch) {
      cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
    } else if (cleaned.startsWith('<thinking>')) {
      // Still currently thinking
      cleaned = '';
    }

    try {
      marked.setOptions({
        gfm: true,
        breaks: true
      });
      return marked.parse(cleaned) as string;
    } catch (e) {
      return `<pre class="text-slate-300 text-xs">${content}</pre>`;
    }
  }, [content]);

  return (
    <div className="markdown-report-container relative text-slate-200 text-xs sm:text-sm leading-relaxed">
      {/* Rendered HTML */}
      <div 
        className="prose prose-invert max-w-none space-y-4"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Streaming pulse cursor */}
      {isStreaming && (
        <span className="inline-block w-2.5 h-4 ml-1 bg-cyan-400 animate-pulse align-middle shadow-lg shadow-cyan-400/50" />
      )}
    </div>
  );
};
