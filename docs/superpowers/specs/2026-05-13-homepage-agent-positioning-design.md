# Homepage Agent Positioning Design

## Goal

Update the homepage so visitors can quickly understand the strongest 1-2 representative projects, their technical stacks, frequently used AI tools, and available demo/detail links.

## Approved Positioning

Use "Agent direction first, FeO maturity second" as the homepage narrative.

- Primary representative project: `local-gsd-three-agent-orchestration`
- Secondary representative project: `industrial-feo-prediction`

This supports the job-search goal of being perceived as an Agent / AI engineering candidate while keeping the most mature FeO project as evidence of applied AI depth.

## Homepage Module

Add a focused module after the hero/proof area and before the broader project grid.

The module should include:

- A clear heading such as `代表项目与工具链`
- Two representative project cards
- Each card shows project title, positioning label, summary, main technical stack, AI tools, and links
- A separate AI tools overview covering common tools such as Codex, Claude Code, LiteLLM, MCP, Phoenix, Dify, Qwen-VL, and LangChain4j
- Honest link behavior: when a project has public links, show those labels; when it does not, show an internal `项目详情` link

## Data And Boundaries

Use existing Astro content collection data where possible. Do not duplicate project titles or summaries in a way that can drift from `src/content/projects`.

Homepage-only positioning labels and AI tool groupings can live in `src/pages/index.astro` because they are presentation copy for the homepage, not global project metadata.

## Visual Direction

Match the current site style:

- restrained portfolio layout
- no nested cards
- compact tags/chips for stack and tools
- responsive two-column layout on desktop, single-column on mobile

## Verification

Add a site smoke test that checks the homepage source includes the new module copy and key project/tool names. Then run:

- `npm test`
- `npm run build`
