import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PublicPage } from "@/components/layout/public-page";
import { ContentSection, PageIntro } from "@/components/shared/page";
import { EnquiryForm } from "@/components/content/enquiry-form";
import { createPageMeta } from "@/lib/seo";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: createPageMeta("Contact", "Find verified contact and location information for The Millennium Hospital and send an enquiry.") }),
  component: ContactPage,
});

const contacts = [
  { icon: Phone, label: "Phone", value: siteConfig.contact.phone, href: siteConfig.contact.phone ? `tel:${siteConfig.contact.phone}` : null },
  { icon: Mail, label: "Email", value: siteConfig.contact.email, href: siteConfig.contact.email ? `mailto:${siteConfig.contact.email}` : null },
  { icon: MessageCircle, label: "WhatsApp", value: siteConfig.contact.whatsapp, href: siteConfig.contact.whatsapp ? `https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, "")}` : null },
  { icon: MapPin, label: "Address", value: siteConfig.contact.address, href: null },
  { icon: Clock, label: "Opening hours", value: siteConfig.contact.openingHours, href: null },
];

function ContactPage() {
  return (
    <PublicPage>
      <PageIntro eyebrow="Contact" title="We're here to help" description="Use verified contact information to reach the hospital, or send an enquiry and we'll get back to you." />
      <ContentSection>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Hospital information</h2>
            <div className="mt-6 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
              {contacts.map((item) => (
                <div key={item.label} className="bg-background p-5">
                  <item.icon className="size-5 text-primary" />
                  <p className="mt-4 text-sm font-semibold">{item.label}</p>
                  {item.value && item.href ? (
                    <a href={item.href} className="mt-1 block break-words text-sm text-primary underline-offset-4 hover:underline">{item.value}</a>
                  ) : (
                    <p className="mt-1 break-words text-sm text-muted-foreground">{item.value ?? "Not yet published"}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 grid min-h-64 place-items-center border border-dashed border-border bg-surface text-center">
              {siteConfig.contact.mapUrl ? (
                <a href={siteConfig.contact.mapUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary">Open hospital location</a>
              ) : (
                <div>
                  <MapPin className="mx-auto text-primary" />
                  <p className="mt-3 font-semibold">Map not yet available</p>
                  <p className="mt-2 text-sm text-muted-foreground">The map will appear once the address is verified.</p>
                </div>
              )}
            </div>
            <p className="mt-5 text-sm text-muted-foreground">For a medical emergency, contact your local emergency service.</p>
          </div>
          <EnquiryForm source="contact" />
        </div>
      </ContentSection>
    </PublicPage>
  );
}
