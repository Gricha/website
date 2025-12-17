import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
// import netlifyPlugin from "@netlify/vite-plugin-react-router";

export default defineConfig({
  // NOTE: netlifyPlugin() disabled - conflicts with prerendering
  // https://github.com/remix-run/react-router/issues/14096
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    port: 3457,
    // allowedHosts: ["localhost", "::", "sunbird-working-perch.ngrok-free.app"],
  },
});
