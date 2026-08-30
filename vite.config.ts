import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "public/manifest.json", dest: "." },
        { src: "public/offscreen.html", dest: "." },
        { src: "public/offscreen.js", dest: "." },
        { src: "public/sounds/*", dest: "sounds" }, // Copies all sound files into dist/sounds/
      ],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(import.meta.dirname, "index.html"),
        background: resolve(import.meta.dirname, "src/background.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
});
