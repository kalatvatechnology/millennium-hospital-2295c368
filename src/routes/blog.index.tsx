import { createFileRoute } from "@tanstack/react-router";
import { ArticleCard } from "@/components/content/cards";
import { PublicPage } from "@/components/layout/public-page";
import { EmptyState, PageIntro, ContentSection } from "@/components/shared/page";
import { articles } from "@/content/placeholders";
import { createPageMeta } from "@/lib/seo";
export const Route = createFileRoute("/blog/")({ head: () => ({ meta: createPageMeta("Health resources", "Read verified hospital news and health information from The Millennium Hospital.") }), component: BlogPage });
function BlogPage(){return <PublicPage><PageIntro eyebrow="Health resources" title="News and useful information" description="Hospital updates and clinically reviewed health articles will be published here."/><ContentSection>{articles.length?<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{articles.map((article)=><ArticleCard key={article.slug} article={article}/>)}</div>:<EmptyState title="No articles are published yet" description="Please check back for verified hospital news and health resources."/>}</ContentSection></PublicPage>}