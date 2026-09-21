import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicPage } from "@/components/layout/public-page";
import { EmptyState, PageIntro, ContentSection } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { createPageMeta } from "@/lib/seo";
export const Route = createFileRoute("/doctors/")({ head: () => ({ meta: createPageMeta("Doctors", "Browse verified doctor profiles at The Millennium Hospital.") }), component: DoctorsPage });
function DoctorsPage(){return <PublicPage><PageIntro eyebrow="Medical team" title="Find a doctor" description="Searchable doctor profiles will appear here after they are reviewed and published."/><ContentSection><EmptyState title="Doctor profiles are being prepared" description="No clinician information has been published yet. Please contact the hospital for current availability." action={<Button asChild><Link to="/contact">Contact the hospital</Link></Button>}/></ContentSection></PublicPage>}
