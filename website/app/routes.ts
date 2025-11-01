import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("blog", "routes/blog.tsx"),
  route("blog/:slug", "routes/blog.$slug.tsx"),
  route("rss.xml", "routes/rss[.]xml.tsx"),
  route("atom.xml", "routes/atom[.]xml.tsx"),
  route("feed.json", "routes/feed[.]json.tsx"),
] satisfies RouteConfig;
