import { createFileRoute } from "@tanstack/react-router";

const BUCKET = "doctor-profile-images";
const allowedPath = /^(?:[a-z0-9-]+\/)?[0-9a-f-]{36}\/[a-z0-9-]+\.(?:jpe?g|png|webp)$/i;
const allowedContentTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const Route = createFileRoute("/api/public/doctor-profile-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const path = new URL(request.url).searchParams.get("path") ?? "";
        if (!allowedPath.test(path)) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(path);
        if (error) return new Response("Not found", { status: 404 });

        const contentType = data.type.toLowerCase();
        if (!allowedContentTypes.has(contentType)) {
          return new Response("Unsupported image", { status: 415 });
        }

        return new Response(await data.arrayBuffer(), {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400, immutable",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
