# HackYeah Requirements: Combined Checklist

Compiled from three challenge briefs:

1. **Kraków bez barier** (Kraków Without Barriers), translated from Polish
2. **Smart City** (open task)
3. **Huawei / OpenHarmony: Human-Centric Technology** (chosen track)

---

## 0. Conflicts and decisions to make early

| Topic | Kraków bez barier | Huawei / OpenHarmony | Implication |
|---|---|---|---|
| Technical form | Any (web or mobile) | **Must target HarmonyOS / OpenHarmony / Oniro**; Android, iOS, web or desktop build alone is **not sufficient** | The prototype must be a `.hap` app that runs on an OpenHarmony emulator or device |
| Demo | Working demo of the main scenario + video ≤ 3 min | Recorded demo, emulator is the default | One video can cover both; keep it ≤ 3 min |
| Documentation | Business model, data sources, data protection, scaling | Architecture, AI_WORKFLOW.md, reproducible build | Write both sets of docs |
| Presentation | PDF, max 10 slides | (not specified) | One 10-slide PDF serves all three |
| Platform use | Not mentioned | Must use real platform capabilities (20% of score) | Use system APIs: accessibility services, location, TTS, etc. |

**Practical reading:** a Kraków accessibility-routing app built natively for OpenHarmony (ArkTS/ArkUI) satisfies the Human-Centric Technology track, the Smart City task ("accessibility of spaces and services") and the Kraków challenge at once.

---

## 1. Challenge A: Kraków bez barier

### 1.1 Short description
Build a tool that helps residents and tourists **assess the accessibility of places and routes according to their individual needs**, and that serves as a source of information about the accessibility of the city's offer. It must show concrete barriers and facilities, and have potential for further development, commercialization and scaling to other cities.

### 1.2 Background
- Relevant users: wheelchair users, parents with strollers, and others for whom stairs, thresholds, narrow entrances or surface type are obstacles.
- Problem is not only missing information but **how it is presented**. A binary "accessible / not accessible" label is insufficient.
- Needed detail: stairs, thresholds, ramps, lifts, entrance width, surface type, toilet accessibility, rest places. Data should be as current as possible.
- Possible data sources: open data, OpenStreetMap, information published by venue owners, user reports.
- Must show **source, update date and reliability level**. Unconfirmed information must not be presented as a formal guarantee of accessibility.
- Must be maintainable **without the City manually maintaining a database** and **without access to internal UMK / MJO systems**.
- Should be simple to use and easy for other parties (hotels, event organizers) to adopt.
- Should be reusable outside Kraków.

### 1.3 The challenge
Design and prepare a **prototype** that lets residents and tourists get information about, and assess, the accessibility of selected places or routes according to their needs. Not just "accessible/inaccessible", but detailed information so the user can decide for themselves.

**Scope limit:** restrict the prototype to a chosen user group or type of need, e.g. wheelchair users and parents with strollers.

### 1.4 Expected result: the prototype should
- [ ] Present the most current information on specific barriers and facilities: stairs, thresholds, ramps, lifts, entrance width, surface, toilet, rest places
- [ ] Show **source, update date and reliability level** for information
- [ ] Use data from available sources, with no manual database upkeep by the City
- [ ] Not require access to internal UMK or MJO systems
- [ ] Take into account the needs of the chosen user group
- [ ] Be easy to use and easy to deploy at potential customers
- [ ] Show potential for development, commercialization and scaling to other cities or sectors

### 1.5 Formal submission requirements
- [ ] Description of the solution and the problem it solves
- [ ] Prototype or demonstration
- [ ] Target group and how the solution is used
- [ ] Description of data sources and how their currency and reliability are assessed
- [ ] Proposed business model and development options
- [ ] **PDF presentation, max 10 slides**
- [ ] **Video of the project in action, max 3 minutes**, in an accessible, open repository
- Optional: code repository, screenshots, demo link, other materials

### 1.6 Technical and organizational requirements

