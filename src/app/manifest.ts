import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bestiee Control Panel",
    short_name: "Bestiee CP",
    description: "پنل مدیریت بستی برای مدیریت آرایشگاه‌ها و سالن‌ها",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
