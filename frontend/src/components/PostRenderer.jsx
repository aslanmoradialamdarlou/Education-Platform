import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import './PostRenderer.css';

// A small error boundary so malformed math or unexpected rendering issues
// don't crash the admin preview or post display
class MarkdownErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) {
      return <div className="markdown-body markdown-fallback">خطا در نمایش متن. لطفاً بررسی کنید.</div>;
    }
    return this.props.children;
  }
}

// Heuristic normalization inside $...$ or $$...$$ blocks to fix common cases
// where backslashes were stripped (e.g., "frac" -> "\\frac") or AsciiMath
// patterns were used (e.g., frac(a)(b) -> \\frac{a}{b}). This runs only on
// math spans and leaves the rest of the markdown untouched.
function normalizeMathInMarkdown(md) {
  if (!md || typeof md !== 'string') return md || '';
  const re = /(\$\$?)([\s\S]*?)(\1)/g; // match $...$ and $$...$$ blocks
  const commands = [
    'frac','sqrt','sum','int','prod','lim','log','ln','sin','cos','tan','pi','theta','alpha','beta','gamma','Delta','Omega','cdot','ldots','times','overline'
  ];
  // When using new RegExp with a string, backslashes must be double-escaped.
  // We want the regex: /(^|[^\\])\b(cmd)\b/g
  const cmdPattern = new RegExp(`(^|[^\\\\])\\b(${commands.join('|')})\\b`, 'g');

  return md.replace(re, (full, opener, inner, closer) => {
    let s = inner;
    // Convert common AsciiMath to LaTeX inside math blocks
    // frac(a)(b) -> \frac{a}{b}
    s = s.replace(/\bfrac\s*\(\s*([^()]+?)\s*\)\s*\(\s*([^()]+?)\s*\)/g, (_m, a, b) => `\\frac{${a}}{${b}}`);
    // sqrt(x) -> \sqrt{x}
    s = s.replace(/\bsqrt\s*\(\s*([^()]+?)\s*\)/g, (_m, x) => `\\sqrt{${x}}`);
    // Ensure backslashes before known commands when missing
    s = s.replace(cmdPattern, (_m, p1, cmd) => `${p1}\\${cmd}`);
    return `${opener}${s}${closer}`;
  });
}

const PostRenderer = ({ markdown = '', className = '', components = {} }) => {
  const DirAuto = (Tag) => ({ node, ...props }) => <Tag dir="auto" {...props} />;
  const mergedComponents = {
    // Text blocks auto-detect direction per element
    p: DirAuto('p'),
    li: DirAuto('li'),
    blockquote: DirAuto('blockquote'),
    h1: DirAuto('h1'),
    h2: DirAuto('h2'),
    h3: DirAuto('h3'),
    h4: DirAuto('h4'),
    h5: DirAuto('h5'),
    h6: DirAuto('h6'),
    td: DirAuto('td'),
    th: DirAuto('th'),
    // Code is typically LTR
    code: ({ inline, node, className, children, ...props }) => {
      if (inline) {
        return <code dir="ltr" style={{ unicodeBidi: 'isolate' }} className={className} {...props}>{children}</code>;
      }
      return (
        <pre dir="ltr" style={{ unicodeBidi: 'isolate' }} className={className}>
          <code>{children}</code>
        </pre>
      );
    },
    img: ({ node, ...props }) => {
      const src = props.src || '';
      if (!src) return null;
      return <img {...props} alt={props.alt || ''} style={{ maxWidth: '100%', height: 'auto' }} />;
    },
    ...components,
  };

  return (
    <div className={`markdown-body ${className || ''}`.trim()}>
      <MarkdownErrorBoundary>
        <ReactMarkdown
          // GitHub-flavored MD + Math
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
          // Keep it safe and predictable
          components={mergedComponents}
        >
          {normalizeMathInMarkdown(markdown || '')}
        </ReactMarkdown>
      </MarkdownErrorBoundary>
    </div>
  );
};

export default PostRenderer;
