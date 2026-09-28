<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- FAQ scope: faqs.department_id NULL = hospital-wide (CMS > FAQs, /faq); set = department-owned, managed only in that Department workspace — one FAQ table, no duplicate system.
- SEO Audit "Fix issue →" destinations come only from src/lib/seo/fix-links.ts (seoFixTarget); editors highlight ?field= via FieldFocus in AdminShell — one mapping, no per-page buttons.
- SEO audit treats /faq as one page entity (FAQ_PAGE_ID); FAQ questions are content, never page-level SEO entities.
- Doctor image roles (profile/hero/hero background/OG) are media_doctors rows with usage≠'gallery' pointing at central media_items; doctors.* URL columns are trigger-synced copies — why: one media system, traceable usage, public pages unchanged.
- Website Page SEO (title, description, canonical, OG, og_media_id → media_items, robots_index) lives on website_pages; public /{slug} heads use websitePageHead + getWebsitePageMeta and the audit uses resolvePageCanonical — why: one SEO source read identically by site and audit.
