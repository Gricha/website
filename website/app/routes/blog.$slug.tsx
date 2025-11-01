import type { Route } from "./+types/blog.$slug";
import { getPostBySlug } from "../utils/posts.server";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';
import 'highlight.js/styles/github-dark.css';

export async function loader({ params }: Route.LoaderArgs) {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }
  return { post };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data) {
    return [
      { title: "Post Not Found" },
      { name: "description", content: "Blog post not found" },
    ];
  }
  return [
    { title: `${data.post.title} - My Portfolio` },
    { name: "description", content: data.post.excerpt || "Blog post" },
  ];
}

export default function BlogPost({ loaderData }: Route.ComponentProps) {
  const { post } = loaderData;

  const components: Components = {
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold mt-12 mb-6 text-gray-900 dark:text-white tracking-tight">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-semibold mt-10 mb-5 text-gray-900 dark:text-white tracking-tight">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-base leading-7 mb-6 text-gray-700 dark:text-gray-300">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-outside ml-6 mb-6 space-y-2 text-gray-700 dark:text-gray-300">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-outside ml-6 mb-6 space-y-2 text-gray-700 dark:text-gray-300">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="leading-7">{children}</li>
    ),
    code: ({ inline, className, children, ...props }: any) => {
      if (inline) {
        return (
          <code
            className="bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-gray-900 dark:text-gray-300"
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }: any) => {
      // Extract language from the code element if present
      const codeElement = children?.props;
      const className = codeElement?.className || '';
      const language = className.replace('hljs language-', '').replace('language-', '');

      return (
        <div className="my-8">
          {language && (
            <div className="bg-gray-800 text-gray-300 text-xs px-4 py-2 rounded-t-lg border-b border-gray-700 font-mono">
              {language}
            </div>
          )}
          <pre className={`rounded-${language ? 'b' : ''}-lg overflow-hidden bg-[#0d1117] border border-gray-800`}>
            <div className="overflow-x-auto p-4 text-sm">
              {children}
            </div>
          </pre>
        </div>
      );
    },
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">
        {children}
      </blockquote>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-blue-600 dark:text-blue-400 hover:underline"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900 dark:text-white">
        {children}
      </strong>
    ),
    hr: () => (
      <hr className="my-12 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
    ),
    table: ({ children }) => (
      <div className="my-8 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 border border-gray-300 dark:border-gray-700 rounded-lg">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gray-100 dark:bg-gray-800">
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
        {children}
      </tbody>
    ),
    tr: ({ children }) => (
      <tr>{children}</tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
        {children}
      </td>
    ),
  };

  return (
    <>

      {/* Back link */}
      <div className="mb-8 -mt-8">
        <a href="/blog" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 text-sm font-mono inline-flex items-center group">
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          <span className="ml-2">Back to blog</span>
        </a>
      </div>

      {/* Article */}
      <article className="mb-24">
        {/* Title and date */}
        <header className="mb-10">
          <h1 className="text-4xl font-semibold mb-4 text-gray-900 dark:text-white tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-xs font-mono tracking-wide text-gray-600 dark:text-gray-500">
            {post.author && (
              <>
                <span>{post.author}</span>
                <span className="text-gray-400 dark:text-gray-600">•</span>
              </>
            )}
            <time>{post.date}</time>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={components}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </>
  );
}
