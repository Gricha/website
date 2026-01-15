import { Link } from "react-router";
import type { Route } from "./+types/home";
import { ExternalLink } from "../components/ExternalLink";
import { getAllPosts } from "../utils/posts.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "gricha.dev" },
    { name: "description", content: "Personal website" },
  ];
}

export async function loader() {
  const posts = await getAllPosts();
  return { posts };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { posts: blogPosts } = loaderData;

  return (
    <>
      <div className="mb-10">
        <h2 className="text-4xl font-semibold mb-3 text-gray-900 dark:text-gray-100 tracking-tight">
          ABOUT
        </h2>
        <div className="w-16 h-0.5 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full"></div>
      </div>

      <div className="mb-20 text-gray-700 dark:text-gray-300 leading-relaxed space-y-5 text-base">
        {/* <img
          src="/offcenter.webp"
          alt="Profile"
          className="w-48 h-48 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-800 shadow-md float-right ml-6 mb-4"
        /> */}
        <p>
          My name is Greg Pstrucha. I'm an engineer with extensive experience in
          developer experience and performance work. I am a cofounder at{" "}
          <ExternalLink href="https://subroutine.com">Subroutine</ExternalLink>.
        </p>
        <p>
          I use coding agents daily and write about what I've learned about
          getting better output out of them. Most recently
          I've been working on{" "}
          <ExternalLink href="https://github.com/Gricha/perry">
            perry
          </ExternalLink>
          , self-hosted development sandboxes you can access remotely, primed
          for coding agents. Accessible over Tailscale from CLI, web, or mobile.
        </p>
        <p>
          On the side I enjoy spending my time in the garage woodworking and
          tinkering with electronics.
        </p>
        <p>
          Previously I've worked at Robinhood where I led API Platform team.
          Between 2013-2019 I worked at Facebook. There I've spent most of my
          time on Mobile Infrastructure team where I have created{" "}
          <ExternalLink href="https://github.com/facebook/FBRetainCycleDetector">
            FBRetainCycleDetector
          </ExternalLink>
          , and worked on performance of iOS startup time.
        </p>
      </div>

      {/* Writing section */}
      <div className="mb-10">
        <h2 className="text-4xl font-semibold mb-3 text-gray-900 dark:text-gray-100 tracking-tight">
          WRITING
        </h2>
        <div className="w-16 h-0.5 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full"></div>
      </div>

      {/* Blog posts with improved hover states */}
      <div className="space-y-1">
        {blogPosts.map((post, index) => {
          const isExternal = post.external;
          const isInternalPage = post.path;
          const commonClassName =
            "group flex items-baseline text-xs py-3 px-0 transition-all duration-200 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 cursor-pointer border-l-2 border-transparent hover:border-emerald-500 hover:pl-3";
          const commonStyle = {
            animation: `fadeInUp 0.5s ease-out ${index * 0.1}s backwards`,
          };

          if (isExternal) {
            return (
              <a
                key={post.external}
                href={post.external}
                target="_blank"
                rel="noopener noreferrer"
                className={commonClassName}
                style={commonStyle}
              >
                <span className="text-gray-500 dark:text-gray-500 w-28 flex-shrink-0 text-[11px] tracking-wide group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
                  {post.date}
                </span>
                <span className="text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-200 text-sm">
                  {post.title}
                  <svg
                    className="inline-block w-3 h-3 ml-1 opacity-40 group-hover:opacity-100 transition-opacity"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                </span>
              </a>
            );
          }

          return (
            <Link
              key={post.path || post.slug}
              to={isInternalPage ? post.path! : `/blog/${post.slug}`}
              className={commonClassName}
              style={commonStyle}
            >
              <span className="text-gray-500 dark:text-gray-500 w-28 flex-shrink-0 text-[11px] tracking-wide group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
                {post.date}
              </span>
              <span className="text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-200 text-sm">
                {post.title}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
