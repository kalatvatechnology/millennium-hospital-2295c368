import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicPage } from "@/components/layout/public-page";
import { EmptyState, PageIntro, ContentSection } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { createPageMeta } from "@/lib/seo";
export const Route = createFileRoute("/services/$slug")({ head: () => ({ meta: [...createPageMeta("Service unavailable", "This hospital service page is not currently published."), { name: "robots", content: "noindex" }] }), component: ServiceDetail });
function ServiceDetail(){return <PublicPage><PageIntro eyebrow="Clinical service" title="Service details not yet published" description="Verified care information will appear here when available."/><ContentSection><EmptyState title="We couldn't find this service" description="It may not have been published yet or the address may have changed." action={<Button asChild><Link to="/services">View all services</Link></Button>}/></ContentSection></PublicPage>}
