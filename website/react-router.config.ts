import type { Config } from "@react-router/dev/config";
import { getAllPosts } from "./app/utils/posts.server";

export default {
  ssr: true,
  async prerender() {
    const posts = await getAllPosts();
    const blogSlugs = posts
      .filter((p) => p.slug) // Only local posts (not external)
      .map((p) => `/blog/${p.slug}`);

    return [
      "/",
      "/blog",
      "/rss.xml",
      "/atom.xml",
      "/feed.json",
      "/sitemap.xml",
      ...blogSlugs,
    ];
  },
} satisfies Config;
