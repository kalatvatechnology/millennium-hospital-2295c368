/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { backendFeatures, usesProductionContract } from "./backend";
import { classifyDataError, DataAccessError } from "./errors";
import { mapDepartment, mapDoctor, mapFacility, mapFaq, mapMedia, mapReview, mapService } from "./mappers";
import type { BlogPost, Department, Doctor, Facility, Faq, FaqCategory, MediaItem, Review, Service } from "./models";

type Row = Record<string, any>;
const db = supabase as any;
const rows = (result: { data: Row[] | null; error: unknown }): Row[] => {
  if (result.error) throw classifyDataError(result.error);
  return result.data ?? [];
};
const one = (result: { data: Row | null; error: unknown }): Row | null => {
  if (result.error) throw classifyDataError(result.error);
  return result.data;
};

const published = (query: any) => usesProductionContract ? query.eq("status", "published") : query.eq("published", true);
const order = (query: any, field = "display_order") => query.order(field).order("created_at", { ascending: false });

export async function listDepartments(): Promise<Department[]> {
  return rows(await order(published(db.from("departments").select("*")), "display_order")).map(mapDepartment);
}

export async function getDepartment(slug: string) {
  const department = one(await published(db.from("departments").select("*").eq("slug", slug)).maybeSingle());
  if (!department) return null;
  if (!usesProductionContract) {
    const [doctorResult, serviceResult] = await Promise.all([
      published(db.from("doctors").select("*, department:departments(id,name,slug)").eq("department_id", department["id"])).order("display_order"),
      db.from("professional_service_departments").select("professional_services(*)").eq("department_id", department["id"]),
    ]);
    return {
      department: mapDepartment(department),
      doctors: rows(doctorResult).map((row) => mapDoctor(row)),
      services: rows(serviceResult).map((row) => row["professional_services"]).filter(Boolean).map(mapService).filter((item) => item.status === "published"),
    };
  }
  const [doctorLinks, serviceLinks] = await Promise.all([
    db.from("doctor_departments").select("doctors(*)").eq("department_id", department["id"]),
    db.from("department_services").select("services(*)").eq("department_id", department["id"]),
  ]);
  const summary = mapDepartment(department);
  return {
    department: summary,
    doctors: rows(doctorLinks).map((row) => mapDoctor(row["doctors"] ?? {}, summary)).filter((item) => item.status === "published"),
    services: rows(serviceLinks).map((row) => mapService(row["services"] ?? {})).filter((item) => item.status === "published"),
  };
}

export async function listDoctors(): Promise<Doctor[]> {
  if (!usesProductionContract) {
    return rows(await published(db.from("doctors").select("*, department:departments(id,name,slug)")).order("display_order").order("name")).map((row) => mapDoctor(row));
  }
  const doctorRows = rows(await published(db.from("doctors").select("*, doctor_departments(departments(id,name,slug))")).order("display_order").order("full_name"));
  return doctorRows.map((row) => {
    const links = Array.isArray(row["doctor_departments"]) ? row["doctor_departments"] : [];
    return mapDoctor(row, links[0]?.departments);
  });
}

export async function getDoctor(slug: string) {
  const selection = usesProductionContract ? "*, doctor_departments(departments(id,name,slug))" : "*, department:departments(id,name,slug)";
  const row = one(await published(db.from("doctors").select(selection).eq("slug", slug)).maybeSingle());
  if (!row) return null;
  const links = Array.isArray(row["doctor_departments"]) ? row["doctor_departments"] : [];
  const doctor = mapDoctor(row, links[0]?.departments);
  if (!usesProductionContract) {
    const [serviceResult, reviewResult, mediaResult] = await Promise.all([
      db.from("professional_service_doctors").select("professional_services(*)").eq("doctor_id", doctor.id),
      db.from("reviews").select("*").eq("doctor_id", doctor.id).eq("show_publicly", true).order("display_order"),
      db.from("media_doctors").select("media_items(*)").eq("doctor_id", doctor.id),
    ]);
    return {
      doctor,
      services: rows(serviceResult).map((item) => item["professional_services"]).filter(Boolean).map(mapService).filter((item) => item.status === "published"),
      reviews: rows(reviewResult).map(mapReview),
      media: rows(mediaResult).map((item) => item["media_items"]).filter(Boolean).map(mapMedia).filter((item) => item.status === "published"),
    };
  }
  const [serviceResult, reviewResult] = await Promise.all([
    db.from("doctor_services").select("services(*)").eq("doctor_id", doctor.id),
    db.from("reviews").select("*").eq("doctor_id", doctor.id).eq("status", "published").order("display_order"),
  ]);
  return {
    doctor,
    services: rows(serviceResult).map((item) => item["services"]).filter(Boolean).map(mapService).filter((item) => item.status === "published"),
    reviews: rows(reviewResult).map(mapReview),
    media: [] as MediaItem[],
  };
}

export async function listServices(): Promise<Service[]> {
  if (usesProductionContract) return rows(await order(published(db.from("services").select("*")))).map(mapService);
  const [professional, hospital] = await Promise.all([
    order(published(db.from("professional_services").select("*"))),
    order(published(db.from("hospital_services").select("*"))),
  ]);
  return [...rows(professional), ...rows(hospital)].map(mapService);
}

