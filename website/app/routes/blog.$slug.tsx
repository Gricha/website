import { useParams } from "react-router";
import type { Route } from "./+types/blog.$slug";
import { blogPosts } from "./blog";
import { ExternalLink } from "../components/ExternalLink";

export function meta({ params }: Route.MetaArgs) {
  const post = blogPosts.find(p => p.slug === params.slug);
  return [
    { title: post ? `${post.title} - My Portfolio` : "Post Not Found" },
    { name: "description", content: post?.excerpt || "Blog post" },
  ];
}

export default function BlogPost() {
  const { slug } = useParams();
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-400">
        <h1 className="text-2xl mb-4">Post not found</h1>
        <ExternalLink href="/blog">← Back to blog</ExternalLink>
      </div>
    );
  }

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
          <time className="text-gray-600 dark:text-gray-500 text-xs font-mono tracking-wide">
            {post.date}
          </time>
        </header>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          {post.content?.split('\n\n').map((paragraph, idx) => {
            // Handle headers
            if (paragraph.startsWith('# ')) {
              return (
                <h1 key={idx} className="text-2xl font-light text-gray-900 dark:text-white mt-8 mb-4">
                  {paragraph.replace('# ', '')}
                </h1>
              );
            }
            if (paragraph.startsWith('## ')) {
              return (
                <h2 key={idx} className="text-xl font-light text-gray-900 dark:text-white mt-6 mb-3">
                  {paragraph.replace('## ', '')}
                </h2>
              );
            }

            // Handle code blocks
            if (paragraph.startsWith('```')) {
              const lines = paragraph.split('\n');
              const code = lines.slice(1, -1).join('\n');
              return (
                <pre key={idx} className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto my-4">
                  <code className="text-gray-900 dark:text-gray-300 text-sm font-mono">{code}</code>
                </pre>
              );
            }

            // Handle bullet lists
            if (paragraph.includes('\n- ')) {
              const items = paragraph.split('\n- ').filter(Boolean);
              return (
                <ul key={idx} className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 my-4 leading-7">
                  {items.map((item, i) => (
                    <li key={i} className="ml-4">
                      {item.startsWith('**') ? (
                        <>
                          <strong className="text-gray-900 dark:text-white">
                            {item.match(/\*\*(.*?)\*\*/)?.[1]}
                          </strong>
                          {item.replace(/\*\*(.*?)\*\*/, '').replace(': ', ': ')}
                        </>
                      ) : (
                        item
                      )}
                    </li>
                  ))}
                </ul>
              );
            }

            // Handle inline code with backticks
            const processInlineCode = (text: string) => {
              const parts = text.split(/(`[^`]+`)/g);
              return parts.map((part, i) => {
                if (part.startsWith('`') && part.endsWith('`')) {
                  return (
                    <code key={i} className="bg-gray-200 dark:bg-gray-900 px-1.5 py-0.5 rounded text-sm font-mono text-gray-900 dark:text-gray-300">
                      {part.slice(1, -1)}
                    </code>
                  );
                }
                return part;
              });
            };

            // Regular paragraphs
            return (
              <p key={idx} className="text-gray-700 dark:text-gray-300 leading-7 mb-4 text-[15px]">
                {processInlineCode(paragraph)}
              </p>
            );
          })}
        </div>
      </article>
    </>
  );
}
