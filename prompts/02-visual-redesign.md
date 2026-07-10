# Nova IT – visual redesign pass

You are working inside the actual Nova IT React/TypeScript/TanStack Start repository.

This is an implementation task, not a planning-only task. Inspect the repository, edit the real files, run the available checks, and report exactly what changed.

Before starting, read:

- `README.md`
- `docs/prompt-index.md`
- `docs/supportbot-integration-plan.md`
- `AGENTS.md`
- `src/routes/README.md`

## Objective

Implement the next visual and UX redesign stage. The site already has Swedish localization, demo-safe wording, accessible contact-form validation, service preselection and removal of fake company claims.

Make the website visibly stronger and less like a generic AI-generated template. It should feel like a calm, practical and slightly premium Scandinavian IT-support demo for small businesses, schools and private customers.

Do not integrate the standalone supportbot in this pass. The existing `/assistent` route may be visually improved, but the full bot port is a separate later task.

## Hard regression rules

- Keep Nova IT fictional and demo-safe.
- Do not add fake organization numbers, addresses, phone numbers, customer counts, logos, testimonials, certifications, staff profiles, response-time promises or years in business.
- Do not hide real company information or secrets in frontend code.
- Preserve Swedish localization and `<html lang="sv">`.
- Preserve Swedish 404 and error UI.
- Preserve contact-form validation, error summary, success state, character counter and accessibility attributes.
- Preserve service preselection through `/kontakt?service=<slug>`.
- The support guide must remain clearly frontend-only and must not claim to be real AI.
- Do not add auth, payment, database, backend routes or real API calls.
- Do not manually edit generated route-tree files unless the framework regenerates them.
- Do not add unnecessary dependencies.
- Keep the project buildable.

## Git workflow

1. Confirm branch and clean status.
2. Create or use a dedicated visual-redesign branch.
3. Preserve existing history; do not force-push or rewrite published history.
4. Make logical commits and report them.

## Visual direction

Use a restrained operational design language:

- off-white or very light cool-gray background
- graphite text
- deep teal primary color
- soft green status accents
- muted amber warning accents
- crisp borders
- compact radii
- subtle shadows only where useful
- consistent line icons
- stronger whitespace and typography hierarchy
- support status, diagnosis and next step as the recurring motif

Avoid crypto/startup visuals, random gradients, decorative blobs, fake enterprise branding, excessive animation and vague marketing copy.

## Required implementation

### Shared visual system

Create or refine reusable patterns only where they reduce repetition:

- `PageHeader`
- `Section`
- `CTASection`
- `DemoNotice`
- `ServiceCard`
- `StatusPanel`
- `InfoPanel`
- `CaseStudyTimeline`

Do not over-abstract simple one-off markup.

### Homepage

- Create a stronger hero with a useful operational `StatusPanel`, not just a decorative image.
- Keep an honest demo label and clear Swedish copy.
- Add primary CTA to the contact form and secondary CTA to the support guide.
- Improve service preview, process section, guide teaser, trust explanation and final CTA.
- Make the first viewport and mobile layout visibly stronger.

Suggested headline:

> IT-hjälp som börjar med att reda ut läget.

Suggested microcopy:

> Frontend-demo. Inga uppgifter skickas till en server.

### Services

- Present services as a practical catalog rather than a generic card grid.
- Keep the six existing service slugs.
- Show category, common issues, expected outcome and service-specific CTA.
- Preserve links to `/kontakt?service=<slug>`.
- Improve hover, focus and mobile states.

### Support guide

- Prefer the Swedish name `Frågeguiden`.
- Make it explicit that responses are predefined and no AI/API is used.
- Improve category chips, selected state, answer hierarchy and mobile usability.
- Keep CTA mapping to the correct contact service.
- Do not add fake typing, diagnosis or live-support language.

### Contact page

- Preserve all existing validation and accessibility behavior.
- Group fields visually under `Dina uppgifter`, `Ärendet` and `Bekräfta`.
- Improve selected-service summary, helper text, error presentation and success state.
- Keep the form frontend-only.

### Navigation and footer

- Improve active and focus states on desktop and mobile.
- Add `Case study` to navigation.
- Use the sections `Nova IT`, `Tjänster`, `Projektet` and `Demo` in the footer.
- Keep a concise fictional-project disclaimer.

### Add `/case-study`

Create a Swedish, grounded page documenting:

1. rough Lovable prototype
2. first Codex improvement pass
3. visual redesign pass
4. professional demo stage
5. possible real company version later

Use this sentence:

> Verktygen gav fart, men kvaliteten kom från granskning, prioritering och tydligare beslut.

Do not invent screenshots, measurements or results. Add structured placeholders for future comparisons.

## Documentation

Update `README.md` and `docs/prompt-index.md` after implementation. Add a concise redesign report under `docs/` covering visual changes, technical changes, preserved behavior and remaining risks.

## Verification

Run the package-manager-appropriate commands for:

- lint
- production build

Smoke-test:

- `/`
- `/tjanster`
- `/assistent`
- `/kontakt?service=natverk`
- `/case-study`
- an invalid route for Swedish 404

Check mobile layout, keyboard navigation, visible focus, form validation, service preselection and support-guide CTA mapping.

## Final report

Report:

1. branch and commits
2. changed files
3. visual and UX changes
4. component/data changes
5. accessibility and form behavior preserved
6. `/case-study` implementation
7. lint/build results
8. remaining warnings and risks
9. how to inspect the diff