export async function listProfessionalServices(): Promise<Service[]> {
  if (usesProductionContract) return listServices();
  return rows(await order(published(db.from("professional_services").select("*")))).map(mapService);
}

export async function listHospitalServices(): Promise<Service[]> {
  if (usesProductionContract) return [];
  return rows(await order(published(db.from("hospital_services").select("*")))).map(mapService);
}

async function getServiceRecord(slug: string, legacyKind: "professional" | "hospital") {
  const table = usesProductionContract ? "services" : legacyKind === "professional" ? "professional_services" : "hospital_services";
  const service = one(await published(db.from(table).select("*").eq("slug", slug)).maybeSingle());
  if (!service) return null;
  const mapped = mapService(service);
  if (legacyKind === "hospital") return { service: mapped, departments: [] as Department[], doctors: [] as Doctor[] };
  if (!usesProductionContract) {
    const [departments, doctors] = await Promise.all([
      db.from("professional_service_departments").select("departments(*)").eq("professional_service_id", mapped.id),
      db.from("professional_service_doctors").select("doctors(*, department:departments(id,name,slug))").eq("professional_service_id", mapped.id),
    ]);
    return {
      service: mapped,
      departments: rows(departments).map((item) => item["departments"]).filter(Boolean).map(mapDepartment).filter((item) => item.status === "published"),
      doctors: rows(doctors).map((item) => item["doctors"]).filter(Boolean).map((item) => mapDoctor(item)).filter((item) => item.status === "published"),
    };
  }
  const [departmentLinks, doctorLinks] = await Promise.all([
    db.from("department_services").select("departments(*)").eq("service_id", mapped.id),
    db.from("doctor_services").select("doctors(*, doctor_departments(departments(id,name,slug)))").eq("service_id", mapped.id),
  ]);
  return {
    service: mapped,
    departments: rows(departmentLinks).map((item) => item["departments"]).filter(Boolean).map(mapDepartment).filter((item) => item.status === "published"),
    doctors: rows(doctorLinks).map((item) => item["doctors"]).filter(Boolean).map((item) => mapDoctor(item, item["doctor_departments"]?.[0]?.departments)).filter((item) => item.status === "published"),
  };
}

export async function listFacilities(): Promise<Facility[]> {
  return rows(await order(published(db.from("facilities").select("*")))).map(mapFacility);
}

export async function getFacility(slug: string) {
  const facility = one(await published(db.from("facilities").select("*").eq("slug", slug)).maybeSingle());
  if (!facility) return null;
  if (usesProductionContract) return { facility: mapFacility(facility), doctors: [], departments: [], professionalServices: [], hospitalServices: [] };
  const [doctors, departments, professional, hospital] = await Promise.all([
    db.from("facility_doctors").select("doctors(*, department:departments(id,name,slug))").eq("facility_id", facility["id"]),
    db.from("facility_departments").select("departments(*)").eq("facility_id", facility["id"]),
    db.from("facility_professional_services").select("professional_services(*)").eq("facility_id", facility["id"]),
    db.from("facility_hospital_services").select("hospital_services(*)").eq("facility_id", facility["id"]),
  ]);
  return {
    facility: mapFacility(facility),
    doctors: rows(doctors).map((item) => item["doctors"]).filter(Boolean).map((item) => mapDoctor(item)).filter((item) => item.status === "published"),
    departments: rows(departments).map((item) => item["departments"]).filter(Boolean).map(mapDepartment).filter((item) => item.status === "published"),
    professionalServices: rows(professional).map((item) => item["professional_services"]).filter(Boolean).map(mapService).filter((item) => item.status === "published"),
    hospitalServices: rows(hospital).map((item) => item["hospital_services"]).filter(Boolean).map(mapService).filter((item) => item.status === "published"),
  };
}

export async function listMedia(homeOnly = false): Promise<MediaItem[]> {
  const table = usesProductionContract ? "media_content" : "media_items";
  let query = published(db.from(table).select("*"));
  if (homeOnly) query = query.eq(usesProductionContract ? "show_on_homepage" : "show_on_home", true);
  return rows(await order(query)).map(mapMedia);
}

