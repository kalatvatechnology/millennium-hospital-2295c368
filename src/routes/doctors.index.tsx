import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BriefcaseMedical,
  GraduationCap,
  MapPin,
  Phone,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { PublicPage } from "@/components/layout/public-page";
import { EmptyState, PageIntro } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";
import { doctorsQuery, type DoctorWithDepartment } from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

const PAGE_SIZE = 6;

type SortOption = "relevance" | "name" | "experience";

export const Route = createFileRoute("/doctors/")({
  head: () => ({
    meta: createPageMeta(
      "Find a Doctor",
      "Meet The Millennium Hospital's doctors and search by name, specialty, department, qualifications, or location.",
    ),
  }),
  component: DoctorsPage,
});

function FilterFields({
  department,
  location,
  departments,
  locations,
  onDepartmentChange,
  onLocationChange,
}: {
  department: string;
  location: string;
  departments: string[];
  locations: string[];
  onDepartmentChange: (value: string) => void;
  onLocationChange: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="doctor-department">Department</Label>
        <Select value={department} onValueChange={onDepartmentChange}>
          <SelectTrigger id="doctor-department" className="mt-2 w-full bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="doctor-location">Location</Label>
        <Select value={location} onValueChange={onLocationChange}>
          <SelectTrigger id="doctor-location" className="mt-2 w-full bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {locations.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function DirectoryDoctorCard({ doctor }: { doctor: DoctorWithDepartment }) {
  const specialty = doctor.specialty ?? doctor.department?.name;
  const location = doctor.location ?? doctor.location_info;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-md)]">
      <Link
        to="/doctors/$slug"
        params={{ slug: doctor.slug }}
        aria-label={`View ${doctor.name}'s profile`}
        className="block overflow-hidden bg-secondary"
      >
        <div className="grid aspect-[4/3] place-items-center overflow-hidden">
          {doctor.photo_url ? (
            <img
              src={doctor.photo_url}
              alt={`Portrait of ${doctor.name}`}
              className="size-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="grid size-full place-items-center bg-secondary text-primary" aria-hidden="true">
              <div className="grid size-20 place-items-center rounded-full border border-primary/15 bg-background/70">
                <UserRound className="size-10" />
              </div>
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {specialty ? <p className="text-sm font-semibold text-primary">{specialty}</p> : null}
        <h2 className="mt-2 text-xl font-semibold leading-snug">
          <Link
            to="/doctors/$slug"
            params={{ slug: doctor.slug }}
            className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {doctor.name}
          </Link>
        </h2>
        {doctor.designation ? (
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{doctor.designation}</p>
        ) : null}

        <div className="mt-5 space-y-3 border-t border-border/70 pt-4 text-sm text-muted-foreground">
          {doctor.experience_years !== null ? (
            <p className="flex items-start gap-2">
              <BriefcaseMedical className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{doctor.experience_years} years of experience</span>
            </p>
          ) : null}
          {doctor.qualifications.length ? (
            <p className="flex items-start gap-2">
              <GraduationCap className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{doctor.qualifications.join(", ")}</span>
            </p>
          ) : null}
          {location ? (
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{location}</span>
            </p>
          ) : null}
        </div>

        {doctor.expertise.length ? (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Areas of expertise</p>
            <p className="mt-2 text-sm leading-6">{doctor.expertise.join(" · ")}</p>
          </div>
        ) : null}

        <div className="mt-auto grid gap-2 pt-6 sm:grid-cols-2">
          <Button asChild>
            <Link to="/contact">Book appointment</Link>
          </Button>
          {siteConfig.contact.phone ? (
            <Button asChild variant="outline">
              <a href={`tel:${siteConfig.contact.phone}`}>
                <Phone />
                Call now
              </a>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link to="/doctors/$slug" params={{ slug: doctor.slug }}>
                View profile
                <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function DirectoryLoading() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading doctors">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-border bg-card">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-3 p-6">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-6 h-11 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DoctorsPage() {
  const doctors = useQuery(doctorsQuery);
  const [query, setQuery] = useState("");
  const [draftDepartment, setDraftDepartment] = useState("all");
  const [draftLocation, setDraftLocation] = useState("all");
  const [department, setDepartment] = useState("all");
  const [location, setLocation] = useState("all");
  const [sort, setSort] = useState<SortOption>("relevance");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const list = useMemo(() => doctors.data ?? [], [doctors.data]);
  const departments = useMemo(
    () =>
      [
        ...new Set(
          list.flatMap((doctor) =>
            doctor.department?.name ? [doctor.department.name] : [],
          ),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [list],
  );
  const locations = useMemo(
    () =>
      [
        ...new Set(
          list.flatMap((doctor) => (doctor.location ? [doctor.location] : [])),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [list],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    const matches = list.filter((doctor) => {
      const searchable = [
        doctor.name,
        doctor.designation,
        doctor.specialty,
        doctor.department?.name,
        doctor.location,
        doctor.location_info,
        ...doctor.qualifications,
        ...doctor.expertise,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();

      return (
        (!term || searchable.includes(term)) &&
        (department === "all" || doctor.department?.name === department) &&
        (location === "all" || doctor.location === location)
      );
    });

    if (sort === "name") return [...matches].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "experience") {
      return [...matches].sort(
        (a, b) => (b.experience_years ?? -1) - (a.experience_years ?? -1),
      );
    }
    return matches;
  }, [department, list, location, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleDoctors = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const resultStart = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const resultEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);
  const activeFilterCount = Number(department !== "all") + Number(location !== "all");
  const context = department !== "all" ? department : query.trim() ? `Results for “${query.trim()}”` : "Medical team";

  function clearFilters() {
    setQuery("");
    setDraftDepartment("all");
    setDraftLocation("all");
    setDepartment("all");
    setLocation("all");
    setPage(1);
  }

  function applyFilters() {
    setDepartment(draftDepartment);
    setLocation(draftLocation);
    setPage(1);
    setFiltersOpen(false);
  }

  function changeSort(value: string) {
    if (value === "relevance" || value === "name" || value === "experience") {
      setSort(value);
      setPage(1);
    }
  }

  return (
    <PublicPage>
      <PageIntro
        eyebrow="OUR DOCTORS"
        title="Expert Care. A Healthier You."
        description="Meet our team of experienced doctors across multiple specialties, dedicated to your health and well-being."
      />

      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Label htmlFor="doctor-search" className="sr-only">
              Search doctors
            </Label>
            <Input
              id="doctor-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search by doctor name, specialty or keyword"
              className="h-14 bg-card pl-12 pr-4 text-base shadow-[var(--shadow-sm)]"
            />
          </div>

          <div className="mt-10 grid items-start gap-8 lg:grid-cols-[15.5rem_minmax(0,1fr)]">
            <aside className="hidden rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-sm)] lg:block">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Filter doctors</h2>
                {activeFilterCount ? (
                  <span className="text-xs font-semibold text-primary">{activeFilterCount} active</span>
                ) : null}
              </div>
              <div className="mt-6">
                <FilterFields
                  department={draftDepartment}
                  location={draftLocation}
                  departments={departments}
                  locations={locations}
                  onDepartmentChange={setDraftDepartment}
                  onLocationChange={setDraftLocation}
                />
              </div>
              <div className="mt-7 grid gap-2">
                <Button onClick={applyFilters}>Apply filters</Button>
                <Button variant="ghost" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>
            </aside>

            <main>
              <div className="flex flex-col gap-5 border-b border-border pb-6">
                <div className="flex items-center justify-between gap-4 lg:hidden">
                  <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline">
                        <SlidersHorizontal />
                        Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Filter doctors</SheetTitle>
                        <SheetDescription>Choose a department or published location.</SheetDescription>
                      </SheetHeader>
                      <div className="mt-8">
                        <FilterFields
                          department={draftDepartment}
                          location={draftLocation}
                          departments={departments}
                          locations={locations}
                          onDepartmentChange={setDraftDepartment}
                          onLocationChange={setDraftLocation}
                        />
                      </div>
                      <SheetFooter className="mt-8 gap-2">
                        <Button variant="outline" onClick={clearFilters}>Clear all</Button>
                        <SheetClose asChild>
                          <Button onClick={applyFilters}>Apply filters</Button>
                        </SheetClose>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                  <p className="text-sm font-semibold text-primary">{filtered.length} doctors</p>
                </div>

                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary">{context}</p>
                    <h2 className="mt-2 text-3xl font-semibold">Doctors</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {query.trim() || activeFilterCount
                        ? "Doctors matching your current search and filters."
                        : "Browse published profiles and choose the right doctor for your care needs."}
                    </p>
                    <p className="mt-3 hidden text-sm font-semibold lg:block">Total doctors: {filtered.length}</p>
                  </div>
                  <div className="w-full sm:w-48">
                    <Label htmlFor="doctor-sort">Sort by</Label>
                    <Select
                      value={sort}
                      onValueChange={changeSort}
                    >
                      <SelectTrigger id="doctor-sort" className="mt-2 w-full bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="experience">Experience</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                {doctors.isPending ? <DirectoryLoading /> : null}
                {doctors.isError ? (
                  <div className="rounded-lg border border-border bg-card px-6 py-14 text-center" role="alert">
                    <h2 className="text-2xl font-semibold">Doctor information is unavailable</h2>
                    <p className="mt-3 text-muted-foreground">Please try again in a moment.</p>
                    <Button className="mt-6" onClick={() => doctors.refetch()}>Try again</Button>
                  </div>
                ) : null}
                {doctors.isSuccess && visibleDoctors.length ? (
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleDoctors.map((doctor) => (
                      <DirectoryDoctorCard key={doctor.id} doctor={doctor} />
                    ))}
                  </div>
                ) : null}
                {doctors.isSuccess && !visibleDoctors.length ? (
                  <EmptyState
                    title="No doctors found"
                    description={
                      list.length
                        ? "Try changing your search or filters, or contact the hospital for assistance."
                        : "No doctor profiles have been published. Contact the hospital for assistance."
                    }
                    action={
                      list.length && (query.trim() || activeFilterCount) ? (
                        <Button onClick={clearFilters}>Clear filters</Button>
                      ) : (
                        <Button asChild>
                          <Link to="/contact">Contact the hospital</Link>
                        </Button>
                      )
                    }
                  />
                ) : null}
              </div>

              {doctors.isSuccess && filtered.length ? (
                <nav aria-label="Doctor results pagination" className="mt-10 border-t border-border pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {resultStart}–{resultEnd} of {filtered.length} doctors
                    </p>
                    {pageCount > 1 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                          Previous
                        </Button>
                        {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                          <Button
                            key={pageNumber}
                            variant={pageNumber === currentPage ? "default" : "outline"}
                            size="sm"
                            aria-current={pageNumber === currentPage ? "page" : undefined}
                            aria-label={`Page ${pageNumber}`}
                            onClick={() => setPage(pageNumber)}
                          >
                            {pageNumber}
                          </Button>
                        ))}
                        <Button variant="outline" size="sm" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
                          Next
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </nav>
              ) : null}
            </main>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}