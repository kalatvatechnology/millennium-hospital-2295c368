import { createFileRoute, Link } from "@tanstack/react-router";
import { FacilityCard } from "@/components/content/cards";
import { PublicPage } from "@/components/layout/public-page";
import { EmptyState, PageIntro, ContentSection } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { facilities } from "@/content/placeholders";
import { createPageMeta } from "@/lib/seo";
export const Route = createFileRoute("/facilities")({ head: () => ({ meta: createPageMeta("Facilities", "Explore verified facilities at The Millennium Hospital and prepare for your visit.") }), component: FacilitiesPage });
function FacilitiesPage(){return <PublicPage><PageIntro eyebrow="Hospital environment" title="Facilities designed for care" description="Approved images and practical details will help patients and families prepare for a visit."/><ContentSection>{facilities.length?<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{facilities.map((facility)=><FacilityCard key={facility.slug} facility={facility}/>)}</div>:<EmptyState title="Facility information is being prepared" description="No facility details or approved images have been published yet." action={<Button asChild><Link to="/contact">Plan your visit</Link></Button>}/>}</ContentSection></PublicPage>}