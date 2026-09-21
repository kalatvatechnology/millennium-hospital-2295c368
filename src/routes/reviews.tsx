import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/layout/public-page";
import { EmptyState, PageIntro, ContentSection } from "@/components/shared/page";
import { createPageMeta } from "@/lib/seo";
export const Route = createFileRoute("/reviews")({ head: () => ({ meta: createPageMeta("Patient reviews", "Read verified patient experiences from The Millennium Hospital.") }), component: ReviewsPage });
function ReviewsPage(){return <PublicPage><PageIntro eyebrow="Patient voices" title="Patient reviews" description="Only reviewed and approved patient experiences will be shown here."/><ContentSection><EmptyState title="No reviews are published yet" description="Verified patient feedback will appear here once it is ready."/></ContentSection></PublicPage>}
