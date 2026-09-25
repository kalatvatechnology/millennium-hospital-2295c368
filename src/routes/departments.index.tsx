import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicPage } from "@/components/layout/public-page";
import { DepartmentCard } from "@/components/content/cards";
import { Async } from "@/components/shared/async";
import { ContentSection, EmptyState, PageIntro } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { departmentsQuery } from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/departments/")({
  head: () => ({ meta: createPageMeta("Departments", "Explore the clinical departments and specialties of The Millennium Hospital.") }),
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const departments = useQuery(departmentsQuery);
  return (
    <PublicPage>
      <PageIntro eyebrow="Specialties" title="Departments" description="Explore our specialized departments and clinical services at The Millennium Hospital." />
      <ContentSection>
        <Async
          query={departments}
          error={<div role="alert" className="py-12 text-center"><h2 className="text-lg font-semibold">We're unable to load departments right now.</h2><p className="mt-2 text-sm text-muted-foreground">Please try again later.</p></div>}
          isEmpty={(data) => data.length === 0}
          empty={<EmptyState title="No departments are currently available." description="Please check back soon or contact the hospital for help." action={<Button asChild><Link to="/contact">Contact the hospital</Link></Button>} />}
        >
          {(data) => (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((item) => <DepartmentCard key={item.id} department={item} />)}
            </div>
          )}
        </Async>
      </ContentSection>
    </PublicPage>
  );
}
