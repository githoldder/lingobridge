# Technical Research Workflow

This workflow governs how agents and developers conduct technical spikes, research integrations (such as cloud providers, speech APIs, or storage layers), and document decisions within LingoBridge.

---

## 1. Research Objectives

* Prevent unstructured "information dumps" or vague descriptions.
* Drive concrete, actionable technical recommendations based on primary documentation.
* Isolate development risks by understanding the impact on the existing codebase before writing code.

---

## 2. Research Steps

### Step 1: Formulate the Problem Statement
Define a clear, specific, and bounded research question.
* *Example*: "How do we generate presigned upload URLs for Cloudflare R2 on Express backend?"

### Step 2: Separate Facts from Assumptions
* **Fact**: Proven by primary documentation, direct API calls, or reproducible local execution.
* **Assumption**: Educated guesses, legacy blog posts, or unverified secondary sources.
* *Rule*: Highlight all assumptions in bold and design a validation test to convert them to facts.

### Step 3: Identify Technical Alternatives
Analyze at least **2-3 approaches** using a clear comparison matrix:
* Complexity to implement
* Latency and performance impact
* External dependency / cost footprint
* Maintenance effort

### Step 4: Write the Decision Note
Document the selected strategy clearly, and list all **rejected alternatives** along with the precise rationale for their rejection.

---

## 3. Repository Impact Assessment

Every technical research document must include a **Repository Impact** section detailing:
1. **Affected Code Layers**: Which files, schemas, database tables, or middleware will change.
2. **Environment Variables**: New config keys required for local, Vercel, and Tencent lanes.
3. **Rollback Strategy**: The exact steps required to revert the system state if the implementation fails.
4. **Acceptance Criteria**: Concrete steps to prove the selected option works.

---

## 4. Archiving Decisions

Save the final research findings under:
`docs/01-reference/research-notes/YYYY-MM-DD-<topic>.md`

Ensure it contains a clean markdown structure, comparison tables, and code snippets where necessary.
