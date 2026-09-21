import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { enquiryOptionsQuery } from "@/lib/queries";
import { submitEnquiry } from "@/lib/data/repository";
import { userFacingDataError } from "@/lib/data/errors";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = { presetDoctorId?: string; source?: string; title?: string; description?: string };

const NONE = "none";

export function EnquiryForm({ presetDoctorId, source = "website", title = "Send an enquiry", description = "Share your details and the hospital team will get in touch." }: Props) {
  const options = useQuery(enquiryOptionsQuery);
  const [patientName, setPatientName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [registeredContactNumber, setRegisteredContactNumber] = useState("");
  const [familyMember, setFamilyMember] = useState("");
  const [doctorId, setDoctorId] = useState(presetDoctorId ?? NONE);
  const [departmentId, setDepartmentId] = useState(NONE);
  const [serviceId, setServiceId] = useState(NONE);
  const [preferredAt, setPreferredAt] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<{ whatsappUrl: string | null } | null>(null);

  const doctor = options.data?.doctors.find((item) => item.id === doctorId) ?? null;

  const reset = () => {
    setPatientName("");
    setContactNumber("");
    setRegisteredContactNumber("");
    setFamilyMember("");
    setDoctorId(presetDoctorId ?? NONE);
    setDepartmentId(NONE);
    setServiceId(NONE);
    setPreferredAt("");
    setMessage("");
    setSent(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const digits = contactNumber.replace(/\D/g, "");
    if (patientName.trim().length < 2) return setError("Please enter the patient's full name.");
    if (digits.length < 8) return setError("Please enter a valid contact number.");

    setSubmitting(true);
    const value = (id: string) => (id === NONE ? null : id);
    const enquiryId = crypto.randomUUID();
    try {
      await submitEnquiry({
        id: enquiryId,
        patientName: patientName.trim(),
        contactNumber: contactNumber.trim(),
        registeredContactNumber: registeredContactNumber.trim() || null,
        familyMemberName: familyMember.trim() || null,
        preferredDoctorId: value(doctorId),
        preferredDepartmentId: value(departmentId),
        preferredServiceId: value(serviceId),
        preferredAt: preferredAt ? new Date(preferredAt).toISOString() : null,
        message: message.trim() || null,
        source,
      });
    } catch (submitError) {
      setSubmitting(false);
      return setError(userFacingDataError(submitError));
    }

    const target = doctor?.whatsapp_number ?? siteConfig.contact.whatsapp;
    const lines = [
      `New enquiry from the ${siteConfig.name} website`,
      `Patient: ${patientName.trim()}`,
      `Contact: ${contactNumber.trim()}`,
      registeredContactNumber.trim()
        ? `Registered contact: ${registeredContactNumber.trim()}`
        : null,
      familyMember.trim() ? `Family member: ${familyMember.trim()}` : null,
      doctor ? `Doctor: ${doctor.name}` : null,
      preferredAt ? `Preferred time: ${preferredAt.replace("T", " ")}` : null,
      message.trim() ? `Message: ${message.trim()}` : null,
    ].filter(Boolean);
    const whatsappUrl = target ? `https://wa.me/${target.replace(/\D/g, "")}?text=${encodeURIComponent(lines.join("\n"))}` : null;

    setSubmitting(false);
    setSent({ whatsappUrl });
  };

  if (sent) {
    return (
      <div className="border border-border bg-surface p-6 sm:p-8">
        <CheckCircle2 className="text-primary" />
        <h2 className="mt-5 text-2xl font-semibold">Enquiry received</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The hospital team has your request and will contact you on the number you shared.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {sent.whatsappUrl ? (
            <Button asChild>
              <a href={sent.whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" /> Send on WhatsApp
              </a>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">WhatsApp forwarding will be available once a number is published.</p>
          )}
          <Button variant="outline" onClick={reset}>
            Send another enquiry
          </Button>
        </div>
      </div>
    );
  }

  const list = options.data;

  return (
    <form className="border border-border bg-surface p-6 sm:p-8" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 grid gap-5">
        <div>
          <Label htmlFor="patient-name">Patient full name</Label>
          <Input id="patient-name" required value={patientName} onChange={(e) => setPatientName(e.target.value)} className="mt-2 bg-background" autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="contact-number">Contact number</Label>
          <Input id="contact-number" required inputMode="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="mt-2 bg-background" autoComplete="tel" />
        </div>
        <div>
          <Label htmlFor="registered-contact-number">Registered contact number (optional)</Label>
          <Input
            id="registered-contact-number"
            inputMode="tel"
            value={registeredContactNumber}
            onChange={(event) => setRegisteredContactNumber(event.target.value)}
            className="mt-2 bg-background"
            autoComplete="tel"
            aria-describedby="registered-contact-help"
          />
          <p id="registered-contact-help" className="mt-2 text-xs text-muted-foreground">
            Enter this only if it is different and relevant to your hospital record.
          </p>
        </div>
        <div>
          <Label htmlFor="family-member">Family member name (optional)</Label>
          <Input id="family-member" value={familyMember} onChange={(e) => setFamilyMember(e.target.value)} className="mt-2 bg-background" />
        </div>
        {!presetDoctorId && list?.doctors.length ? (
          <div>
            <Label htmlFor="preferred-doctor">Doctor (optional)</Label>
            <Select value={doctorId} onValueChange={setDoctorId}>
              <SelectTrigger id="preferred-doctor" className="mt-2 w-full bg-background"><SelectValue placeholder="No preference" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No preference</SelectItem>
                {list.doctors.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        {list?.departments.length ? (
          <div>
            <Label htmlFor="preferred-department">Department (optional)</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger id="preferred-department" className="mt-2 w-full bg-background"><SelectValue placeholder="No preference" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No preference</SelectItem>
                {list.departments.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        {list?.services.length ? (
          <div>
            <Label htmlFor="preferred-service">Service (optional)</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger id="preferred-service" className="mt-2 w-full bg-background"><SelectValue placeholder="No preference" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No preference</SelectItem>
                {list.services.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div>
          <Label htmlFor="preferred-at">Preferred date and time (optional)</Label>
          <Input id="preferred-at" type="datetime-local" value={preferredAt} onChange={(e) => setPreferredAt(e.target.value)} className="mt-2 bg-background" />
        </div>
        <div>
          <Label htmlFor="enquiry-message">How can we help? (optional)</Label>
          <Textarea id="enquiry-message" value={message} onChange={(e) => setMessage(e.target.value)} className="mt-2 min-h-32 bg-background" />
        </div>
        {error ? <p role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
        <Button type="submit" size="lg" disabled={submitting}>{submitting ? "Sending…" : "Send enquiry"}</Button>
        <p className="text-xs text-muted-foreground">Please do not use this form for medical emergencies. Contact your local emergency service instead.</p>
      </div>
    </form>
  );
}