export async function listFaqs(): Promise<{ categories: FaqCategory[]; faqs: Faq[] }> {
  if (usesProductionContract) {
    const faqs = rows(await order(published(db.from("faqs").select("*")))).map(mapFaq);
    const names = [...new Set(faqs.map((item) => item.category).filter((item): item is string => Boolean(item)))];
    return { categories: names.map((name) => ({ id: name, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") })), faqs };
  }
  const [categoryResult, faqResult] = await Promise.all([
    order(published(db.from("faq_categories").select("*"))),
    order(published(db.from("faqs").select("*"))),
  ]);
  const categories = rows(categoryResult).map((row) => ({ id: String(row["id"]), name: String(row["name"]), slug: String(row["slug"]) }));
  const faqs = rows(faqResult).map((row) => ({ ...mapFaq(row), category: categories.find((item) => item.id === row["category_id"])?.name ?? null }));
  return { categories, faqs };
}

export async function listReviews(): Promise<Review[]> {
  let query = db.from("reviews").select(usesProductionContract ? "*, doctor:doctors(full_name,slug)" : "*, doctor:doctors(name,slug)");
  query = usesProductionContract ? query.eq("status", "published") : query.eq("show_publicly", true);
  return rows(await order(query)).map(mapReview).filter((item) => !item.rating || (item.rating >= 1 && item.rating <= 5));
}

export async function listBlogPosts(): Promise<BlogPost[]> {
  if (!backendFeatures.blog) return [];
  return rows(await db.from("blog_posts").select("*, category:blog_categories(name,slug), author:blog_authors(name,slug)").eq("status", "published").order("published_at", { ascending: false })) as BlogPost[];
}

export async function getBlogPost(slug: string): Promise<{ post: BlogPost; doctors: { name: string; slug: string }[] } | null> {
  if (!backendFeatures.blog) return null;
  const post = one(await db.from("blog_posts").select("*, category:blog_categories(name,slug), author:blog_authors(name,slug,bio), reviewer:doctors!blog_posts_clinical_reviewer_id_fkey(name,slug)").eq("slug", slug).eq("status", "published").maybeSingle());
  if (!post) return null;
  const related = rows(await db.from("blog_post_doctors").select("doctors(name,slug,published)").eq("post_id", post["id"]));
  return { post: post as BlogPost, doctors: related.map((item) => item["doctors"]).filter((item) => item?.published === true) };
}

export async function getProfessionalService(slug: string) {
  return getServiceRecord(slug, "professional");
}

export async function getHospitalService(slug: string): Promise<Service | null> {
  const result = await getServiceRecord(slug, "hospital");
  return result?.service ?? null;
}

export async function getEnquiryOptions() {
  if (usesProductionContract) {
    const [doctors, departments, services] = await Promise.all([
      published(db.from("doctors").select("id,full_name,slug,whatsapp")).order("full_name"),
      published(db.from("departments").select("id,name")).order("name"),
      published(db.from("services").select("id,name,title")).order("name"),
    ]);
    return {
      doctors: rows(doctors).map((row) => ({ id: String(row["id"]), name: String(row["full_name"]), slug: String(row["slug"]), whatsapp_number: row["whatsapp"] ?? null })),
      departments: rows(departments).map((row) => ({ id: String(row["id"]), name: String(row["name"]) })),
      services: rows(services).map((row) => ({ id: String(row["id"]), name: String(row["title"] ?? row["name"]) })),
    };
  }
  const [doctors, departments, professional, hospital] = await Promise.all([
    published(db.from("doctors").select("id,name,slug,whatsapp_number")).order("name"),
    published(db.from("departments").select("id,name")).order("name"),
    published(db.from("professional_services").select("id,title")).order("title"),
    published(db.from("hospital_services").select("id,title")).order("title"),
  ]);
  return {
    doctors: rows(doctors).map((row) => ({ id: String(row["id"]), name: String(row["name"]), slug: String(row["slug"]), whatsapp_number: row["whatsapp_number"] ?? null })),
    departments: rows(departments).map((row) => ({ id: String(row["id"]), name: String(row["name"]) })),
    services: [...rows(professional), ...rows(hospital)].map((row) => ({ id: String(row["id"]), name: String(row["title"]) })),
  };
}

export type NewEnquiry = {
  id: string;
  patientName: string;
  contactNumber: string;
  registeredContactNumber: string | null;
  familyMemberName: string | null;
  preferredDoctorId: string | null;
  preferredDepartmentId: string | null;
  preferredServiceId: string | null;
  preferredAt: string | null;
  message: string | null;
  source: string;
};

export async function submitEnquiry(input: NewEnquiry): Promise<void> {
  if (usesProductionContract) {
    const { error } = await db.from("appointment_enquiries").insert({
      id: input.id,
      patient_name: input.patientName,
      contact_number: input.contactNumber,
      registered_contact_number: input.registeredContactNumber,
      preferred_doctor_id: input.preferredDoctorId,
      preferred_department_id: input.preferredDepartmentId,
      preferred_service_id: input.preferredServiceId,
      preferred_at: input.preferredAt,
      message: input.message,
      source: input.source,
      status: "new",
    });
    if (error) throw classifyDataError(error);
    return;
  }
  const { error } = await db.from("enquiries").insert({
    id: input.id,
    patient_name: input.patientName,
    contact_number: input.contactNumber,
    family_member_name: input.familyMemberName,
    doctor_id: input.preferredDoctorId,
    department_id: input.preferredDepartmentId,
    professional_service_id: input.preferredServiceId,
    hospital_service_id: null,
    preferred_at: input.preferredAt,
    message: input.message,
    source: input.source,
    status: "pending_forwarding",
  });
  if (error) throw classifyDataError(error);
}

export function unavailableFeature(name: string): never {
  throw new DataAccessError("unavailable", `${name} is pending backend support.`);
}
