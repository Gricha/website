import { Feed } from 'feed';
import { getAllPosts } from '~/utils/posts.server';
import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const posts = await getAllPosts();
  const siteUrl = new URL(request.url).origin;

  const feed = new Feed({
    title: "Greg Pstrucha's Blog",
    id: siteUrl,
    link: siteUrl,
    language: "en",
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, Greg Pstrucha`,
    feedLinks: {
      rss: `${siteUrl}/rss.xml`,
      atom: `${siteUrl}/atom.xml`,
      json: `${siteUrl}/feed.json`,
    },
    author: {
      name: "Greg Pstrucha",
      link: siteUrl,
    },
  });

  // Add posts to feed
  for (const post of posts) {
    const postUrl = post.external || `${siteUrl}/blog/${post.slug}`;

    feed.addItem({
      title: post.title,
      id: postUrl,
      link: postUrl,
      description: post.excerpt || '',
      content: post.content || post.excerpt || '',
      author: [
        {
          name: post.author || "Greg Pstrucha",
          link: siteUrl,
        },
      ],
      date: new Date(post.date),
    });
  }

  // Return JSON Feed with proper content type
  return new Response(feed.json1(), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
