import { describe, expect, it } from "vitest";
import { corePhrase, evaluateCoverage, groupCoverage, type CoverageContext } from "./coverage";
import type { SeoEntity, SeoTargetKeyword } from "./types";

function entity(partial: Partial<SeoEntity> & Pick<SeoEntity, "type" | "id" | "label">): SeoEntity {
  return {
    path: `/x/${partial.id}`,
    published: true,
    heading: partial.label,
    seoTitle: null,
    metaDescription: null,
    canonicalUrl: null,
    indexable: true,
    images: [],
    internalLinks: 0,
    fields: [],
    ...partial,
  };
}

function target(partial: Partial<SeoTargetKeyword>): SeoTargetKeyword {
  return {
    id: "t1",
    keyword: "dental implants",
    normalized: "dental implants",
    keywordType: "service",
    searchIntent: "commercial",
    priority: "primary",
    targetUrl: null,
    targetEntityType: null,
    departmentId: null,
    professionalServiceId: null,
    hospitalServiceId: null,
    websitePageId: null,
    doctorId: null,
    locationId: null,
    blogPostId: null,
    status: "active",
    notes: null,
    updatedAt: "",
    ...partial,
  };
}

const implants = entity({
  type: "professional_service",
  id: "ps1",
  label: "Dental Implants",
  path: "/services/professional/dental-implants",
  metaDescription: "Dental implants to replace missing teeth.",
  fields: [
    { field: "title", label: "Service name", value: "Dental Implants" },
    { field: "description", label: "Description", value: "We place dental implants at our Ulwe hospital." },
  ],
});
const ulwe = { id: "loc1", name: "Ulwe Hospital", terms: ["ulwe hospital", "navi mumbai", "ulwe"] };
const doctor = entity({
  type: "doctor",
  id: "d1",
  label: "Dr. Rao",
  path: "/doctors/rao",
  seoTitle: "Dr. Rao — Dental implants specialist",
  fields: [{ field: "bio", label: "Biography", value: "Dr. Rao focuses on dental implants." }],
});
const locationEntity = entity({
  type: "location",
  id: "loc1",
  label: "Ulwe Hospital",
  path: "/contact",
  heading: "Ulwe Hospital",
  fields: [{ field: "address", label: "Address", value: "Sector 5, Ulwe, Navi Mumbai" }],
});

function ctx(extra: Partial<CoverageContext> = {}): CoverageContext {
  return {
    entities: [implants, doctor, locationEntity],
    targets: [],
    locations: [ulwe],
    doctorLocations: [],
    siteOrigin: "https://example.com",
    ...extra,
  };
}

const service = { targetEntityType: "professional_service" as const, professionalServiceId: "ps1" };

