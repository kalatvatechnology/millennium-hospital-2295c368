import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicPage } from "@/components/layout/public-page";
import { EmptyState, PageIntro, ContentSection } from "@/components/shared/page";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { faqs } from "@/content/placeholders";
import { createPageMeta } from "@/lib/seo";
export const Route = createFileRoute("/faq")({ head: () => ({ meta: createPageMeta("Frequently asked questions", "Answers to common questions about visiting The Millennium Hospital.") }), component: FaqPage });
function FaqPage(){return <PublicPage><PageIntro eyebrow="Help centre" title="Frequently asked questions" description="Practical answers for patients, families, and visitors."/><ContentSection>{faqs.length?<Accordion type="single" collapsible className="mx-auto max-w-3xl">{faqs.map((faq)=><AccordionItem key={faq.id} value={faq.id}><AccordionTrigger>{faq.question}</AccordionTrigger><AccordionContent>{faq.answer}</AccordionContent></AccordionItem>)}</Accordion>:<EmptyState title="Answers are being prepared" description="No frequently asked questions have been published yet." action={<Button asChild><Link to="/contact">Ask the hospital</Link></Button>}/>}</ContentSection></PublicPage>}