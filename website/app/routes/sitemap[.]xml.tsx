import type { LoaderFunctionArgs } from 'react-router';
import { getListedPosts } from '~/utils/posts.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const posts = await getListedPosts();
  const siteUrl = new URL(request.url).origin;

  // Separate posts by type
  const blogPosts = posts.filter(post => post.slug);
  const internalPages = posts.filter(post => post.path);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/blog</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
${blogPosts
  .map(post => `  <url>
    <loc>${siteUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.date).toISOString().split('T')[0]}</lastmod>
    <priority>0.6</priority>
  </url>`).join('\n')}
${internalPages
  .map(post => `  <url>
    <loc>${siteUrl}${post.path}</loc>
    <lastmod>${new Date(post.date).toISOString().split('T')[0]}</lastmod>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
