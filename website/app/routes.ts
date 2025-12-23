import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  // Full-screen routes (no site layout)
  route("happyholidays/terminal", "routes/happyholidays.terminal.tsx"),

  // API routes
  route("api/game", "routes/api.game.tsx"),

  // Standard site layout routes
  layout("routes/_layout.tsx", [
    index("routes/home.tsx"),
    route("blog", "routes/blog.tsx"),
    route("blog/:slug", "routes/blog.$slug.tsx"),
    route("happyholidays2025", "routes/happyholidays2025.tsx"),
    route("rss.xml", "routes/rss[.]xml.tsx"),
    route("atom.xml", "routes/atom[.]xml.tsx"),
    route("feed.json", "routes/feed[.]json.tsx"),
    route("sitemap.xml", "routes/sitemap[.]xml.tsx"),
  ]),
] satisfies RouteConfig;
