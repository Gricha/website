import { Link } from "react-router";
import type { Route } from "./+types/blog";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Blog - My Portfolio" },
    { name: "description", content: "Articles and thoughts on programming" },
  ];
}

export const blogPosts: Array<{
  slug?: string;
  external?: string;
  date: string;
  title: string;
  excerpt?: string;
  content?: string;
}> = [
    {
      external: 'https://engineering.fb.com/2016/04/13/ios/automatic-memory-leak-detection-on-ios/',
      date: 'April 13, 2016',
      title: 'Automatic memory leak detection on iOS',
      excerpt: 'How Facebook built tools to automatically detect memory leaks in their iOS app.'
    },
    {
      external: 'https://engineering.fb.com/2015/08/24/ios/reducing-fooms-in-the-facebook-ios-app/',
      date: 'August 24, 2015',
      title: 'Reducing FOOMs in the Facebook iOS app',
      excerpt: 'How Facebook reduced foreground out-of-memory crashes in their iOS app.'
    }
  ];

export default function Blog() {
  return (
    <>
      {/* Title */}
      <div className="mb-10">
        <h1 className="text-4xl font-semibold mb-3 text-gray-900 dark:text-white tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text">
          Blog
        </h1>
        <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
      </div>

      {/* Blog posts */}
      <div className="space-y-2">
        {blogPosts.map((post, index) => {
          const isExternal = 'external' in post;
          const commonClassName = "group flex items-baseline text-sm py-3 px-4 -mx-4 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50/50 hover:via-purple-50/30 hover:to-transparent dark:hover:from-blue-950/20 dark:hover:via-purple-950/10 dark:hover:to-transparent cursor-pointer border border-transparent hover:border-blue-100/50 dark:hover:border-blue-900/30 hover:shadow-sm";
          const commonStyle = { animation: `fadeInUp 0.5s ease-out ${index * 0.1}s backwards` };

          return isExternal ? (
            <a
              key={post.external}
              href={post.external}
              target="_blank"
              rel="noopener noreferrer"
              className={commonClassName}
              style={commonStyle}
            >
              <span className="text-gray-600 dark:text-gray-500 w-28 flex-shrink-0 font-mono text-xs tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                {post.date}
              </span>
              <span className="text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300 text-base leading-6 font-medium">
                {post.title}
                <svg className="inline-block w-3 h-3 ml-1 opacity-50 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </span>
            </a>
          ) : (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className={commonClassName}
              style={commonStyle}
            >
              <span className="text-gray-600 dark:text-gray-500 w-28 flex-shrink-0 font-mono text-xs tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                {post.date}
              </span>
              <span className="text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300 text-base leading-6 font-medium">
                {post.title}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