describe("evaluateCoverage", () => {
  it("no target → Needs Setup", () => {
    expect(evaluateCoverage(target({}), ctx()).status).toBe("needs_setup");
  });

  it("missing target record → Needs Setup", () => {
    const r = evaluateCoverage(target({ ...service, professionalServiceId: "gone" }), ctx());
    expect(r.status).toBe("needs_setup");
    expect(r.evidence.find((e) => e.key === "target_resolved")?.result).toBe("fail");
  });

  it("unpublished target → Not Covered", () => {
    const r = evaluateCoverage(target(service), ctx({ entities: [{ ...implants, published: false }] }));
    expect(r.status).toBe("not_covered");
  });

  it("published target with heading + body → Covered", () => {
    const r = evaluateCoverage(target(service), ctx());
    expect(r.status).toBe("covered");
    expect(r.evidence.find((e) => e.key === "heading_match")?.result).toBe("pass");
    expect(r.evidence.find((e) => e.key === "body_match")?.result).toBe("pass");
    expect(r.evidence.find((e) => e.key === "title_match")?.result).toBe("not_applicable");
  });

  it("title match counts for doctors", () => {
    const r = evaluateCoverage(target({ targetEntityType: "doctor", doctorId: "d1" }), ctx());
    expect(r.evidence.find((e) => e.key === "title_match")?.result).toBe("pass");
    expect(r.evidence.find((e) => e.key === "heading_match")?.result).toBe("fail");
    expect(r.status).toBe("covered");
  });

  it("body only → Partially Covered", () => {
    const page = entity({
      type: "page",
      id: "p1",
      label: "About",
      path: "/about",
      seoTitle: "About us",
      fields: [{ field: "body", label: "Body", value: "We offer dental implants." }],
    });
    const r = evaluateCoverage(target({ targetEntityType: "website_page", websitePageId: "p1" }), ctx({ entities: [page] }));
    expect(r.status).toBe("partially_covered");
    expect(r.recommendations.length).toBeGreaterThan(0);
  });

  it("phrase absent → Not Covered", () => {
    const r = evaluateCoverage(target({ ...service, keyword: "root canal" }), ctx());
    expect(r.status).toBe("not_covered");
  });

  it("service + location: core phrase and text location evidence", () => {
    const r = evaluateCoverage(
      target({ ...service, keyword: "dental implants in Ulwe", locationId: "loc1" }),
      ctx(),
    );
    expect(r.corePhrase).toBe("dental implants");
    const loc = r.evidence.find((e) => e.key === "location_match");
    expect(loc?.result).toBe("pass");
    expect(loc?.detail).toContain("text evidence");
    expect(r.status).toBe("covered");
  });

  it("location match fails when the page never mentions the location", () => {
    const r = evaluateCoverage(
      target({ ...service, keyword: "dental implants in Ulwe", locationId: "loc1" }),
      ctx({ entities: [{ ...implants, fields: [{ field: "description", label: "D", value: "dental implants" }] }] }),
    );
    expect(r.evidence.find((e) => e.key === "location_match")?.result).toBe("fail");
    expect(r.status).toBe("review_needed");
  });

  it("different unknown places stay different targets", () => {
    expect(corePhrase("dental implants in Vashi", ulwe)).toBe("dental implants in vashi");
    expect(corePhrase("dental implants in Sanpada", ulwe)).toBe("dental implants in sanpada");
  });

  it("doctor + location uses the real doctor_locations link", () => {
    const r = evaluateCoverage(
      target({ targetEntityType: "doctor", doctorId: "d1", keyword: "dental implants Ulwe", locationId: "loc1" }),
      ctx({ doctorLocations: [{ doctorId: "d1", locationId: "loc1" }] }),
    );
    const loc = r.evidence.find((e) => e.key === "location_match");
    expect(loc?.result).toBe("pass");
    expect(loc?.detail).toContain("linked");
  });

  it("location target", () => {
    const r = evaluateCoverage(
      target({ targetEntityType: "location", locationId: "loc1", keyword: "hospital in Ulwe" }),
      ctx(),
    );
    expect(r.evidence.find((e) => e.key === "location_match")?.result).toBe("pass");
    expect(r.entity?.type).toBe("location");
  });

  it("target URL mismatch → Review Needed", () => {
    const r = evaluateCoverage(target({ ...service, targetUrl: "/doctors/rao" }), ctx());
    expect(r.evidence.find((e) => e.key === "entity_match")?.result).toBe("warn");
    expect(r.status).toBe("review_needed");
  });

  it("matching absolute site URL is accepted", () => {
    const r = evaluateCoverage(
      target({ ...service, targetUrl: "https://example.com/services/professional/dental-implants/" }),
      ctx(),
    );
    expect(r.evidence.find((e) => e.key === "entity_match")?.result).toBe("pass");
  });

  it("noindex → Review Needed", () => {
    const r = evaluateCoverage(
      target({ targetEntityType: "doctor", doctorId: "d1" }),
      ctx({ entities: [{ ...doctor, indexable: false }] }),
    );
    expect(r.status).toBe("review_needed");
  });

  it("targeting conflict: duplicate target pointing elsewhere", () => {
    const other = target({ id: "t2", keyword: "Dental implants", targetEntityType: "doctor", doctorId: "d1" });
    const mine = target(service);
    const r = evaluateCoverage(mine, ctx({ targets: [mine, other] }));
    expect(r.conflicts.some((c) => c.kind === "duplicate_target")).toBe(true);
    expect(r.status).toBe("review_needed");
  });

  it("targeting conflict: a stronger page features the phrase", () => {
    const weak = entity({
      type: "page",
      id: "p1",
      label: "Smile care",
      path: "/smile",
      seoTitle: "Smile care",
      fields: [{ field: "body", label: "Body", value: "dental implants" }],
    });
    const r = evaluateCoverage(
      target({ targetEntityType: "website_page", websitePageId: "p1" }),
      ctx({ entities: [weak, implants] }),
    );
    expect(r.conflicts.some((c) => c.kind === "stronger_page")).toBe(true);
    expect(r.status).toBe("review_needed");
  });

  it("external URL: resolved, not content-checkable", () => {
    const r = evaluateCoverage(target({ ...service, targetUrl: "https://other.org/implants" }), ctx());
    expect(r.evidence.find((e) => e.key === "target_resolved")?.result).toBe("pass");
    expect(r.evidence.find((e) => e.key === "body_match")?.result).toBe("not_applicable");
    expect(r.status).toBe("review_needed");
  });

  it("hospital service target", () => {
    const hs = entity({
      type: "hospital_service",
      id: "hs1",
      label: "24x7 Pharmacy",
      path: "/services/hospital/pharmacy",
      fields: [{ field: "description", label: "Description", value: "Our 24x7 pharmacy is open all day." }],
    });
    const r = evaluateCoverage(
      target({ keyword: "24x7 pharmacy", targetEntityType: "hospital_service", hospitalServiceId: "hs1" }),
      ctx({ entities: [hs] }),
    );
    expect(r.status).toBe("covered");
  });

  it("groups by primary target and excludes paused keywords from gaps", () => {
    const a = evaluateCoverage(target({ ...service, keyword: "root canal", status: "paused" }), ctx());
    const b = evaluateCoverage(target({ ...service, id: "t2", keyword: "root canal" }), ctx());
    const [group] = groupCoverage([a, b], "professional_service");
    expect(group?.counts.total).toBe(2);
    expect(group?.gaps).toBe(1);
  });
});
