import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Department = Tables<"departments">;
export type DoctorRow = Tables<"doctors">;
export type ProfessionalService = Tables<"professional_services">;
export type HospitalService = Tables<"hospital_services">;
export type FacilityRow = Tables<"facilities">;
export type MediaItem = Tables<"media_items">;
export type FaqRow = Tables<"faqs">;
export type FaqCategory = Tables<"faq_categories">;
export type ReviewRow = Tables<"reviews">;
export type BlogPost = Tables<"blog_posts">;

export type DoctorWithDepartment = DoctorRow & { department: Pick<Department, "id" | "name" | "slug"> | null };

function unwrap<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data;
}

/* ---------------- Departments ---------------- */

export const departmentsQuery = queryOptions({
  queryKey: ["departments"],
  queryFn: async () =>
    unwrap(await supabase.from("departments").select("*").eq("published", true).order("display_order").order("name")),
});

export const departmentQuery = (slug: string) =>
  queryOptions({
    queryKey: ["department", slug],
    queryFn: async () => {
      const department = unwrap(
        await supabase.from("departments").select("*").eq("slug", slug).eq("published", true).maybeSingle(),
      );
      if (!department) return null;
      const doctors = unwrap(
        await supabase
          .from("doctors")
          .select("*, department:departments(id,name,slug)")
          .eq("department_id", department.id)
          .eq("published", true)
          .order("display_order"),
      );
      const services = unwrap(
        await supabase
          .from("professional_service_departments")
          .select("professional_services(*)")
          .eq("department_id", department.id),
      );
      return {
        department,
        doctors,
        services: services.map((row) => row.professional_services).filter((s): s is ProfessionalService => Boolean(s?.published)),
      };
    },
  });

/* ---------------- Doctors ---------------- */

export const doctorsQuery = queryOptions({
  queryKey: ["doctors"],
  queryFn: async () =>
    unwrap(
      await supabase
        .from("doctors")
        .select("*, department:departments(id,name,slug)")
        .eq("published", true)
        .order("display_order")
        .order("name"),
    ),
});

export const doctorQuery = (slug: string) =>
  queryOptions({
    queryKey: ["doctor", slug],
    queryFn: async () => {
      const doctor = unwrap(
        await supabase
          .from("doctors")
          .select("*, department:departments(id,name,slug)")
          .eq("slug", slug)
          .eq("published", true)
          .maybeSingle(),
      );
      if (!doctor) return null;
      const [services, reviews, media] = await Promise.all([
        supabase.from("professional_service_doctors").select("professional_services(*)").eq("doctor_id", doctor.id),
        supabase
          .from("reviews")
          .select("*")
          .eq("doctor_id", doctor.id)
          .eq("show_publicly", true)
          .order("display_order"),
        supabase.from("media_doctors").select("media_items(*)").eq("doctor_id", doctor.id),
      ]);
      return {
        doctor,
        services: unwrap(services)
          .map((row) => row.professional_services)
          .filter((s): s is ProfessionalService => Boolean(s?.published)),
        reviews: unwrap(reviews),
        media: unwrap(media)
          .map((row) => row.media_items)
          .filter((m): m is MediaItem => Boolean(m?.published)),
      };
    },
  });

/* ---------------- Services ---------------- */

export const professionalServicesQuery = queryOptions({
  queryKey: ["professional-services"],
  queryFn: async () =>
    unwrap(
      await supabase.from("professional_services").select("*").eq("published", true).order("display_order").order("title"),
    ),
});

export const hospitalServicesQuery = queryOptions({
  queryKey: ["hospital-services"],
  queryFn: async () =>
    unwrap(
      await supabase.from("hospital_services").select("*").eq("published", true).order("display_order").order("title"),
    ),
});

export const professionalServiceQuery = (slug: string) =>
  queryOptions({
    queryKey: ["professional-service", slug],
    queryFn: async () => {
      const service = unwrap(
        await supabase.from("professional_services").select("*").eq("slug", slug).eq("published", true).maybeSingle(),
      );
      if (!service) return null;
      const [departments, doctors] = await Promise.all([
        supabase.from("professional_service_departments").select("departments(*)").eq("professional_service_id", service.id),
        supabase
          .from("professional_service_doctors")
          .select("doctors(*, department:departments(id,name,slug))")
          .eq("professional_service_id", service.id),
      ]);
      return {
        service,
        departments: unwrap(departments)
          .map((row) => row.departments)
          .filter((d): d is Department => Boolean(d?.published)),
        doctors: unwrap(doctors)
          .map((row) => row.doctors)
          .filter((d): d is DoctorWithDepartment => Boolean(d?.published)),
      };
    },
  });

export const hospitalServiceQuery = (slug: string) =>
  queryOptions({
    queryKey: ["hospital-service", slug],
    queryFn: async () =>
      unwrap(await supabase.from("hospital_services").select("*").eq("slug", slug).eq("published", true).maybeSingle()),
  });

