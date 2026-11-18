import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kotelna - Správa kotle",
    short_name: "Kotelna",
    description: "Chytrá správa přikládání do kotle pro celou rodinu",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    orientation: "portrait",
    lang: "cs",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
