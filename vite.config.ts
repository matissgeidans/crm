import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(async ({ mode }) => {
  const plugins: any[] = [react()];

  // 🟢 Replit-only plugins (tikai dev vidē un tikai ja pieejami)
  if (mode !== "production" && process.env.REPL_ID) {
    try {
      const runtimeErrorOverlay = await import(
        "@replit/vite-plugin-runtime-error-modal"
      );
      plugins.push(runtimeErrorOverlay.default());

      const cartographer = await import(
        "@replit/vite-plugin-cartographer"
      );
      plugins.push(cartographer.cartographer());

      const devBanner = await import(
        "@replit/vite-plugin-dev-banner"
      );
      plugins.push(devBanner.devBanner());
    } catch (err) {
      console.log("ℹ️ Replit plugins not loaded (not running on Replit)");
    }
  }

  return {
    plugins,

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },

    root: path.resolve(__dirname, "client"),

    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
    },

    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
