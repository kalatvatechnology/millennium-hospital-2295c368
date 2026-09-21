import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicPage } from "@/components/layout/public-page";
import { EmptyState, PageIntro, ContentSection } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { createPageMeta } from "@/lib/seo";
export const Route = createFileRoute("/blog/$slug")({ head: () => ({ meta: [...createPageMeta("Article unavailable", "This hospital article is not currently published."), { name: "robots", content: "noindex" }] }), component: ArticleDetail });
function ArticleDetail(){return <PublicPage><PageIntro eyebrow="Health resource" title="Article not available" description="This article may be awaiting review or may no longer be published."/><ContentSection><EmptyState title="We couldn't find this article" description="Browse the resources page for other published information." action={<Button asChild><Link to="/blog">View health resources</Link></Button>}/></ContentSection></PublicPage>}
