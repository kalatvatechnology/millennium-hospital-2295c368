/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Plus, Save, Trash2, Upload } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminError } from "@/components/admin/ui";
import {
  DoctorProfileSections,
  type DoctorProfileSectionsHandle,
  type DoctorProfileTab,
} from "@/components/admin/doctor-profile-sections";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAdminSession } from "@/hooks/use-admin-session";
import { contentTypeByKey, deleteRecord, saveRecord } from "@/lib/admin-content";
import { userFacingDataError } from "@/lib/data/errors";
import { supabase } from "@/integrations/supabase/client";
import { InlineDelete } from "@/components/admin/workspace";

const db = supabase as any;
const doctorType = contentTypeByKey("doctors");
const sections = [
  ["profile", "Profile"],
  ["hero", "Hero & Statistics"],
  ["specializations", "Specializations"],
  ["services", "Services"],
  ["experience", "Experience"],
  ["education", "Education"],
  ["achievements", "Achievements & Memberships"],
  ["locations", "Locations"],
  ["social-media", "Social Media"],
  ["media", "Media"],
  ["reviews", "Reviews"],
  ["faqs", "FAQs"],
  ["seo", "SEO"],
  ["publishing", "Publishing"],
] as const;
type SectionKey = (typeof sections)[number][0];
const sectionKeys = new Set<string>(sections.map(([key]) => key));
const socialPlatforms = ["Instagram", "Facebook", "LinkedIn", "YouTube", "X / Twitter", "Other"];
const countryCodes = [
  ["+91", "India (+91)"],
  ["+1", "United States / Canada (+1)"],
  ["+44", "United Kingdom (+44)"],
  ["+971", "United Arab Emirates (+971)"],
  ["+61", "Australia (+61)"],
] as const;
const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