/* ---------------- Facilities ---------------- */

export const facilitiesQuery = queryOptions({
  queryKey: ["facilities"],
  queryFn: async () =>
    unwrap(await supabase.from("facilities").select("*").eq("published", true).order("display_order").order("name")),
});

export const facilityQuery = (slug: string) =>
  queryOptions({
    queryKey: ["facility", slug],
    queryFn: async () => {
      const facility = unwrap(
        await supabase.from("facilities").select("*").eq("slug", slug).eq("published", true).maybeSingle(),
      );
      if (!facility) return null;
      const [doctors, departments, professional, hospital] = await Promise.all([
        supabase.from("facility_doctors").select("doctors(*, department:departments(id,name,slug))").eq("facility_id", facility.id),
        supabase.from("facility_departments").select("departments(*)").eq("facility_id", facility.id),
        supabase.from("facility_professional_services").select("professional_services(*)").eq("facility_id", facility.id),
        supabase.from("facility_hospital_services").select("hospital_services(*)").eq("facility_id", facility.id),
      ]);
      return {
        facility,
        doctors: unwrap(doctors).map((r) => r.doctors).filter((d): d is DoctorWithDepartment => Boolean(d?.published)),
        departments: unwrap(departments).map((r) => r.departments).filter((d): d is Department => Boolean(d?.published)),
        professionalServices: unwrap(professional)
          .map((r) => r.professional_services)
          .filter((s): s is ProfessionalService => Boolean(s?.published)),
        hospitalServices: unwrap(hospital)
          .map((r) => r.hospital_services)
          .filter((s): s is HospitalService => Boolean(s?.published)),
      };
    },
  });

/* ---------------- Media ---------------- */

export const mediaQuery = (options?: { homeOnly?: boolean }) =>
  queryOptions({
    queryKey: ["media", options?.homeOnly ?? false],
    queryFn: async () => {
      let request = supabase.from("media_items").select("*").eq("published", true);
      if (options?.homeOnly) request = request.eq("show_on_home", true);
      return unwrap(await request.order("display_order").order("created_at", { ascending: false }));
    },
  });

/* ---------------- FAQ ---------------- */

export const faqQuery = queryOptions({
  queryKey: ["faqs"],
  queryFn: async () => {
    const [categories, faqs] = await Promise.all([
      supabase.from("faq_categories").select("*").eq("published", true).order("display_order"),
      supabase.from("faqs").select("*").eq("published", true).order("display_order"),
    ]);
    return { categories: unwrap(categories), faqs: unwrap(faqs) };
  },
});

/* ---------------- Reviews ---------------- */

export const reviewsQuery = queryOptions({
  queryKey: ["reviews"],
  queryFn: async () =>
    unwrap(
      await supabase
        .from("reviews")
        .select("*, doctor:doctors(name,slug)")
        .eq("show_publicly", true)
        .order("display_order")
        .order("reviewed_at", { ascending: false }),
    ),
});

/* ---------------- Blog ---------------- */

export const blogPostsQuery = queryOptions({
  queryKey: ["blog-posts"],
  queryFn: async () =>
    unwrap(
      await supabase
        .from("blog_posts")
        .select("*, category:blog_categories(name,slug), author:blog_authors(name,slug)")
        .eq("status", "published")
        .order("published_at", { ascending: false }),
    ),
});

export const blogPostQuery = (slug: string) =>
  queryOptions({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const post = unwrap(
        await supabase
          .from("blog_posts")
          .select("*, category:blog_categories(name,slug), author:blog_authors(name,slug,bio), reviewer:doctors!blog_posts_clinical_reviewer_id_fkey(name,slug)")
          .eq("slug", slug)
          .eq("status", "published")
          .maybeSingle(),
      );
      if (!post) return null;
      const related = unwrap(
        await supabase.from("blog_post_doctors").select("doctors(name,slug,published)").eq("post_id", post.id),
      );
      return {
        post,
        doctors: related.map((r) => r.doctors).filter((d): d is { name: string; slug: string; published: boolean } => Boolean(d?.published)),
      };
    },
  });

/* ---------------- Enquiry reference data ---------------- */

export const enquiryOptionsQuery = queryOptions({
  queryKey: ["enquiry-options"],
  queryFn: async () => {
    const [doctors, departments, professional, hospital] = await Promise.all([
      supabase.from("doctors").select("id,name,slug,whatsapp_number").eq("published", true).order("name"),
      supabase.from("departments").select("id,name").eq("published", true).order("name"),
      supabase.from("professional_services").select("id,title").eq("published", true).order("title"),
      supabase.from("hospital_services").select("id,title").eq("published", true).order("title"),
    ]);
    return {
      doctors: unwrap(doctors),
      departments: unwrap(departments),
      professionalServices: unwrap(professional),
      hospitalServices: unwrap(hospital),
    };
  },
});
