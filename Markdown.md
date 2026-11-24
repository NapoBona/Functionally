# Functional Tutoring Scheduler — Lovable Working Brief

> **Status: Working draft v1.5 — not yet approved to build.**
> This brief captures our current decisions. Start in Plan mode, summarize the proposed prototype, and wait for approval before implementing. Do not publish or connect a backend.

## 1. Product goal

Build a polished, Hebrew-first web app for one Israeli school (grades ט׳–י״ב) that helps the manager coordinate functional tutoring sessions throughout the school day.

The central task is scheduling students with teachers: who meets whom, when, for which subject, and where. The app must also show the school class a student will miss, help staff respond to dynamic changes, and provide useful day-to-day context about exams, classwork, homework, and aide availability.

This first build is an **interactive frontend prototype with synthetic local data only**. The production backend, hosting region, real staff accounts, and real student data are intentionally deferred until the school’s data requirements are checked.

## 2. First step in Lovable

1. Use **Plan mode** first. Do not start in Build mode.
2. Summarize the complete product roadmap, the proposed screens, user flows, mock data model, and technical approach. Propose phased implementation steps. Identify any genuinely blocking questions and wait for approval before coding.
3. Confirm the framework/scaffold Lovable currently uses for a new project; keep the result maintainable and portable to VS Code. Do not assume an older Lovable project stack.
4. After approval, connect the project to a private GitHub repository using Lovable’s two-way Git sync, then build **one approved Phase 1 slice at a time** from the roadmap below. GitHub is for source code only. Keep all app data local and synthetic; do not enable Lovable Cloud, connect Supabase or any other data service, create a production database, or publish the app.
5. Do not send real student, teacher, or aide information to Lovable or include it in project files. Use clearly fictional demo records only.

### Phased implementation

Plan the whole product, but implement one reviewable slice at a time:

1. **Phase 1 — Core scheduling, exams, and demo roles:** responsive app shell; manager daily/weekly schedule views; synthetic role switcher; student/group/teacher scheduling; homeroom timetable with individual overrides; class-excusal indicators; location warnings; availability visibility; teacher and aide schedule views; grade/subject exam notices; targeted time/conflict suggestions.
2. **Phase 2 — School events and lesson operations:** school-wide events; student absences; lesson outcome and per-student attendance/lateness logging; one-off absence coverage.
3. **Phase 3 — Shared knowledge and reporting:** grade/subject class updates, homework and exercise links; operational statistics; CSV/Excel import preview.

Recommended Phase 1 slices:

- **1A — Product shell:** Hebrew RTL navigation for the full planned product, light/dark theme, synthetic role switcher, and representative manager/teacher/aide shells. Later-phase destinations may be visibly marked “בקרוב”; do not implement their workflows yet.
- **1B — Manager schedule:** weekly day/period table and daily period/teacher table, session creation/editing, recurring dates, groups, and teacher assignment by student and subject.
- **1C — Schedule context:** homeroom timetable and student overrides, excusal rules, missed-class details, tutoring locations and warnings, aide availability, and teacher/aide views.
- **1D — Exams and helper:** grade/subject exam notices and subject highlighting; targeted schedule suggestions and reviewed repair chains.

Show the result after each slice or phase and wait for review before continuing. Do not attempt multiple slices in one Build pass. After a slice is built, run browser testing as a separate step on desktop and mobile before starting the next slice.

### Prompting protocol for Lovable

- Treat this file as the complete product context and source of truth. Give Lovable the full plan up front so it understands the intended product, roles, data concepts, and later phases.
- In the first Plan-mode message, ask Lovable to analyze the whole brief and propose an implementation roadmap, but explicitly prohibit code changes, backend setup, and publishing. Review and correct its plan before approving implementation.
- Put stable guardrails in Lovable Project Instructions: Hebrew/RTL, one school for v1, synthetic data only, no backend until approved, and implement only the currently approved phase.
- For each Build prompt, name exactly one approved slice, its acceptance criteria, and what is out of scope. Require Lovable to stop after that slice and summarize what changed, what it checked, and what remains.
- Run browser testing in a separate prompt after each slice. Fix only verified failures before moving to the next slice.
- Do not ask Lovable to invent extra features or implement future phases on its own. If it finds a missing decision, have it ask instead of guessing.
- With a five-prompt daily limit, aim for one build prompt, one separate test prompt, and at most one focused fix prompt per work session. Keep the remaining prompts for genuine clarifications rather than unrelated feature additions.

