import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { siteConfig } from "@/config/site";
import { buildDigitalCardData } from "@/lib/digital-card/data";
import { buildVCard, vcardFileName, whatsappDigitsFromUrl } from "@/lib/digital-card/vcard";

/** Public "Save Contact" link used inside Digital Card PDFs. Published doctors only. */
export const Route = createFileRoute("/api/public/doctor-vcard")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = z.string().regex(/^[a-z0-9-]{1,120}$/).safeParse(url.searchParams.get("slug"));
        if (!parsed.success) return new Response("Not found", { status: 404 });
        const db = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data: doctor } = await db
          .from("doctors")
          .select("id,slug,name,qualifications,designation,specialty,phone_number,phone_country_code,whatsapp_number,whatsapp_country_code")
          .eq("slug", parsed.data)
          .eq("published", true)
          .maybeSingle();
        if (!doctor) return new Response("Not found", { status: 404 });
        const { data: links } = await db
          .from("doctor_locations")
          .select("display_order,public_name,locations(id,name,address_line,city,phone,published)")
          .eq("doctor_id", doctor.id)
          .eq("enabled", true)
          .order("display_order");
        const locations = (links ?? [])
          .map((l: any) => ({ ...(l.locations ?? {}), public_name: l.public_name, display_order: l.display_order }))
          .filter((l: any) => l.published)
          .sort((a: any, b: any) => (a.id === siteConfig.contact.primaryLocationId ? -1 : b.id === siteConfig.contact.primaryLocationId ? 1 : 0));
        const card = buildDigitalCardData(
          {
            doctor: { ...doctor, photo_url: null, profile_image_alt: null } as any,
            services: [],
            serviceItems: [],
            specializations: [],
            locations: locations as any,
          },
          url.origin,
        );
        return new Response(buildVCard(card, whatsappDigitsFromUrl(card.actions.whatsapp)), {
          headers: {
            "Content-Type": "text/vcard; charset=utf-8",
            "Content-Disposition": `attachment; filename="${vcardFileName(card)}"`,
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
