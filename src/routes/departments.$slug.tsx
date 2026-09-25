import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, CalendarDays, Plus, UserRound } from "lucide-react";
import { useState } from "react";
import { PublicPage } from "@/components/layout/public-page";
import { Async } from "@/components/shared/async";
import { ContentSection, EmptyState } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { departmentQuery, faqQuery, type DoctorWithDepartment } from "@/lib/queries";
import { getDepartmentPresentation } from "@/lib/department-presentation";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/departments/$slug")({
  head: () => ({
    meta: createPageMeta("Department", "Specialist departments and clinical care at The Millennium Hospital."),
  }),
  validateSearch: (search: Record<string, unknown>): { preview?: boolean } =>
    search["preview"] === true || search["preview"] === "1" ? { preview: true } : {},
  component: DepartmentDetail,
});

const wrap = "mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10";
const eyebrow = "text-xs font-bold uppercase tracking-[0.18em]";

function DepartmentDetail() {
  const { slug } = Route.useParams();
  const { preview } = Route.useSearch();
  const query = useQuery(departmentQuery(slug, Boolean(preview)));
  return (
    <PublicPage>
      <Async query={query}>
        {(data) =>
          !data ? (
            <ContentSection>
              <EmptyState
                title="We couldn't find this department"
                description="It may not be published yet or the address may have changed."
                action={<Button asChild><Link to="/departments">View all departments</Link></Button>}
              />
            </ContentSection>
          ) : (
            <DepartmentView department={data.department} doctors={data.doctors} />
          )
        }
      </Async>
    </PublicPage>
  );
}