#### Initial Plan-mode prompt

> Read this complete brief as product context. Stay in Plan mode: do not edit files, create or connect a backend, or publish. Summarize the product and roles, propose the screen map and mock-data model, outline all three phases, and list contradictions or genuinely blocking questions. Recommend the smallest useful Phase 1 slice. Wait for my approval before making any changes.

#### Build-slice prompt template

> Implement only **[approved slice]** from the accepted plan. Use synthetic local data and preserve the approved architecture and visual direction. Acceptance criteria: **[list criteria]**. Out of scope: **[list later phases/features]**. Do not enable a backend or publish. Do not change unrelated areas. Stop after this slice and summarize the changes and checks.

#### Separate verification prompt template

> Do not make code changes yet. Use browser testing to verify **[specific user flows]** at desktop and mobile sizes against the accepted criteria. Report pass/fail and the exact failures. Wait for approval before fixing or adding anything.

## 3. Language, calendar, and design

- All user-facing text must be natural Hebrew, with correct right-to-left layout throughout the application. The specification is in English; the product UI is in Hebrew.
- Use the familiar Hebrew role labels **מורה** and **סייעת**; do not translate “functional teacher” literally in the UI.
- Display a student’s name to staff as their first name plus the first letter of their second name; do not show the full second name in staff-facing schedule cards or lists.
- Use an Israeli school calendar: week starts on Sunday; Sunday–Thursday are the main school days. Friday has a lighter schedule, mainly advanced subjects and learning groups. Saturday is not a regular school day.
- Use local Israeli date/time conventions and the `Asia/Jerusalem` time zone.
- Make the manager experience comfortable on desktop and the teacher/aide experience practical on mobile. The layout must remain responsive on tablet and phone.
- Visual direction: calm, professional school dashboard; warm light background, restrained blue/teal accents, and clear, consistent colors for subjects. Provide both light and dark themes with an obvious theme toggle; keep contrast and readability strong in both.
- Visual reference: use the user-provided [Base44 manager page](https://mindful-lu-school-sync.base44.app/manager) for broad visual cues only. Consider an off-white canvas, white surfaces, dark navy text, restrained teal accents, pale mint secondary surfaces, light gray borders, and clear amber warnings/red destructive states. Heebo body text with Rubik headings and subtly rounded cards (about 8px) are suitable starting points. Adapt the composition to this app’s Hebrew RTL workflows and light/dark themes; do not copy Base44 branding, logo, text, or exact screen composition.
- Use visible labels, not icon-only controls for important actions. Provide clear legends for subject colors and conflict indicators.

## 4. Roles and access to demonstrate

This prototype has no real authentication. Include a clearly labeled **demo role switcher** so the manager, teacher, and aide experiences can be reviewed using synthetic accounts.

In this app, **מורה** means a functional tutor who runs tutoring sessions. Regular school subject teachers are not separate app users in v1; their class material and homework can be shared through the grade/subject feed by app staff.

### Manager

- Has the school-wide view and manages the schedule, students, teachers, subjects, groups, school timetable, exam/school events, locations, and aide-to-homeroom coverage.
- Invites staff in the eventual production app; there is no public registration or student login.
- Has both a weekly scheduling view and a daily operations view.

### Teacher

- Sees their own schedule and the students/groups assigned to their sessions.
- Sees, on each session, the tutoring subject and location plus the student’s expected school subject and classroom that will be missed, when known.
- Can see which aides are currently present/available and their homeroom coverage. Aides are not participants in the tutoring lesson and are not reserved for its full duration; a teacher can coordinate help with an aide in person or outside the app.
- Can report availability/openings and log lesson outcomes.

### Aide

- Is associated with one or more homeroom classes and may cover several homerooms, each with several students. Do not impose arbitrary small limits on homeroom or student assignments.
- Sees the academic and scheduling profiles and all scheduled sessions for students in the homerooms they cover. Keep profiles limited to academic and scheduling information.
- Can see relevant session locations and the school class/subject a student is expected to leave, to help locate the student.
- Has a simple present/absent/available status, not a detailed duty timetable. An aide may help locate a student and then be free to help elsewhere; do not model an aide as a required lesson resource or reserve an aide for an entire session.
- In the first release, the manager manages homeroom coverage; aide-managed administration can be considered later.

### Data minimization

- Do not store student phone numbers or parent contact details; teachers already have student phone numbers outside this app.
- Do not add medical, diagnostic, behavioral, or free-text support notes. Student profiles in this version contain academic and scheduling information only.
- Limit displayed data by role in the prototype so the intended access boundaries are apparent. Production access rules will need to be enforced by the eventual backend, not merely hidden in the UI.

## 5. Scheduling model and workflows

- Use a weekly repeating baseline for both the school timetable and tutoring schedule, with dated exceptions.
- When a repeating item changes, support the idea of applying a change to one occurrence, a selected date range or number of occurrences, or all future occurrences. Show the effective dates clearly.
- Tutoring sessions align to one or more full school periods. A session may include one student or a manager-defined group.
- The manager manually creates and edits sessions, and can ask the system for suggested times or repairs to a selected session/conflict. A repair may include a short chain of moves involving other sessions, but the manager remains in control of published schedule changes.
- Rank repairs by least disruption: try direct moves first, then prefer the shortest chain and fewest affected sessions. Show alternatives and a clear before/after summary; never apply a repair chain without the manager’s explicit confirmation.
- The system should display clear reasons when a suggested time is invalid or a conflict exists. Do not silently move a student or change a published schedule.
- A repair proposal may include a teacher change as well as a time change. Rank substitute teachers by subject match and availability, show the alternatives, and require manager approval.
- A group is defined by the manager and scheduled as one session. A group can have its own assigned teacher even when its students have different teacher assignments by subject. Check each group member against their own school timetable and excusal rules.
- The manager assigns teachers per student-and-subject pair; a student may have different teachers for different tutoring subjects. A group session may have its own teacher.
- Locations are selected per tutoring session. A location overlap is a **warning**, not a hard blocker. Show the location and any overlap to the manager and relevant teacher/aide.
- Student/teacher/time conflicts and school-class excusal restrictions should be clearly distinguished from location warnings.

### Availability and substitutions

- Teachers and aides can report openings/availability needs. Simple availability changes appear immediately; planned or ongoing lesson reassignments require manager approval.
- The manager defines each teacher’s working days and on-site span, with a configurable minimum for each teacher/day. Default the minimum to 180 minutes on a working day. This is on-site elapsed span, including gaps between lessons, not 180 minutes of teaching.
- If a teacher/day falls below its configured on-site minimum, show a manager warning rather than inventing lessons or appointments. Within actual student demand and all schedule constraints, prioritize using available teacher hours efficiently and avoid unnecessary idle gaps.
- For a teacher’s one-off absence, demonstrate automatic temporary cover by the highest-ranked available substitute based on the needed subject, with an in-app notice to the manager. Show all available candidates ranked by subject match and allow the manager to override. If no candidate is available, show an unresolved coverage alert.
- For planned or recurring changes, show suggested replacements for manager approval rather than automatically changing the schedule.
- Do not model aides as scheduled lesson substitutes; aide availability is a separate support pool.

### School timetable and excusal

- Use these exact school periods; preserve the breaks between periods:
  1. 08:15–09:00
  2. 09:00–09:45
  3. 10:00–10:45
  4. 10:50–11:35
  5. 11:45–12:30
  6. 12:50–13:35
  7. 13:40–14:30
- Use each homeroom’s weekly timetable as the default for its students, with student-specific overrides where needed and dated timetable exceptions. A timetable slot includes at least day/period, subject, and classroom when known.
- The manager can mark a timetable slot as normally excusable or not excusable. Allow student-specific and date-specific overrides because some classes cannot be missed for all students, or only for certain students.
- When a tutoring session overlaps a school class, show the student’s missed subject and usual classroom to the teacher. Explain whether the slot is allowed, blocked, or overridden.
- A permitted student/date override can make a previously blocked slot available. Do not treat all students in a grade as having identical excusal permissions.

### Student absence and lesson history

- Staff can mark a student absent for a specific date/session.
- Retain the absence in history. For a one-to-one session, cancel that occurrence and make the teacher’s time available for the manager to reuse. For a group session, record the absent student’s participation as canceled/absent while keeping the session active for the other students; only free the teacher’s whole slot if the group session itself is canceled.
- Do not delete the recurring baseline when a single occurrence is canceled.

## 6. School calendar and notices

- Include exams as dated events associated with a grade and subject.
- Teachers working with that grade and the relevant aide can see upcoming exam information. Highlight an exam when it matches the teacher’s tutoring subject.
- Show exams as in-app alerts and calendar markers. Exams are informational in this version; they do not automatically move or block tutoring sessions.
- Also show school-wide events such as holidays, trips, and assemblies on the calendar. Do not automatically rewrite lesson schedules because of an event.

## 7. Lesson log, class updates, and analytics

### Tutoring session log

- Allow a teacher, manager, or aide to record whether a session happened. For group sessions, record the shared session outcome once and track each student’s attendance/lateness separately.
- Keep the outcome associated with the specific occurrence so daily/weekly/monthly/yearly statistics can be calculated. Keep the logging flow quick and avoid unnecessary narrative notes.

### Shared grade/subject class updates

- Provide a dated feed organized by grade and subject for information useful to multiple students and teachers.
- All staff can post and view updates. An update can include material covered in class, homework and due date, and a helpful practice exercise recommendation.
- Recommended exercises can be entered as short text and/or a URL. File uploads are not needed in this version.
- Keep class updates shared by grade/subject, not as private student notes.

### Statistics

- Give managers school-wide statistics and teachers statistics relevant to their own work.
- Support day, week, month, and year views with clear, useful charts.
- Focus on operational trends: planned versus completed sessions, cancellations, student lateness, and workload.
- Do not add academic grades, mastery scoring, or student assessment tracking in this version.

## 8. Data setup for the prototype

- Seed the prototype with a dense, realistic-looking but clearly fictional school:
  - 16 homerooms: 4 per grade across ט׳–י״ב.
  - 2–5 tutoring students in each homeroom (32–80 students total); each tutored student has 1–4 recurring weekly sessions across different subjects.
  - At least 6 functional tutors, with enough subject coverage and capacity to make the sample schedule feasible.
  - 6 aides, each covering several homerooms.
  - 1–2 upcoming exams per grade.
  - A nearly full Sunday–Thursday tutoring schedule and a lighter Friday schedule focused on advanced subjects and groups. Include both occupied and genuinely available periods, teacher working-day spans, groups, timetable exceptions, and representative conflicts/warnings.
- Render each student’s name as first name plus the first letter of the second name, matching the display rule above.
- Make schedules, session logs, availability, events, and class updates interactive using local mock data (for example, typed fixtures plus local storage).
- Use one coherent, deterministic mock dataset shared across every screen. The same student, group, teacher, time, subject, classroom, location, and status must agree in the manager grid, teacher/aide views, student profile, and statistics; do not generate unrelated random records per render.
- Include a visible **Reset demo data** control.
- Provide manual editing for demo records.
- Include a CSV/Excel import preview using sample/synthetic data if practical. Do not send uploaded content to an external service or treat this frontend demo as approved for importing real student data.
- Keep data access behind a small, replaceable client-side data layer so a backend can be chosen later without tying UI components to local storage.
- Keep the project synced with a private GitHub repository so it can be cloned into VS Code. Commit only source code and synthetic demo fixtures; never commit secrets or real school data.

## 9. Target prototype screens

These are the eventual screens for the full interactive prototype; implement them in the phases above rather than all in the first Build pass.

1. **Manager daily operations:** in Phase 1, today’s sessions, staff/aide availability, schedule conflicts/warnings, and upcoming exams. Add unlogged sessions, reported absences, and broader school events in Phase 2.
2. **Manager schedule tables:** the weekly view is a full matrix with periods as rows and school days as columns. The daily view is a full matrix with periods as rows and teachers as columns. Both support filters for grade, student/group, and subject, quick session creation/editing, and visible excusal/location warnings. Show teacher working/free states clearly; do not compress the desktop table into unreadable cards.
3. **Teacher schedule:** mobile-friendly day/week view with session cards, missed subject/classroom, tutoring location, available aide list, and matching-subject exam markers in Phase 1. Add quick lesson logging in Phase 2.
4. **Aide view:** assigned homerooms and students, relevant schedules/locations, and simple presence/availability status.
5. **Students, staff, groups, and timetable management:** synthetic demo forms and lists for the manager.
6. **School calendar:** exams with grade/subject context in Phase 1; school-wide events in Phase 2.
7. **Class updates:** grade/subject feed for material, homework, due dates, and recommended exercise links.
8. **Statistics:** manager/teacher operational metrics with day/week/month/year filters.
9. **Import preview:** sample CSV/Excel workflow with validation feedback, clearly marked as demo-only.

## 10. Scheduling helper scope for v1

- Do **not** build a full-week optimizer in this first prototype.
- Demonstrate targeted, user-triggered suggestions for a selected session or conflict: possible periods, relevant constraints, and ranked alternatives. If a direct move does not resolve the issue, allow a short, bounded chain of moves.
- Rank a repair with fewer moved sessions and a shorter chain above a more disruptive repair. Preview every affected session before the manager confirms.
- When a teacher change could resolve the issue, show available substitutes ranked by subject match; never change a teacher as part of a repair without manager confirmation.
- Use deterministic, explainable rules rather than an LLM to decide schedule feasibility. Keep the UI responsive; any real search added later should be bounded and cancellable.
- In the prototype, demonstrate suggestions with simple deterministic rules over synthetic state. If a real client-side constraint search is implemented later, run it in a Web Worker with a short time budget and cancellation; keep it isolated so it can move server-side if the data or search grows.
- Distinguish a hard conflict from a warning. A room overlap is a warning; a student/teacher double-booking or a non-excusable class is a conflict unless an authorized override exists.
- Present suggested repairs for review and avoid silently changing the schedule. Do not apply a multi-session repair unless the manager explicitly confirms it.

## 11. Prototype acceptance checks

Use these phase gates instead of trying to finish every feature in the first Build pass.

### Phase 1 — Core scheduling and exams

- All visible application copy is Hebrew and the layout is genuinely RTL on desktop and mobile.
- The light/dark theme toggle works, remains readable in both themes, and remembers the selected theme in the prototype.
- Staff-facing student cards show first name plus the first letter of the second name, never the full second name.
- The week starts Sunday, Friday is visibly lighter, and grades are limited to ט׳–י״ב in the demo data.
- Period start/end times match the seven supplied school periods, with breaks kept between them.
- The weekly schedule table uses days as columns; the daily schedule table uses teachers as columns and periods as rows.
- Teacher on-site minimums are configurable per teacher/day, default to 180 minutes, and count elapsed on-site span including gaps.
- Demo data is dense enough to show a nearly full schedule, teacher availability, groups, Friday exceptions, and useful conflicts.
- Demo data includes 16 homerooms, 2–5 tutored students per homeroom, at least 6 functional tutors, 6 aides, and 1–2 exams per grade.
- The same seeded schedule records appear consistently in manager, teacher, aide, student, and statistics views.
- Grade/subject exams can be entered and shown as in-app notices; matching-subject exams are highlighted for relevant staff.
- The demo role switcher shows distinct manager, teacher, and aide experiences without real authentication.
- A manager can edit a session and see the weekly grid and daily operations view update.
- The helper can preview a direct move or short repair chain, ranked by least disruption, and waits for the manager’s explicit confirmation.
- Group sessions show all students and their independently assigned teacher.
- Teacher session cards show the tutoring location and, when known, the student’s missed subject and school classroom.
- Excusal rules support student/date overrides and explain why a proposed time is allowed or blocked.
- Location overlaps are visible warnings and do not prevent saving a session.
- Aides are shown as available support, not reserved as lesson participants.
- Reset demo data restores a known clean state.
- No Lovable Cloud/Supabase backend is enabled; no real student data is used; the app is not published.

### Phase 2 — School events and lesson operations

- School-wide events such as holidays, trips, and assemblies appear as informational calendar items.
- A one-to-one student absence cancels only that occurrence, keeps its history, and frees the time for manager reuse. An absence from one group participant does not cancel the group session for others.
- Staff can log whether a lesson happened and track each group participant’s attendance/lateness separately.
- A one-off teacher absence temporarily assigns the highest-ranked available substitute by subject match, notifies the manager, and allows the manager to override the choice.

### Phase 3 — Shared knowledge and reporting

- Staff can post a dated grade/subject update with class material, homework, and a text/URL exercise recommendation.
- Statistics show planned/completed/canceled sessions, lateness, and workload over day/week/month/year views.
- The import preview validates synthetic CSV/Excel sample data without connecting to a backend.

## 12. Explicitly deferred

- Choosing Lovable Cloud versus a school-approved Supabase or other backend, including the data-hosting region.
- Real database, authentication/invitations, production role policies, and production CSV imports.
- Entering real student or staff data and publishing the app.
- Full-week schedule optimization.
- Aides managing homeroom assignments themselves.
- Student logins, parent contact, messaging, or phone-number storage.
- Academic assessment or student progress scoring.

Before any real data is entered, confirm the school’s provider, region, access, retention, and privacy requirements. The frontend’s role-specific screens are not a substitute for backend authorization.

## 13. Progress and real-world feedback

- Treat each Phase 1 slice and later phase as a review gate: planned, built, browser-tested, then accepted by the user. Do not call a slice complete just because Lovable generated it.
- After each slice, compare the result with its acceptance criteria, review it in preview, and keep a private GitHub checkpoint before starting the next slice.
- When gathering feedback from managers or staff, ask them to perform a concrete task rather than only asking whether they like the app. Capture the role, task, friction, how often it happens, and its impact.
- Triage feedback before changing the product brief: **blocking/correctness**, **repeated workflow friction**, or **later enhancement**. Do not add a suggestion automatically; update this brief and its acceptance criteria only after deciding it belongs in scope.
- Keep screenshots, sample records, and feedback free of real student identifiers. Use synthetic data for demonstrations until the school’s data requirements are approved.

### Progress checklist

- [ ] Full Plan reviewed and approved; no backend enabled.
- [ ] Phase 1A — product shell — built, browser-tested, and accepted.
- [ ] Phase 1B — manager schedule — built, browser-tested, and accepted.
- [ ] Phase 1C — schedule context and staff views — built, browser-tested, and accepted.
- [ ] Phase 1D — exams and helper — built, browser-tested, and accepted.
- [ ] Phase 2 — school events and lesson operations — built, browser-tested, and accepted.
- [ ] Phase 3 — shared knowledge and reporting — built, browser-tested, and accepted.
- [ ] Backend and hosting decision revisited only after school requirements are confirmed.