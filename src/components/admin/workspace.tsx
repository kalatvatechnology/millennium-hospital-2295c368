import { useState, type ReactNode } from "react";
import { AlertTriangle, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WorkspaceLayout({
  backLink,
  sections,
  active,
  children,
}: {
  backLink: ReactNode;
  sections?: { key: string; label: string; link: ReactNode }[];
  active?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="min-w-0">
        <div className="mb-4 [&_a]:inline-flex [&_a]:min-h-10 [&_a]:w-full [&_a]:items-center [&_a]:border [&_a]:border-input [&_a]:bg-background [&_a]:px-4 [&_a]:font-medium [&_a]:hover:bg-accent">
          {backLink}
        </div>
        {sections?.length ? (
          <nav aria-label="Workspace sections" className="border border-border bg-background p-2">
            <ul className="grid gap-1">
              {sections.map((section) => (
                <li key={section.key}>
                  <Button
                    asChild
                    variant={active === section.key ? "secondary" : "ghost"}
                    className="h-auto w-full justify-start whitespace-normal text-left"
                  >
                    {section.link}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function WorkspaceSaveBar({
  busy,
  disabled,
  onSave,
  onCancel,
}: {
  busy?: boolean;
  disabled?: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-20 mt-8 flex justify-end gap-3 border-t border-border bg-admin/95 py-4 backdrop-blur">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="button" disabled={disabled || busy} onClick={onSave}>
        <Save className="size-4" /> {busy ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

export function InlineDelete({
  label,
  description,
  busy,
  onConfirm,
}: {
  label: string;
  description: string;
  busy?: boolean;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming)
    return (
      <Button
        type="button"
        variant="outline"
        className="text-destructive"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="size-4" /> Delete {label}
      </Button>
    );
  return (
    <div role="alert" className="border border-destructive/40 bg-destructive/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div>
          <p className="font-semibold">Delete this {label}?</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="button" variant="outline" onClick={() => setConfirming(false)}>
          Keep it
        </Button>
        <Button type="button" variant="destructive" disabled={busy} onClick={onConfirm}>
          {busy ? "Deleting…" : "Delete permanently"}
        </Button>
      </div>
    </div>
  );
}

export function WorkspaceSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid gap-5", className)}>
      <header className="border-b border-border pb-4">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
