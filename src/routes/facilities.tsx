import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicPage } from "@/components/layout/public-page";
import { EmptyState, PageIntro, ContentSection } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { createPageMeta } from "@/lib/seo";
export const Route = createFileRoute("/facilities")({ head: () => ({ meta: createPageMeta("Facilities", "Explore verified facilities at The Millennium Hospital.") }), component: FacilitiesPage });
function FacilitiesPage(){return <PublicPage><PageIntro eyebrow="Hospital environment" title="Facilities designed for care" description="Facility details and approved images will be shared here when available."/><ContentSection><EmptyState title="Facility information is being prepared" description="Please contact the hospital if you need information before your visit." action={<Button asChild><Link to="/contact">Contact the hospital</Link></Button>}/></ContentSection></PublicPage>}
