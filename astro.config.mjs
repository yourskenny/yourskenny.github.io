import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import { faustPreview } from "./scripts/faust-preview.mjs";

export default defineConfig({
  integrations: [mdx()],
  site: "https://yourskenny.top",
  output: "static",
  devToolbar: { enabled: false },
  vite: {
    plugins: [faustPreview()],
    server: { strictPort: true }
  }
});
