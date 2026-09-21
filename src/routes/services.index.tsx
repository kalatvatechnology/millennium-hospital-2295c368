import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicPage } from "@/components/layout/public-page";
import { EmptyState, PageIntro, ContentSection } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { createPageMeta } from "@/lib/seo";
export const Route = createFileRoute("/services/")({ head: () => ({ meta: createPageMeta("Services", "Explore verified clinical services at The Millennium Hospital.") }), component: ServicesPage });
function ServicesPage(){return <PublicPage><PageIntro eyebrow="Care and treatment" title="Hospital services" description="Clear service information will be published here after clinical review."/><ContentSection><EmptyState title="Service information is being prepared" description="No clinical service details have been published yet. Please contact the hospital for current information." action={<Button asChild><Link to="/contact">Contact the hospital</Link></Button>}/></ContentSection></PublicPage>}
