import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";

const BUCKET = "doctor-profile-images";
const allowedPath = /^[0-9a-f-]{36}\/[a-z0-9-]+\.(?:jpe?g|png|webp)$/i;
const allowedContentTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function createPublicStorageClient(url: string, key: string) {
  return createClient(url, key, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(
          typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
        );
        if (init?.headers) {
          new Headers(init.headers).forEach((value, name) => headers.set(name, value));
        }
        if (key.startsWith("sb_publishable_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const Route = createFileRoute("/api/public/doctor-profile-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const path = new URL(request.url).searchParams.get("path") ?? "";
        if (!allowedPath.test(path)) return new Response("Not found", { status: 404 });

        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !key) return new Response("Image service unavailable", { status: 503 });

        const storage = createPublicStorageClient(url, key).storage.from(BUCKET);
        const { data, error } = await storage.download(path);
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
