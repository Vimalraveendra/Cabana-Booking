# AI-Assisted Workflow

## Tools Used

- **Claude (claude.ai)** — primary AI assistant used throughout the entire project


## How Claude Was Used

Claude was used not just for code generation but as a technical collaborator
throughout the project — covering architecture, implementation, styling,
testing and documentation.


## Steps and Prompts

### Step 1 — Architecture and Scaffold
**Prompt:** 

- Initial project scaffold in JavaScript
- Iterative UI improvements —  modal popup
- Node.js + Express for the backend
- Vanilla HTML/CSS/JS for the frontend (no build step initially)
- In-memory state for bookings
- `row-col` string IDs for cabanas derived from the ASCII map parser
- Single Express process serving both API and static files
- Applied simplicity principles — right-sized files, focused tests

---

### Step 2 — Backend Implementation
**Prompts:**
- "Add CLI arguments --map and --bookings with fallback defaults"
- "Add Load Map,Load bookings,cabanasState and parse cabanas"

---

### Step 3 — Frontend Implementation
**Prompts:**
- "Add path tile detection with different images for straight, corner, split,   crossing and end tiles and render map"
-  BEM methodology for CSS

---

### Step 4 — TypeScript Migration
**Prompts:**
- "Use tsx for backend and esbuild for frontend"
- "Fix Response is not generic error in Express v5"
- "Downgrade to Express v4 for stability"

---

### Step 5 — Testing
**Prompts:**
- "Add backend API integration tests using supertest"
- "Add frontend logic tests using jsdom"
- "Fix Jest cannot parse TypeScript error"
- "Fix ts-jest globals deprecated warning"

---

### Step 7 — Code Quality and Review
**Prompts:**
- "BEM correctness"
- "TypeScript best practices "
- "function naming conventions"
- recommendations on how to simplify onClick() events in Typescript.

---

### Step 8 — Documentation
**Prompts:**
- "Summarize this feature in a professional way for README."
- "Explain design decisions and trade-offs"
- "Write the AI.md workflow document"

---

## Number of Prompts

The conversation was extensive — well over 25 exchanges covering code generation,
code review, debugging, BEM methodology, TypeScript best practices,commit conventions and documentation.

---