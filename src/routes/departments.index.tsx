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
      <PageIntro eyebrow="Specialties" title="Departments and specialties" description="Each department lists its specialists and related professional services." />
      <ContentSection>
        <Async
          query={departments}
          isEmpty={(data) => data.length === 0}
          empty={<EmptyState title="Departments are being prepared" description="No departments have been published yet." action={<Button asChild><Link to="/contact">Contact the hospital</Link></Button>} />}
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
