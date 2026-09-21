import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/shared/legal-page";
import { createPageMeta } from "@/lib/seo";
export const Route = createFileRoute("/terms-and-conditions")({ head: () => ({ meta: createPageMeta("Terms and conditions", "Terms for using The Millennium Hospital website.") }), component: () => <LegalPage title="Terms and conditions" description="Terms governing the use of this website."/> });