**Form and architecture**
- [ ] Any technical form, but it must demonstrate the main scenario: **search for a place or route and show accessibility information relevant to the chosen group**
- [ ] Architecture must **separate data acquisition/updating from presentation**
- [ ] Identify main components, data flow, and how to add new sources, place categories and geographic areas

**Data and sources**
- [ ] Use only publicly available data and services under the providers' terms
- [ ] For city data: name the specific datasets or public APIs, how they are fetched, update frequency, and what happens when the source is unavailable
- [ ] Do not assume access to UMK or municipal unit internal systems

**Data trust**
- [ ] For every accessibility datum: allow stating **source, acquisition / last-confirmation date, and reliability status**
- [ ] **Clearly distinguish** user-submitted or unverified data from confirmed information
- [ ] Provide a way to **correct wrong or outdated data**

**Digital accessibility**
- [ ] Target **WCAG 2.2 level AA** as the development goal
- [ ] Already in the prototype: **keyboard operation, screen reader support, readable content, adequate contrast, and a text alternative for anything shown only on the map**
- [ ] Include a list of features already available vs. elements needing further work

**Operations and hosting**
- [ ] Propose how to launch and maintain it **outside UMK infrastructure**: who is responsible for hosting, updates, security, handling reports, and costs
- [ ] Prototype need not stay online after the hackathon, but the model must allow further development

**Privacy and security**
- [ ] Describe basic data protection: scope of user data collected, protection of reports and accounts (if any), use of secure connections
- [ ] **Do not require users to disclose disability** if barrier/facility preferences are enough to match results

**Reusability**
- [ ] Identify dependencies on external providers
- [ ] State licenses of data and components used
- [ ] Describe portability to other infrastructure
- [ ] Describe how to add another city
- Technology choice is up to the team

### 1.7 Testing and validation (to show at presentation)
- [ ] **Live demo** for the chosen user group: define their needs, check at least one place or route, show concrete barriers and facilities
- [ ] Show where information comes from, when it was acquired or confirmed, and how the app marks **incomplete, outdated or unverified** data
- [ ] If sample data is used, **label it unambiguously as sample data**
- [ ] Test at least **one case with contradictory data, incomplete data, or an unavailable source**, and explain what the user sees
- [ ] **Missing information must never be presented as confirmation of accessibility**
- [ ] Basic accessibility check of the main user scenario: keyboard, screen reader, contrast, text access to map information. State the limitations found and a plan to fix them
- [ ] Short **prototype-to-service plan**: product owner, data acquisition and verification model, how hosting and maintenance are financed, further work plan, conditions for launching in the next city

### 1.8 Available resources
| Resource | Notes |
|---|---|
| Otwarte Dane Miasta Krakowa (otwartedane.um.krakow.pl) | JSON, CSV, XLSX, APIs depending on dataset |
| MSIP (msip.krakow.pl) | Spatial data; some via WMS/WFS; check terms per resource |
| dane.gov.pl | National open data catalog; useful for scaling to other cities |
| OpenStreetMap (openstreetmap.org) | Map base and routing; **must follow license and attribute the source** |

- Other open sources, venue-owner information and user reports are allowed.
- **Publicly posted online ≠ free to scrape and use commercially.**
- For **each source**, state its origin, terms of use, currency and verification method.

### 1.9 Evaluation criteria (Kraków)
| Criterion | Weight |
|---|---|
| Relevance to the challenge and usefulness for the target group, incl. ease of use | **25%** |
| Quality and completeness of the prototype | **20%** |
| Data reliability, presentation and updating | **15%** |
| Implementation potential and scalability | **20%** |
| Business model, commercialization and market potential | **20%** |

### 1.10 Additional context
Business potential carries special weight. Commercialization directions: services for venue owners, hotels, event organizers, property managers, booking systems, map and tourism app providers. Aim for local and national market.

### 1.11 Contacts
Bartłomiej Węglarz, Karolina Grzanka, Michał Janaś: in the mentor zone and on Discord.

---

## 2. Challenge B: Smart City (open task)

**Prize pool:** 8,000 PLN

