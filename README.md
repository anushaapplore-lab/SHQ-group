# SHQ Operations Command

A clickable front-end prototype of a virtual PMO for industrial, oil & gas and EPC contractors. It has three layers: Command (leadership), Department Workspaces and a Field mobile app. Everything runs in the browser on seeded, fictional data held in one shared in-memory store, so an action in one module shows up in every other.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
npm run preview    # serve the build
```

Demo state is saved in `localStorage`. To restore the seeded baseline, use **Demo Guide → Reset demo data** or the profile menu.

## Demo journey

Open **Demo Guide** (bottom-left or top bar) to jump to any step:

1. Enter Demo as CEO (Saleh) → Executive Command Centre
2. North Pipeline Expansion → QA/QC tab → INS-WLD-00428 (Failed)
3. Raise NCR → NCR-00218 → advance to CAPA Submitted (CAPA + approval created), then "Simulate +3 days" (SLA escalation)
4. Handover: dossier at 68%, missing documents
5. HSE: OBS-1042 suspended load, simulated AI hazard analysis
6. Procurement: PO-450021 vendor price +11.5%, recommendation engine, price simulator
7. Switch role to QA/QC Manager, then Site Engineer → `/field`
8. Field app (offline): capture an HSE observation → Saved locally → Sync (3/3) → back to leadership: the new critical alert and risk score are there

## Structure

- `src/data`: seeded records (projects, quality, HSE, procurement, HR, O&M, documents, alerts)
- `src/store`: central store (`store.tsx`), selectors, roles
- `src/components`: UI kit (`ui.tsx`), shell, and per-module components
- `src/pages`: route modules per department
- `src/ai/engine.ts`: deterministic "SHQ Intelligence" answers

## Design

Built to `design-language-shq.md`: navy shell, white workspace, hairline borders and no card shadows. Colour is used only for status, and pastel fills only for lifecycle stages. Brand hexes are provisional (navy shell, blue action colour) until SHQ's verified brand colours are sampled. Arabic switches the layout to RTL and translates the navigation, the executive dashboard and AI questions.

## Simulated, not real

AI analysis, computer vision, ERP sync, offline storage, uploads and exports are all simulated and labelled as such. All names and figures are fictional. No SHQ, client (Aramco, SABIC, SEC) or ERP data is used. When deploying to static hosting, configure an SPA fallback to `index.html` (the app uses browser routing, e.g. `/field`).
