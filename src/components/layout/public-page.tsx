import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export function PublicPage({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background"><SiteHeader /><main id="main-content">{children}</main><SiteFooter /></div>;
}
