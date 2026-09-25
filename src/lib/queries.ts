import { queryOptions } from "@tanstack/react-query";
import {
  getBlogPost,
  getDepartment,
  getDoctor,
  getEnquiryOptions,
  getFacility,
  getHospitalService,
  getProfessionalService,
  listBlogPosts,
  listDepartments,
  listDoctors,
  listFacilities,
  listFaqs,
  listHospitalServices,
  listMedia,
  listProfessionalServices,
  listReviews,
} from "@/lib/data/repository";
export type {
  BlogPost,
  Department,
  Doctor as DoctorRow,
  Doctor as DoctorWithDepartment,
  Facility as FacilityRow,
  Faq as FaqRow,
  FaqCategory,
  MediaItem,
  Review as ReviewRow,
  Service as HospitalService,
  Service as ProfessionalService,
} from "@/lib/data/models";

export const departmentsQuery = queryOptions({
  queryKey: ["departments"],
  queryFn: listDepartments,
});
export const departmentQuery = (slug: string, preview = false) =>
  queryOptions({ queryKey: ["department", slug, preview], queryFn: () => getDepartment(slug, preview) });
export const doctorsQuery = queryOptions({ queryKey: ["doctors"], queryFn: listDoctors });
export const doctorQuery = (slug: string, preview = false) =>
  queryOptions({ queryKey: ["doctor", slug, preview], queryFn: () => getDoctor(slug, preview) });
export const professionalServicesQuery = queryOptions({
  queryKey: ["professional-services"],
  queryFn: listProfessionalServices,
});
export const hospitalServicesQuery = queryOptions({
  queryKey: ["hospital-services"],
  queryFn: listHospitalServices,
});
export const professionalServiceQuery = (slug: string) =>
  queryOptions({
    queryKey: ["professional-service", slug],
    queryFn: () => getProfessionalService(slug),
  });
export const hospitalServiceQuery = (slug: string) =>
  queryOptions({ queryKey: ["hospital-service", slug], queryFn: () => getHospitalService(slug) });
export const facilitiesQuery = queryOptions({ queryKey: ["facilities"], queryFn: listFacilities });
export const facilityQuery = (slug: string) =>
  queryOptions({ queryKey: ["facility", slug], queryFn: () => getFacility(slug) });
export const mediaQuery = (options?: { homeOnly?: boolean }) =>
  queryOptions({
    queryKey: ["media", options?.homeOnly ?? false],
    queryFn: () => listMedia(options?.homeOnly),
  });
export const faqQuery = queryOptions({ queryKey: ["faqs"], queryFn: listFaqs });
export const reviewsQuery = queryOptions({ queryKey: ["reviews"], queryFn: listReviews });
export const blogPostsQuery = queryOptions({ queryKey: ["blog-posts"], queryFn: listBlogPosts });
export const blogPostQuery = (slug: string) =>
  queryOptions({ queryKey: ["blog-post", slug], queryFn: () => getBlogPost(slug) });
export const enquiryOptionsQuery = queryOptions({
  queryKey: ["enquiry-options"],
  queryFn: getEnquiryOptions,
});