type SocialRow = { id: string; platform: string; url: string; enabled: boolean };
const blankDoctor = () => ({
  name: "",
  slug: "",
  professional_registration_no: "",
  department_id: null,
  specialty: "",
  designation: "",
  qualifications: [],
  short_introduction: "",
  bio: "",
  phone_number: "",
  phone_country_code: "",
  whatsapp_number: "",
  whatsapp_country_code: "",
  photo_url: "",
  profile_image_alt: "",
  hero_image_url: "",
  hero_image_alt: "",
  quote: "",
  quote_attribution: "",
  social_links: {},
  seo_title: "",
  seo_description: "",
  canonical_url: "",
  og_image_url: "",
  verification_status: "unverified",
  display_order: 0,
  published: false,
});
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function DoctorWorkspace() {
  const { doctorId, section: rawSection } = useParams({
    from: "/_admin/doctors/$doctorId/$section",
  });
  const section: SectionKey = sectionKeys.has(rawSection) ? (rawSection as SectionKey) : "profile";
  const isNew = doctorId === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = useAdminSession();
  const canWrite = can("content.write");
  const canPublish = can("content.publish");
  const detailRef = useRef<DoctorProfileSectionsHandle>(null);
  const query = useQuery({
    queryKey: ["admin-doctor", doctorId],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await db.from("doctors").select("*").eq("id", doctorId).single();
      if (error) throw error;
      return data as any;
    },
  });
  const departments = useQuery({
    queryKey: ["doctor-workspace-departments"],
    queryFn: async () => {
      const { data, error } = await db.from("departments").select("id,name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const media = useQuery({
    queryKey: ["doctor-workspace-image-options"],
    queryFn: async () => {
      const { data, error } = await db
        .from("media_items")
        .select("id,title,thumbnail_url,url")
        .order("title");
      if (error) throw error;
      return data ?? [];
    },
  });
  const socialQuery = useQuery({
    queryKey: ["doctor-social-links", doctorId],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await db
        .from("doctor_social_links")
        .select("id,platform,url,enabled")
        .eq("doctor_id", doctorId)
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });
  const [values, setValues] = useState<any>(blankDoctor());
  const [baseline, setBaseline] = useState<any>(blankDoctor());
  const [social, setSocial] = useState<SocialRow[]>([]);
  const [socialBaseline, setSocialBaseline] = useState<SocialRow[]>([]);
  const [detailReset, setDetailReset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [slugIsAutomatic, setSlugIsAutomatic] = useState(isNew);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  useEffect(() => {
    const next = isNew ? blankDoctor() : query.data;
    if (!next) return;
    const prepared = clone(next);
    setValues(prepared);
    setBaseline(clone(prepared));
    setSlugIsAutomatic(isNew);
    const links = socialQuery.data?.length
      ? socialQuery.data
      : Object.entries((prepared.social_links ?? {}) as Record<string, string>).map(
          ([platform, url], index) => ({
            id: `new-${index}-${platform}`,
            platform,
            url,
            enabled: true,
          }),
        );
    setSocial(links);
    setSocialBaseline(clone(links));
  }, [isNew, query.data, socialQuery.data]);
  const title = isNew ? "New doctor" : values.name || "Doctor workspace";
  const detailTab =
    sectionKeys.has(section) && !["profile", "social-media", "seo", "publishing"].includes(section)
      ? (section as DoctorProfileTab)
      : null;
  const payload = () => ({
    ...values,
    qualifications:
      typeof values.qualifications === "string"
        ? values.qualifications
            .split(",")
            .map((item: string) => item.trim())
            .filter(Boolean)
        : values.qualifications,
    social_links: Object.fromEntries(
      social
        .filter((item) => item.enabled && item.url.trim())
        .map((item) => [
          item.platform
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_"),
          item.url.trim(),
        ]),
    ),
    ...(canPublish ? {} : { published: baseline.published }),
  });
  const validateProfile = async () => {
    const issues: Record<string, string> = {};
    const name = String(values.name ?? "").trim();
    const slug = slugify(String(values.slug ?? ""));
    if (!name) issues["name"] = "Doctor name is required.";
    if (!slug) issues["slug"] = "A URL slug is required.";
    if (!values.department_id) issues["department_id"] = "Department is required.";
    if (!String(values.designation ?? "").trim())
      issues["designation"] = "Designation is required.";
    if (String(values.short_introduction ?? "").length > 100)
      issues["short_introduction"] = "Short introduction must be 100 characters or fewer.";
    if (String(values.bio ?? "").length > 500)
      issues["bio"] = "Biography must be 500 characters or fewer.";
    for (const key of ["phone_number", "whatsapp_number"] as const) {
      const number = String(values[key] ?? "").trim();
      if (number && !/^\d{6,15}$/.test(number))
        issues[key] = "Enter 6–15 digits without spaces or the country code.";
    }
    if (slug) {
      let slugQuery = db.from("doctors").select("id").eq("slug", slug).limit(1);
      if (!isNew) slugQuery = slugQuery.neq("id", doctorId);
      const { data, error: slugError } = await slugQuery;
      if (slugError) throw slugError;
      if (data?.length) {
        let suffix = 2;
        let candidate = `${slug}-${suffix}`;
        while (suffix < 100) {
          let candidateQuery = db.from("doctors").select("id").eq("slug", candidate).limit(1);
          if (!isNew) candidateQuery = candidateQuery.neq("id", doctorId);
          const { data: match, error: candidateError } = await candidateQuery;
          if (candidateError) throw candidateError;
          if (!match?.length) break;
          suffix += 1;
          candidate = `${slug}-${suffix}`;
        }
        issues["slug"] = `This slug is already used. Try “${candidate}”.`;
      }
    }
    setFieldErrors(issues);
    if (Object.keys(issues).length) throw new Error("Please correct the highlighted fields.");
  };
  const save = useMutation({
    mutationFn: async () => {
      if (!doctorType) throw new Error("Doctor content configuration is unavailable");
      if (section === "profile") await validateProfile();
      if (detailTab && !isNew) {
        await detailRef.current?.save();
        if (section !== "hero") return doctorId;
      }
      if (section === "social-media" && !isNew) {
        const { error: removeError } = await db
          .from("doctor_social_links")
          .delete()
          .eq("doctor_id", doctorId);
        if (removeError) throw removeError;
        const links = social
          .filter((item) => item.url.trim())
          .map((item, display_order) => ({
            doctor_id: doctorId,
            platform: item.platform
              .toLowerCase()
              .replace(/[^a-z]+/g, "_")
              .replace(/^x_twitter$/, "x"),
            url: item.url.trim(),
            enabled: item.enabled,
            display_order,
          }));
        if (links.length) {
          const { error: linkError } = await db.from("doctor_social_links").insert(links);
          if (linkError) throw linkError;
        }
      }
      const data = { ...payload(), slug: slugify(String(values.slug ?? "")) };
      if (isNew) {
        const { data: created, error: createError } = await db
          .from("doctors")
          .insert(data)
          .select("id")
          .single();
        if (createError) throw createError;
        return created.id as string;
      }
      await saveRecord(doctorType, doctorId, data);
      return doctorId;
    },
    onSuccess: (savedId) => {
      setError(null);
      setFieldErrors({});
      setSavedMessage("Draft saved.");
      setBaseline(clone(values));
      setSocialBaseline(clone(social));
      setDetailReset((current) => current + 1);
      void queryClient.invalidateQueries({ queryKey: ["admin-doctor", savedId] });
      void queryClient.invalidateQueries({ queryKey: ["doctor-profile-section"] });
      void queryClient.invalidateQueries({ queryKey: ["doctor-profile-relation"] });
      void queryClient.invalidateQueries({ queryKey: ["doctor-profile-reviews"] });
      void queryClient.invalidateQueries({ queryKey: ["doctor-profile-visibility"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-content", "doctors"] });
      if (isNew)
        void navigate({
          to: "/_admin/doctors/$doctorId/$section",
          params: { doctorId: savedId, section: "profile" },
          replace: true,
        });
    },
    onError: (cause: Error) => setError(cause.message || userFacingDataError(cause)),
  });
  const remove = useMutation({
    mutationFn: async () => {
      if (!doctorType) throw new Error("Doctor content configuration is unavailable");
      await deleteRecord(doctorType, doctorId, values.name);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-content", "doctors"] });
      void navigate({ to: "/_admin/doctors" });
    },
    onError: (cause: Error) => setError(userFacingDataError(cause)),
  });
  const cancel = () => {
    setValues(clone(baseline));
    setSocial(clone(socialBaseline));
    setDetailReset((current) => current + 1);
    setError(null);
  };
  const set = (name: string, value: any) =>
    setValues((current: Record<string, any>) => ({ ...current, [name]: value }));
  const setProfileValue = (name: string, value: string) => {
    setSavedMessage(null);
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setValues((current: Record<string, any>) => ({
      ...current,
      [name]: value,
      ...(name === "name" && slugIsAutomatic ? { slug: slugify(value) } : {}),
    }));
  };
  const imageOptions = useMemo(
    () =>
      (media.data ?? []).flatMap((item: any) =>
        item.thumbnail_url ? [{ value: item.thumbnail_url, label: item.title }] : [],
      ),
    [media.data],
  );

  return (
    <AdminShell
      title={title}
      description={
        isNew
          ? "Create the basic doctor record before adding related profile sections."
          : `Editing ${title}`
      }
      requires="content.write"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/_admin/doctors">
              <ArrowLeft className="size-4" /> Doctors
            </Link>
          </Button>
          {!isNew && values.slug ? (
            <Button asChild variant="outline">
              <a href={`/doctors/${values.slug}?preview=1`} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" /> Preview
              </a>
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="min-w-0">
          <div className="xl:hidden">
            <Label htmlFor="doctor-workspace-section">Editing section</Label>
            <Select
              value={section}
              onValueChange={(next) =>
                navigate({
                  to: "/_admin/doctors/$doctorId/$section",
                  params: { doctorId, section: next },
                })
              }
            >
              <SelectTrigger id="doctor-workspace-section" className="mt-2 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sections.map(([key, label]) => (
                  <SelectItem key={key} value={key} disabled={isNew && key !== "profile"}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <nav
            aria-label="Doctor sections"
            className="hidden rounded-md border border-border bg-background p-2 xl:block"
          >
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase text-muted-foreground">
              {title}
            </p>
            <ul className="grid gap-1">
              {sections.map(([key, label]) => (
                <li key={key}>
                  <Button
                    asChild
                    variant={section === key ? "secondary" : "ghost"}
                    className="h-auto w-full justify-start whitespace-normal text-left"
                    disabled={isNew && key !== "profile"}
                  >
                    <Link
                      to="/_admin/doctors/$doctorId/$section"
                      params={{ doctorId, section: key }}
                    >
                      {label}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <div className="min-w-0">
          {query.isPending && !isNew ? (
            <p className="text-muted-foreground">Loading doctor workspace…</p>
          ) : query.isError ? (
            <AdminError message={userFacingDataError(query.error)} />
          ) : (
            <>
              <SectionHeading section={section} />
              <AdminError message={error} />
              <div className="mt-6">
                {section === "profile" ? (
                  <div className="grid gap-5">
                    <ProfileGroup title="Professional identity">
                      <Field
                        name="professional_registration_no"
                        label="Professional Registration No."
                        kind="text"
                        value={values.professional_registration_no}
                        onChange={(value) => setProfileValue("professional_registration_no", value)}
                        help="Enter the official professional licence or registration number. This is not the internal record ID."
                      />
                      <Field
                        name="name"
                        label="Doctor Name *"
                        kind="text"
                        value={values.name}
                        onChange={(value) => setProfileValue("name", value)}
                        error={fieldErrors["name"]}
                      />
                      <Field
                        name="slug"
                        label="URL Slug *"
                        kind="text"
                        value={values.slug}
                        onChange={(value) => {
                          setSlugIsAutomatic(false);
                          setProfileValue("slug", slugify(value));
                        }}
                        error={fieldErrors["slug"]}
                        help={
                          values.slug
                            ? `/doctors/${values.slug}`
                            : "Generated from the doctor name and editable before saving."
                        }
                      />
                    </ProfileGroup>
                    <ProfileGroup title="Professional information">
                      <div>
                        <Label htmlFor="doctor-department">Department *</Label>
                        <Select
                          value={values.department_id || "none"}
                          onValueChange={(value) => {
                            set("department_id", value === "none" ? null : value);
                            setFieldErrors((current) => ({ ...current, department_id: "" }));
                          }}
                        >
                          <SelectTrigger id="doctor-department" className="mt-2">
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No department selected</SelectItem>
                            {(departments.data ?? []).map((item: any) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <InlineFieldError message={fieldErrors["department_id"]} />
                      </div>
                      <Field
                        name="designation"
                        label="Designation *"
                        kind="text"
                        value={values.designation}
                        onChange={(value) => setProfileValue("designation", value)}
                        error={fieldErrors["designation"]}
                      />
                      <Field
                        name="qualifications"
                        label="Higher Qualification"
                        kind="text"
                        value={
                          Array.isArray(values.qualifications)
                            ? values.qualifications.join(", ")
                            : values.qualifications
                        }
                        onChange={(value) => setProfileValue("qualifications", value)}
                      />
                      <Field
                        name="specialty"
                        label="Specialization"
                        kind="text"
                        value={values.specialty}
                        onChange={(value) => setProfileValue("specialty", value)}
                        help="Separate multiple specializations with commas."
                      />
                    </ProfileGroup>
                    <ProfileGroup title="Profile content">
                      <Field
                        name="short_introduction"
                        label="Short Introduction"
                        kind="textarea"
                        value={values.short_introduction}
                        onChange={(value) => setProfileValue("short_introduction", value)}
                        maxLength={100}
                        error={fieldErrors["short_introduction"]}
                        compact
                      />
                      <Field
                        name="bio"
                        label="Biography"
                        kind="textarea"
                        value={values.bio}
                        onChange={(value) => setProfileValue("bio", value)}
                        maxLength={500}
                        error={fieldErrors["bio"]}
                      />
                    </ProfileGroup>
                    <ProfileGroup title="Contact">
                      <PhoneField
                        label="Phone Number"
                        countryCode={values.phone_country_code ?? ""}
                        number={values.phone_number ?? ""}
                        onCountryCode={(value) => set("phone_country_code", value)}
                        onNumber={(value) =>
                          setProfileValue("phone_number", value.replace(/\D/g, "").slice(0, 15))
                        }
                        error={fieldErrors["phone_number"]}
                      />
                      <PhoneField
                        label="WhatsApp Number"
                        countryCode={values.whatsapp_country_code ?? ""}
                        number={values.whatsapp_number ?? ""}
                        onCountryCode={(value) => set("whatsapp_country_code", value)}
                        onNumber={(value) =>
                          setProfileValue("whatsapp_number", value.replace(/\D/g, "").slice(0, 15))
                        }
                        error={fieldErrors["whatsapp_number"]}
                      />
                    </ProfileGroup>
                    <ProfileGroup title="Profile image" singleColumn>
                      <ImageEditor
                        label="Profile image"
                        value={values.photo_url ?? ""}
                        alt={values.profile_image_alt ?? ""}
                        options={imageOptions}
                        ratio="4:5"
                        onValue={(value) => set("photo_url", value)}
                        onAlt={(value) => set("profile_image_alt", value)}
                        doctorName={values.name ?? ""}
                        designation={values.designation ?? ""}
                      />
                      {canWrite ? (
                        <p className="text-sm text-muted-foreground">
                          New uploads remain unavailable until public image delivery is approved.
                          Select an existing image above or save the profile without one.
                        </p>
                      ) : null}
                    </ProfileGroup>
                  </div>
                ) : null}
                {section === "hero" ? (
                  <div className="grid gap-6">
                    <ImageEditor
                      label="Hero image"
                      value={values.hero_image_url ?? ""}
                      alt={values.hero_image_alt ?? ""}
                      options={imageOptions}
                      ratio="Current profile header crop"
                      onValue={(value) => set("hero_image_url", value)}
                      onAlt={(value) => set("hero_image_alt", value)}
                    />
                    <Field
                      name="quote"
                      label="Doctor quote"
                      kind="textarea"
                      value={values.quote}
                      onChange={(value) => set("quote", value)}
                    />
                    <Field
                      name="quote_attribution"
                      label="Quote attribution"
                      kind="text"
                      value={values.quote_attribution}
                      onChange={(value) => set("quote_attribution", value)}
                    />
                    {!isNew ? (
                      <DoctorProfileSections
                        key={`hero-${detailReset}`}
                        ref={detailRef}
                        doctorId={doctorId}
                        activeTab="hero"
                      />
                    ) : null}
                  </div>
                ) : null}
                {detailTab && section !== "hero" && !isNew ? (
                  <DoctorProfileSections
                    key={`${detailTab}-${detailReset}`}
                    ref={detailRef}
                    doctorId={doctorId}
                    activeTab={detailTab}
                  />
                ) : null}
                {section === "social-media" ? (
                  <SocialEditor rows={social} onChange={setSocial} />
                ) : null}
                {section === "seo" ? (
                  <div className="grid gap-5">
                    <Field
                      name="seo_title"
                      label="SEO title"
                      kind="text"
                      value={values.seo_title}
                      onChange={(value) => set("seo_title", value)}
                    />
                    <Field
                      name="seo_description"
                      label="SEO description"
                      kind="textarea"
                      value={values.seo_description}
                      onChange={(value) => set("seo_description", value)}
                    />
                    <Field
                      name="canonical_url"
                      label="Canonical URL"
                      kind="text"
                      value={values.canonical_url}
                      onChange={(value) => set("canonical_url", value)}
                    />
                    <ImageEditor
                      label="Open Graph image"
                      value={values.og_image_url ?? ""}
                      alt=""
                      options={imageOptions}
                      ratio="Social sharing image"
                      onValue={(value) => set("og_image_url", value)}
                    />
                  </div>
                ) : null}
                {section === "publishing" ? (
                  <div className="grid max-w-2xl gap-5">
                    <div>
                      <Label htmlFor="verification">Verification</Label>
                      <Select
                        value={values.verification_status ?? "unverified"}
                        onValueChange={(value) => set("verification_status", value)}
                      >
                        <SelectTrigger id="verification" className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unverified">Needs verification</SelectItem>
                          <SelectItem value="pending">Pending verification</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Field
                      name="display_order"
                      label="Display order"
                      kind="number"
                      value={values.display_order}
                      onChange={(value) => set("display_order", Number(value))}
                    />
                    <label className="flex items-center gap-3 rounded-md border border-border p-4">
                      <Switch
                        checked={Boolean(values.published)}
                        disabled={!canPublish}
                        onCheckedChange={(checked) => set("published", checked)}
                      />
                      <span>
                        <span className="block font-medium">Published</span>
                        <span className="block text-sm text-muted-foreground">
                          {canPublish
                            ? "Controls public visibility."
                            : "Only an Editor, Admin, or Super Admin can change this."}
                        </span>
                      </span>
                    </label>
                  </div>
                ) : null}
                {section === "publishing" && !isNew && canWrite ? (
                  <div className="mt-8">
                    <InlineDelete
                      label="doctor profile"
                      description="This permanently removes the doctor and linked profile records. Media assets remain reusable."
                      busy={remove.isPending}
                      onConfirm={() => remove.mutate()}
                    />
                  </div>
                ) : null}
              </div>
              <div className="sticky bottom-0 mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-admin/95 py-4 backdrop-blur">
                {savedMessage ? (
                  <p className="mr-auto text-sm font-medium text-primary" role="status">
                    {savedMessage}
                  </p>
                ) : null}
                <Button type="button" variant="outline" onClick={cancel}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!canWrite || save.isPending}
                  onClick={() => save.mutate()}
                >
                  <Save className="size-4" />{" "}
                  {save.isPending ? "Saving…" : section === "profile" ? "Save Draft" : "Save"}
                </Button>
                {section === "profile" && !isNew ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!canWrite || save.isPending}
                    onClick={() =>
                      save.mutate(undefined, {
                        onSuccess: () =>
                          void navigate({
                            to: "/_admin/doctors/$doctorId/$section",
                            params: { doctorId, section: "hero" },
                          }),
                      })
                    }
                  >
                    Save &amp; Continue
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function SectionHeading({ section }: { section: SectionKey }) {
  const label = sections.find(([key]) => key === section)?.[1] ?? "Profile";
  return (
    <div className="border-b border-border pb-4">
      <p className="text-sm font-medium text-primary">Doctor workspace</p>
      <h2 className="mt-1 text-2xl font-semibold">{label}</h2>
    </div>
  );
}
function Field({
  name,
  label,
  kind,
  value,
  onChange,
  error,
  help,
  maxLength,
  compact,
}: {
  name: string;
  label: string;
  kind: string;
  value: any;
  onChange: (value: string) => void;
  error?: string | undefined;
  help?: string | undefined;
  maxLength?: number;
  compact?: boolean;
}) {
  const length = String(value ?? "").length;
  return (
    <div className={kind === "textarea" ? "lg:col-span-2" : ""}>
      <Label htmlFor={`doctor-${name}`}>{label}</Label>
      {kind === "textarea" ? (
        <Textarea
          id={`doctor-${name}`}
          className={compact ? "mt-2 min-h-20" : "mt-2 min-h-32"}
          value={value ?? ""}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          aria-describedby={`${name}-message`}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={`doctor-${name}`}
          className="mt-2"
          type={kind === "number" ? "number" : "text"}
          value={value ?? ""}
          aria-invalid={Boolean(error)}
          aria-describedby={`${name}-message`}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      <div id={`${name}-message`} className="mt-1 flex items-start justify-between gap-3 text-xs">
        <span className={error ? "text-destructive" : "text-muted-foreground"}>
          {error || help}
        </span>
        {maxLength ? (
          <span className="shrink-0 text-muted-foreground">
            {length} / {maxLength}
          </span>
        ) : null}
      </div>
    </div>
  );
}
function InlineFieldError({ message }: { message?: string | undefined }) {
  return message ? <p className="mt-1 text-xs text-destructive">{message}</p> : null;
}
function ProfileGroup({
  title,
  children,
  singleColumn = false,
}: {
  title: string;
  children: React.ReactNode;
  singleColumn?: boolean;
}) {
  return (
    <section className="rounded-md border border-border bg-background p-4 sm:p-5">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <div className={`mt-4 grid gap-5 ${singleColumn ? "" : "lg:grid-cols-2"}`}>{children}</div>
    </section>
  );
}
function PhoneField({
  label,
  countryCode,
  number,
  onCountryCode,
  onNumber,
  error,
}: {
  label: string;
  countryCode: string;
  number: string;
  onCountryCode: (value: string) => void;
  onNumber: (value: string) => void;
  error?: string | undefined;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(10rem,0.8fr)_minmax(0,1.2fr)]">
        <Select
          value={countryCode || "none"}
          onValueChange={(value) => onCountryCode(value === "none" ? "" : value)}
        >
          <SelectTrigger aria-label={`${label} country code`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select country code</SelectItem>
            {countryCodes.map(([value, text]) => (
              <SelectItem key={value} value={value}>
                {text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          aria-label={`${label} number`}
          inputMode="numeric"
          autoComplete="tel-national"
          value={number}
          aria-invalid={Boolean(error)}
          onChange={(event) => onNumber(event.target.value)}
          placeholder="Contact number"
        />
      </div>
      <InlineFieldError message={error} />
    </div>
  );
}
function ImageEditor({
  label,
  value,
  alt,
  options,
  ratio,
  onValue,
  onAlt,
  doctorName,
  designation,
  canUpload = false,
}: {
  label: string;
  value: string;
  alt: string;
  options: { value: string; label: string }[];
  ratio: string;
  onValue: (value: string) => void;
  onAlt?: (value: string) => void;
  doctorName?: string;
  designation?: string;
  canUpload?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestedAlt = [doctorName, designation, doctorName ? "at The Millennium Hospital" : ""]
    .filter(Boolean)
    .join(", ")
    .replace(", at", " at");
  const upload = async (file?: File) => {
    if (!file) return;
    setUploadError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Choose a JPG, JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("The image must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const extension =
        file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const filename = `${slugify(doctorName ?? "") || "doctor"}.${extension}`;
      const path = `${crypto.randomUUID()}/${filename}`;
      const { error } = await supabase.storage
        .from("doctor-profile-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("doctor-profile-images").getPublicUrl(path);
      if (!data.publicUrl) throw new Error("The uploaded image URL is unavailable.");
      onValue(data.publicUrl);
    } catch (cause) {
      setUploadError(userFacingDataError(cause));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  return (
    <section className="grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <div>
        <h3 className="font-semibold">{label}</h3>
        <p className="text-sm text-muted-foreground">
          Recommended aspect: {ratio}. JPG, JPEG, PNG, or WebP up to 5 MB.
        </p>
      </div>
      {value ? (
        <img
          src={value}
          alt={alt || `${label} preview`}
          className="aspect-[4/5] w-full max-w-56 rounded-md bg-secondary object-cover"
        />
      ) : (
        <div className="grid min-h-36 place-items-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
          No image selected
        </div>
      )}
      <div className="grid gap-4 lg:col-start-2">
        {canUpload ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => void upload(event.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="size-4" />{" "}
              {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
            </Button>
          </>
        ) : null}
        <InlineFieldError message={uploadError ?? undefined} />
        {options.length ? (
          <div>
            <Label>Select an existing image</Label>
            <Select
              value={options.some((option) => option.value === value) ? value : ""}
              onValueChange={onValue}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose from Media & Content" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        {onAlt ? (
          <div>
            <Label>Image ALT Text</Label>
            <Input className="mt-2" value={alt} onChange={(event) => onAlt(event.target.value)} />
            {suggestedAlt ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Suggestion: {suggestedAlt}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onAlt(suggestedAlt)}
                >
                  Use suggestion
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
        {doctorName ? (
          <p className="text-xs text-muted-foreground">
            Generated filename: {slugify(doctorName) || "doctor"}.webp
          </p>
        ) : null}
        {value ? (
          <Button type="button" variant="outline" className="w-fit" onClick={() => onValue("")}>
            <Trash2 className="size-4" /> Remove image
          </Button>
        ) : null}
      </div>
    </section>
  );
}
function SocialEditor({
  rows,
  onChange,
}: {
  rows: SocialRow[];
  onChange: (rows: SocialRow[]) => void;
}) {
  const update = (id: string, patch: Partial<SocialRow>) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        These are the doctor’s professional links, separate from hospital social accounts.
      </p>
      {rows.map((row, index) => (
        <div
          key={row.id}
          className="grid gap-3 rounded-md border border-border p-4 md:grid-cols-[12rem_1fr_auto]"
        >
          <Select
            value={socialPlatforms.includes(row.platform) ? row.platform : "Other"}
            onValueChange={(value) => update(row.id, { platform: value })}
          >
            <SelectTrigger aria-label="Platform">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {socialPlatforms.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            aria-label="Profile URL"
            type="url"
            value={row.url}
            onChange={(event) => update(row.id, { url: event.target.value })}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              checked={row.enabled}
              onCheckedChange={(checked) => update(row.id, { enabled: checked === true })}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Remove social link"
              onClick={() => onChange(rows.filter((item) => item.id !== row.id))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          {index === rows.length ? null : null}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        onClick={() =>
          onChange([
            ...rows,
            { id: crypto.randomUUID(), platform: "LinkedIn", url: "", enabled: true },
          ])
        }
      >
        <Plus className="size-4" /> Add social link
      </Button>
    </div>
  );
}
