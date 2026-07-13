import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        "src/test/**",
        "src/**/*.test.{js,jsx}",
       
      ],
    },
  },
  build: {
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-redux": ["@reduxjs/toolkit", "react-redux"],
          "vendor-clerk": ["@clerk/clerk-react"],
        },
      },
    },
  },
});