import orthoHero from "@/assets/dept-ortho-hero.jpg";
import orthoFacility from "@/assets/dept-ortho-facility.jpg";

/**
 * TEMPORARY design-review content for Department Page V1.
 * Nothing here is stored in the database. Each block is shown only until the
 * Department CMS provides the equivalent field, and is replaceable per slug.
 */
export type DepartmentPresentation = {
  headline: [string, string];
  /** Hero headline lines, broken intentionally for the editorial layout. */
  heroLines: string[];
  lead: string;
  introHeading: string;
  highlights: { title: string; text: string }[];
  careIntro: string;
  careAreas: { title: string; text: string }[];
  conditions: string[];
  facilityText: string;
  facilityPoints: string[];
  heroImage: string;
  facilityImage: string;
};

const orthopedics: DepartmentPresentation = {
  headline: ["Advanced care for", "bones, joints & movement."],
  heroLines: ["Advanced", "care for", "bones, joints", "& movement."],
  lead: "Comprehensive orthopedic care focused on diagnosis, treatment, recovery and long-term mobility.",
  introHeading: "Orthopedic care designed around movement, recovery and quality of life.",
  highlights: [
    { title: "Advanced Diagnosis", text: "Careful assessment to understand the cause, not only the symptom." },
    { title: "Specialist-Led Care", text: "Treatment plans guided by orthopedic specialists." },
    { title: "Modern Surgical Support", text: "Access to hospital surgical and inpatient services when needed." },
    { title: "Personalized Recovery", text: "Rehabilitation guidance shaped around each patient's goals." },
  ],
  careIntro:
    "From everyday musculoskeletal concerns to complex orthopedic conditions, our specialists provide coordinated care across the treatment journey.",
  careAreas: [
    { title: "Joint Replacement", text: "Assessment and care for advanced hip and knee joint conditions." },
    { title: "Sports Injuries", text: "Diagnosis and treatment for injuries from sport and active lifestyles." },
    { title: "Spine Care", text: "Evaluation of back and neck conditions affecting daily movement." },
    { title: "Trauma & Fracture Care", text: "Care for fractures and injuries to bones and joints." },
    { title: "Arthroscopy", text: "Minimally invasive joint procedures where clinically appropriate." },
    { title: "Paediatric Orthopedics", text: "Bone and joint care adapted for children and adolescents." },
  ],
  conditions: [
    "Arthritis",
    "Fractures",
    "Joint pain",
    "Sports injuries",
    "Ligament injuries",
    "Back & neck conditions",
    "Osteoporosis-related conditions",
    "Joint degeneration",
  ],
  facilityText:
    "Orthopedic patients are supported by the wider hospital environment — from consultation and assessment to procedures and recovery. Department-specific facility details will be published by the hospital team.",
  facilityPoints: ["Consultation & assessment", "Procedure support", "Recovery guidance"],
  heroImage: orthoHero,
  facilityImage: orthoFacility,
};

const bySlug: Record<string, DepartmentPresentation> = { orthopedics };

export function getDepartmentPresentation(slug: string): DepartmentPresentation | null {
  return bySlug[slug] ?? null;
}
