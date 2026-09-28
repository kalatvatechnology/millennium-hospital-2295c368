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
