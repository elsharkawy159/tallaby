import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Tallaby Admin Dashboard",
    short_name: "Tallaby Admin",
    description: "Tallaby marketplace administration.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    orientation: "any",
    icons: [
      {
        src: "/logo/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    categories: ["business", "productivity"],
    lang: "en",
    dir: "ltr",
    scope: "/",
  };
}
