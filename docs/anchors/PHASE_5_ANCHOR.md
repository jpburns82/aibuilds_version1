# PHASE 5 — GOLDEN ANCHOR (UI + VM + WORKBENCH)

## 1. Phase Name & Goal

**Phase:** 5 — Interactive Workbench UI + Agent VM

**Goal:** Turn the AI-Builds engine into a real, interactive workstation with:
- Vite + React UI
- 3-pane workbench
- Live agent team console
- VM console for "what the agents are running"
- Project explorer + file viewer
- Strictness mode selector
- Validation + logs surface

After Phase 5, you can visually watch the team work and inspect results.

---

## 2. Scope (In / Out)

### In Scope (Phase 5):

- Scaffold `ui/` app with Vite + React + TS
- Implement 3-pane workbench UI:
  - Project Explorer (folder tree + file viewer)
  - Agent Console (chat + threads)
  - VM Console (runtime view/logs)
- Strictness mode selector in UI wired to backend
- Validation report viewer
- Log stream panel
- Minimal Agent VM implementation:
  - Execute JS/TS snippets in a sandbox wrapper
  - Capture stdout/stderr/logs and return to UI
- Backend bridge for UI:
  - Read-only pipeline state
  - Start/run steps
  - Read folder structure + files
  - Trigger validations
  - Trigger VM run

### Out of Scope (Future Phases):

- Full-blown visual UI previews of generated apps (Phase 6+)
- Advanced VM isolation + multi-language sandboxing (Lua, etc.)
- Multi-project session manager
- User auth, persistence, and production deployment

---

## 3. Success Criteria

Phase 5 is DONE when:

1. `npm install && npm run dev` inside `/ui` opens a workbench at `http://localhost:5173` (or similar).

2. You see:
   - **Left:** Project Explorer (folder tree + file view)
   - **Middle:** Agent Console (full team discussion stream)
   - **Right:** VM Console (shows "runs" triggered by agents/tasks)

3. You can:
   - Start a new build from the UI
   - See each agent's messages (Analyst, Architect, Coder, QA, LeadArchitect)
   - See validation results in the UI
   - Flip strictness between Prototype / MVP / Production and see it reflected in the pipeline
   - Inspect generated files through the UI (tree + viewer)
   - Trigger a "VM run" on some generated code and see logs/errors appear

4. No backend architecture is broken:
   - All new TS files < 300 lines
   - No god modules
   - Orchestrator/pipeline still single source of truth
   - Validators still wired and functioning

---

## 4. Forbidden Zones (Phase 5)

Claude must NOT:

- Touch or break:
  - `src/orchestrator/pipeline.ts` core logic (beyond adding small, focused bridge calls if needed)
  - `src/blueprint/*.ts` behavior
  - `src/validators/*.ts` behavior
- Introduce any file > 300 lines
- Introduce a new "second pipeline"
- Change existing strictness rules
- Hard-code absolute paths that break portability
- Delete or overwrite `docs/anchors` or Phase 1–4 reports

---

## 5. New Components for Phase 5

### Backend (existing repo):

- `src/clients/uiServer.ts` — small HTTP/REST bridge to the pipeline & VM
- `src/clients/fsBridge.ts` — helper for folder tree + file reads
- `src/clients/vmBridge.ts` — bridge between UI server and src/vm/*
- `src/vm/VirtualMachine.ts` — minimal runnable implementation (JS sandbox)
- `src/vm/VMController.ts` — high-level VM orchestration
- `src/vm/VMEventLog.ts` — track VM runs/events in memory

### Frontend (new /ui app):

- `ui/src/App.tsx`
- `ui/src/layout/WorkbenchLayout.tsx`
- `ui/src/components/Toolbar.tsx`
- `ui/src/components/AgentChatWindow.tsx`
- `ui/src/components/AgentMessageBubble.tsx`
- `ui/src/components/AgentStatusBar.tsx`
- `ui/src/components/ProjectFolderTree.tsx`
- `ui/src/components/FileViewer.tsx`
- `ui/src/components/StrictnessSelector.tsx`
- `ui/src/components/ValidationPanel.tsx`
- `ui/src/components/VMConsole.tsx`
- `ui/src/components/LogStream.tsx`
- `ui/src/components/SplitPane.tsx`
- `ui/src/hooks/usePipeline.ts`
- `ui/src/hooks/useAgents.ts`
- `ui/src/hooks/useFS.ts`
- `ui/src/hooks/useVM.ts`
- `ui/src/hooks/useValidation.ts`

---

## 6. File Size Constraints

- All backend files: < 300 lines
- All frontend files: < 300 lines (preferably < 200)
- Break components into subcomponents if needed
