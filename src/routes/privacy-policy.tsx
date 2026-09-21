import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/shared/legal-page";
import { createPageMeta } from "@/lib/seo";
export const Route = createFileRoute("/privacy-policy")({ head: () => ({ meta: createPageMeta("Privacy policy", "Privacy information for The Millennium Hospital website.") }), component: () => <LegalPage title="Privacy policy" description="How personal information is handled on this website."/> });