### 2.1 Task
Create a solution for a specific problem faced by a city or its residents. Choose a situation to improve, identify users, and build a tool, application, system or prototype that helps people make better use of urban resources and services.

Possible areas:
- Transportation and journey planning
- **Accessibility of spaces and services for people with different needs**
- Management of energy, water, waste or shared infrastructure
- Communication between residents and public institutions
- Using urban data to support decisions
- Responding to failures, disruptions and emergencies

Scope may be a single street, neighbourhood, service or a whole city. **Show how the idea works in a concrete situation and who benefits.** Consider accuracy and timeliness of information, ease of use, and testability in real urban conditions.

### 2.2 Judging criteria
| Criterion | Weight | What judges look for |
|---|---|---|
| Idea & Innovation | **30%** | Uniqueness, creativity, inventive solutions |
| Relation to Category | **20%** | Fit with the Smart City theme |
| Practical Applicability / Usability | **20%** | Real-world utility, seamless UX |
| Design | **20%** | Visual appeal of UI, graphics, look and feel |
| Completeness & Implementation Value | **10%** | Technical robustness, fully developed, real-world potential |

### 2.3 Existing resources
Existing repos, materials and resources are allowed **if properly cited**.

### 2.4 Use of AI (general HackYeah policy)
- AI tools are permitted at all stages (concepts, research, coding, debugging, design, documentation).
- The team stays fully responsible for originality, functionality, security, licensing and legal compliance.
- **Disclose significant AI use**, plus external models, APIs, datasets, libraries and other resources. Prompt history and AI percentage are *not* required.
- Jury assesses actual technical work done during HackYeah: complexity, architecture, integrations, implementation approach, functionality, and the team's understanding.
- **The team must be able to explain and defend its technical decisions**, including AI-generated parts. Unexplainable AI-built features can hurt the technical score.
- **Clearly separate work done during HackYeah from pre-existing work.** Do not present previously prepared solutions as hackathon work.
- Open-source libraries, frameworks, APIs and models are fine under their licences.
- Plagiarism, unauthorised third-party IP, knowingly misleading the jury, or failing to disclose significant pre-existing work **may lead to disqualification**.
- Challenge partners may add stricter AI rules; those take precedence (see Huawei's `AI_WORKFLOW.md` below).

### 2.5 Submission requirements
**Required**
- [ ] Project Title
- [ ] Team Name
- [ ] Team Members
- [ ] Project Description
- [ ] **PDF presentation, max 10 slides**

**Optional:** snapshots/screenshots, code repository, demo links, graphic materials, other materials.

Upload everything to the **Challenge Rocket** platform. Polish or English accepted.

---

## 3. Challenge C: Huawei / OpenHarmony: Human-Centric Technology (chosen track)

### 3.1 Context
HarmonyOS (Huawei, proprietary) is built on **OpenHarmony** (open source, OpenAtom Foundation), with **Oniro** as its European distribution (Eclipse Foundation). Code written here also runs on HarmonyOS devices. Emphasis on digital sovereignty and openness.

### 3.2 Task
Design and build an innovative **system feature or mobile application** for an OpenHarmony-based mobile device. Original, ambitious ideas that show what an open OS enables.

### 3.3 Chosen area: Human-Centric Technology
> Applying technology to improve human experience, inclusion and quality of life: **accessibility**, digital wellbeing, inclusive design, education, cultural experiences and responsible technology.

Other areas (for reference): *Intelligent Experiences* (AI, agents, on-device AI) and *Spatial Experiences* (3D, positioning, sensing). **Combining areas is a plus** if the combination serves a purpose, e.g. on-device AI or positioning that makes navigation more accessible.

The final solution should show **clear value, a functional implementation, and innovation that current platforms are missing**. The link to the chosen area must be visible in *what the solution does*, not only in how it is described.

### 3.4 Technical requirements
The solution may use:
- Native development: **ArkTS with ArkUI**, or C/C++ platform APIs
- A supported cross-platform framework, e.g. **React Native for OpenHarmony (RNOH)**
- OpenHarmony / Oniro system development frameworks and source-level build tools

The final solution **must**:
- [ ] Target HarmonyOS, OpenHarmony or Oniro
- [ ] Target **API 20 or later**, and where applicable declare **API 20 as the minimum supported API level**
- [ ] Use an SDK and dev environment compatible with the chosen platform version
- [ ] **Run successfully on an OpenHarmony or HarmonyOS emulator, or a compatible physical device**
- [ ] Include **reproducible setup, build and launch instructions**
- [ ] Demonstrate use or improvement of **at least one platform, device or system capability**

**Tooling:** recommended is DevEco Studio, SDK Manager, hvigor, HDC and app signing, plus emulator or device. This setup is optional; compatible open-source alternatives are allowed as long as the result is reproducible and demonstrable.

**Cross-platform note:** a cross-platform submission must include an OpenHarmony/HarmonyOS target, with the **native container, bridge and build configuration** needed to produce a working platform package. An Android, iOS, web or desktop build alone is not sufficient.

**If submitting an "improvement":** deliver it as a ready-to-install app or component that adds or improves a system capability **without modifying the system itself**. Explain what it does, how it integrates, how to install it, and how the improvement can be verified.

### 3.5 Use of AI (Huawei-specific)
Coding agents, AI assistants, MCP servers, Agent Skills etc. are permitted and strongly encouraged. AI may run locally, remotely or hybrid.

Any team that **has an AI feature OR used AI tools during development must publish `AI_WORKFLOW.md`**.

- **For an AI feature, document:** model or service, inference flow, data handling, limitations, validation approach, privacy considerations
- **For development tools, document:**
  - All AI models, coding agents, MCP servers, Agent Skills and other AI tools used
  - Main prompts, reusable instructions and relevant configuration
  - Workflow from ideation and architecture through implementation, testing and debugging
  - How generated output was reviewed, tested and validated
  - Known limitations, unsuccessful approaches and lessons learned
- Document prompts and tool usage as fully as reasonably possible
- **Remove API keys, credentials, personal data and confidential information** before publishing

### 3.6 Required deliverables
- [ ] 1. Public source code repository
- [ ] 2. Reproducible setup, build, installation and launch instructions
- [ ] 3. **Working `.hap` package**
- [ ] 4. Brief recorded demonstration
- [ ] 5. Concise architecture and implementation description
- [ ] 6. `AI_WORKFLOW.md` (when AI-assisted development tools were used)
- [ ] 7. Additional AI integration documentation (when the submission includes AI features)

### 3.7 Evaluation criteria (Huawei)
| Criterion | Weight | What is checked |
|---|---|---|
| **Originality** | 20% | New idea or fresh take; combining areas with purpose is a plus |
| **Demonstrated usefulness** | 20% | Who uses it, what problem it solves; area connection visible in behaviour; working narrow solution beats broad slide-only concept |
| **Technical execution** | 20% | Works as described (backed by code, demo, logs, tests); sensible architecture; readable, modular code; error handling (API errors, timeouts, missing data, bad input, incorrect model output); **some tests of key scenarios**; hygiene: **no secrets in repo, input validation, no unnecessary permissions or risky dependencies** |
| **Use or enhancement of platform capabilities** | 20% | Real use of system services, APIs, distributed features. An app that would run unchanged on any other OS scores lower. For this track: accessibility and system services, sensors, positioning, on-device AI |
| **Quality of the demonstration** | 10% | Actually running (not mockups); emulator is the default; clear what was built during the hackathon; if sensors/positioning can't run on emulator, explain how they would work. Mentors have physical devices on site |
| **Reproducibility and transparency** | 10% | Buildable from README and repo alone; documented versions/SDKs/config; **commit history shows progress**; AI use described |

Repositories may undergo an **automated technical pre-review**; final assessment is by the jury.

---

## 4. Master checklist (all three challenges)

### Deliverables
- [ ] Project title, team name, team members, project description (Smart City)
- [ ] **PDF presentation, ≤ 10 slides** (Kraków + Smart City)
- [ ] **Video demo, ≤ 3 min**, in an open, accessible repository (Kraków)
- [ ] Public source repository (Huawei)
- [ ] Working `.hap` package (Huawei)
- [ ] README with reproducible setup, build, install, launch steps and versions (Huawei)
- [ ] Architecture and implementation description (Huawei + Kraków)
- [ ] `AI_WORKFLOW.md` + AI feature documentation if applicable (Huawei)
- [ ] AI and external resource disclosure in the submission (Smart City / general)
- [ ] Upload to **Challenge Rocket** (Smart City), Polish or English
- [ ] Optional: screenshots, demo link, graphics

### Product and data
- [ ] Chosen user group (e.g. wheelchair users, parents with strollers); no disability disclosure required
- [ ] Place/route search that shows **detailed** barriers and facilities (not binary)
- [ ] Source, date and reliability shown for every datum
- [ ] User-reported / unverified data visibly distinct from confirmed data
- [ ] Mechanism to correct wrong or outdated data
- [ ] Missing data never shown as "accessible"
- [ ] Handling of contradictory / incomplete / unavailable-source cases demonstrated
- [ ] Sample data clearly labelled
- [ ] Data ingestion separated from presentation; documented way to add sources, categories and cities
- [ ] Datasets, APIs, licences and update frequency listed (Otwarte Dane Krakowa, MSIP, dane.gov.pl, OSM with attribution)
- [ ] No dependence on internal UMK/MJO systems; no scraping that violates terms

### Platform and quality
- [ ] Targets API 20+ (minimum API 20 declared); runs on emulator or device
- [ ] Uses at least one real platform capability (accessibility services, location, TTS, sensors, etc.)
- [ ] If cross-platform: includes the OpenHarmony native container, bridge and build config
- [ ] Error handling for API failures, timeouts, missing data, bad input
- [ ] Tests for key scenarios
- [ ] No secrets in repo; minimal permissions; safe dependencies; input validation
- [ ] Meaningful commit history

### Accessibility (WCAG 2.2 AA as target)
- [ ] Keyboard operation
- [ ] Screen reader support
- [ ] Contrast and readability
- [ ] Text alternative to map-only information
- [ ] Documented list of done vs. pending accessibility work, with a fix plan

### Business, deployment, privacy
- [ ] Business model (hotels, venue owners, event organizers, property managers, booking systems, map/tourism apps)
- [ ] Scaling plan: next city, other sectors
- [ ] Hosting/maintenance plan outside UMK: who hosts, updates, secures, handles reports, pays
- [ ] Prototype-to-service plan: owner, data model, financing, roadmap, conditions for next city
- [ ] External dependencies, component and data licences, portability
- [ ] Privacy: what user data is collected, protection of reports/accounts, secure connections

### Integrity
- [ ] Clearly mark what was built during HackYeah vs. pre-existing
- [ ] Cite existing repos and resources
- [ ] Be able to explain and defend every technical decision, including AI-generated code
- [ ] No plagiarism; no misleading the jury

---

## 5. Scoring summary across the three tracks

| Theme | Kraków | Smart City | Huawei |
|---|---|---|---|
| Idea / originality | (within usefulness) | 30% | 20% |
| Fit with challenge / usefulness | 25% | 20% (category) + 20% (usability) | 20% |
| Prototype quality / completeness / technical | 20% | 10% | 20% |
| Data reliability and updating | 15% | (within usability) | (within technical) |
| Scalability / deployment | 20% | (within completeness) | n/a |
| Business model / commercialization | 20% | n/a | n/a |
| Design / UI | (within usability) | 20% | n/a |
| Platform capability use | n/a | n/a | 20% |
| Demo quality | n/a | n/a | 10% |
| Reproducibility / workflow transparency | n/a | n/a | 10% |

**Takeaways:** Business model and scalability matter a lot for Kraków (40% combined). Design matters for Smart City (20%). Platform integration and reproducibility matter only for Huawei (40% combined). A strong submission needs all three angles covered.
