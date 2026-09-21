import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicPage } from "@/components/layout/public-page";
import { Async } from "@/components/shared/async";
import { ContentSection, EmptyState, PageIntro } from "@/components/shared/page";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { faqQuery } from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: createPageMeta("Frequently asked questions", "Answers to common questions about visiting The Millennium Hospital.") }),
  component: FaqPage,
});

function FaqPage() {
  const faq = useQuery(faqQuery);
  return (
    <PublicPage>
      <PageIntro eyebrow="Help centre" title="Frequently asked questions" description="Practical answers for patients, families and visitors." />
      <ContentSection>
        <Async
          query={faq}
          isEmpty={(data) => data.faqs.length === 0}
          empty={<EmptyState title="Answers are being prepared" description="No frequently asked questions have been published yet." action={<Button asChild><Link to="/contact">Ask the hospital</Link></Button>} />}
        >
          {(data) => {
            const groups = data.categories
              .map((category) => ({ category, items: data.faqs.filter((faq) => faq.category === category.name) }))
              .filter((group) => group.items.length);
            const ungrouped = data.faqs.filter((item) => !item.category || !data.categories.some((c) => c.name === item.category));
            return (
              <div className="mx-auto grid max-w-3xl gap-12">
                {groups.map(({ category, items }) => (
                  <div key={category.id}>
                    <h2 className="text-2xl font-semibold">{category.name}</h2>
                    <Accordion type="single" collapsible className="mt-4">
                      {items.map((item) => (
                        <AccordionItem key={item.id} value={item.id}>
                          <AccordionTrigger>{item.question}</AccordionTrigger>
                          <AccordionContent>{item.answer}</AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ))}
                {ungrouped.length ? (
                  <Accordion type="single" collapsible>
                    {ungrouped.map((item) => (
                      <AccordionItem key={item.id} value={item.id}>
                        <AccordionTrigger>{item.question}</AccordionTrigger>
                        <AccordionContent>{item.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : null}
              </div>
            );
          }}
        </Async>
      </ContentSection>
    </PublicPage>
  );
}
