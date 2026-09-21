import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicPage } from "@/components/layout/public-page";
import { EmptyState, PageIntro, ContentSection } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { createPageMeta } from "@/lib/seo";
export const Route = createFileRoute("/doctors/$slug")({ head: () => ({ meta: [...createPageMeta("Doctor profile unavailable", "This doctor profile is not currently published."), { name: "robots", content: "noindex" }] }), component: DoctorDetail });
function DoctorDetail(){return <PublicPage><PageIntro eyebrow="Doctor profile" title="Profile not yet published" description="Verified clinician details will appear here when available."/><ContentSection><EmptyState title="We couldn't find this doctor profile" description="It may not have been published yet or the address may have changed." action={<Button asChild><Link to="/doctors">View all doctors</Link></Button>}/></ContentSection></PublicPage>}
