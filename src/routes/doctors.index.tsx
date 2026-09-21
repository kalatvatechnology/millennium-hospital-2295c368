import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicPage } from "@/components/layout/public-page";
import { DoctorCard } from "@/components/content/cards";
import { EmptyState, PageIntro, ContentSection } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { doctors } from "@/content/placeholders";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/doctors/")({ head: () => ({ meta: createPageMeta("Doctors", "Search verified doctor profiles at The Millennium Hospital by name, specialty, or department.") }), component: DoctorsPage });

function DoctorsPage(){
  const [query,setQuery]=useState(""); const [specialty,setSpecialty]=useState("all"); const [department,setDepartment]=useState("all");
  const specialties=[...new Set(doctors.map((doctor)=>doctor.specialty).filter((value): value is string => Boolean(value)))];
  const departments=[...new Set(doctors.map((doctor)=>doctor.department).filter((value): value is string => Boolean(value)))];
  const filtered=useMemo(()=>doctors.filter((doctor)=>{const text=`${doctor.name} ${doctor.specialty ?? ""} ${doctor.department ?? ""}`.toLowerCase();return text.includes(query.toLowerCase())&&(specialty==="all"||doctor.specialty===specialty)&&(department==="all"||doctor.department===department);}),[query,specialty,department]);
  return <PublicPage><PageIntro eyebrow="Medical team" title="Find a doctor" description="Search verified profiles by name, specialty, or department."/><ContentSection><div className="grid gap-4 border border-border bg-surface p-5 md:grid-cols-3"><div><Label htmlFor="doctor-search">Doctor name or specialty</Label><Input id="doctor-search" type="search" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search doctors" className="mt-2 bg-background"/></div><div><Label>Specialty</Label><Select value={specialty} onValueChange={setSpecialty}><SelectTrigger className="mt-2 w-full bg-background"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All specialties</SelectItem>{specialties.map((item)=><SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div><Label>Department</Label><Select value={department} onValueChange={setDepartment}><SelectTrigger className="mt-2 w-full bg-background"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All departments</SelectItem>{departments.map((item)=><SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div>{filtered.length?<div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((doctor)=><DoctorCard key={doctor.slug} doctor={doctor}/>)}</div>:<EmptyState title={doctors.length?"No doctors match your search":"Doctor profiles are being prepared"} description={doctors.length?"Try changing your search or filters.":"No clinician information has been published yet. Please contact the hospital for current availability."} action={<Button asChild><Link to="/contact">Contact the hospital</Link></Button>}/>}</ContentSection></PublicPage>;
}