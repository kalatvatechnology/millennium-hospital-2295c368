import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/layout/public-page";
import { EmptyState, PageIntro, ContentSection } from "@/components/shared/page";
import { createPageMeta } from "@/lib/seo";
export const Route = createFileRoute("/blog/")({ head: () => ({ meta: createPageMeta("Health resources", "Read verified hospital news and health information from The Millennium Hospital.") }), component: BlogPage });
function BlogPage(){return <PublicPage><PageIntro eyebrow="Health resources" title="News and useful information" description="Hospital updates and clinically reviewed health articles will be published here."/><ContentSection><EmptyState title="No articles are published yet" description="Please check back for verified hospital news and health resources."/></ContentSection></PublicPage>}
