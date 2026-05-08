# Module Reference

## Onboarding `/onboarding` (public)

First-run wizard and school switcher. Accessible at any time — not protected by the route guard.

**Select mode** — search bar + scrollable list of all registered schools. Clicking a school calls `POST /api/school/switch` and redirects to the dashboard scoped to that school.

**Create mode** — 3-step wizard:
1. School name, motto, EMIS code, curriculum type (GES / Cambridge / IB / American / French / Mixed)
2. Address, region, district, phone, email, website
3. Review and submit → `POST /api/onboarding/complete`

Admins return here to add schools or switch between tenants.

---

## Dashboard `/dashboard`

Landing page after login. Shows live statistics for the active school:

- Total students, teachers, employees, classes
- Today's attendance count
- Current month revenue
- Attendance trend chart (last 30 days)
- Recent announcements
- AI-generated summary (requires `ANTHROPIC_API_KEY`)

Data from `GET /api/dashboard?full=true`.

---

## Students `/students`

Full student lifecycle management.

### Student List
- Search by name
- Filter by status (Active / Inactive / Graduated / Transferred)
- Pagination (10 per page)
- Actions: Edit, View profile, Delete

### Student Profile `/students/[id]`

Tabbed detail view:

| Tab | Contents |
|-----|----------|
| **Overview** | Name, DOB, roll number, class, grade level, status, contact, guardian |
| **Academic** | Enrolment history, class assignments |
| **Attendance** | Attendance record for current term with percentage |
| **Fees** | Fee invoices and payment status |
| **Medical** | Blood type, allergies, conditions, medications, vaccinations |
| **Disciplinary** | Incidents, sanctions, resolution status |

**Fields**: First name, last name, date of birth, gender, roll number, enrolment date, status, class, grade level, email, phone, address, guardian name/phone/email, parent link.

---

## Teachers `/teachers`

Teaching staff management.

**Fields**: Title, first name, last name, email, phone, date of birth, gender, qualification, specialization, hire date, employee ID.

List supports search and status filter. Teachers can be linked to subjects via the Subjects module and to classes via Timetable.

---

## Employees `/employees`

Non-teaching staff management.

**Fields**: First name, last name, email, phone, position, department, date of birth, employment type, contract dates.

Filter by department. Stats card shows total and active employees.

---

## Parents `/parents`

Guardian profiles.

**Fields**: First name, last name, email, phone, address, relationship.

Parents can be linked to one or more students. Linked parents with user accounts can access the Parent Portal.

---

## Classes `/classes`

Manage classrooms.

**Fields**: Class name, section, grade level, capacity, room number, assigned teacher, academic year.

Students are enrolled via the Enrollments module. Subjects are assigned via the Timetable module.

---

## Subjects `/subjects`

Course catalogue.

**Fields**: Subject name, subject code, description, grade level.

Subject codes appear on report cards and in the gradebook (e.g. MATH, ENG, SCI).

---

## Departments `/departments`

Academic departments.

**Fields**: Department name, description, head of department (linked to an employee).

---

## Enrollments `/enrollments`

Links students to classes.

**Fields**: Student, class, academic year, term, roll number, enrolment date, status (Active / Withdrawn / Completed / Deferred).

Enrollment is required before attendance or exam marks can be recorded for a student.

---

## Attendance `/attendance`

Daily attendance recording.

### Marking Attendance
1. Select a date and class
2. Each enrolled student appears with Present / Absent / Late / Excused radio buttons
3. Submit marks all records in bulk via `POST /api/attendance`

### Attendance Trends
Line chart showing daily attendance rates over the last 30 days.

**Status codes**: 1=Present, 2=Absent, 3=Late, 4=Excused.

---

## Gradebook `/gradebook`

Enter and review continuous assessment scores using the GES framework.

### Filter Bar (cascading)
Class → Subject → Academic Year → Term

### Score Entry

| Column | Assessment Type | Role in Final Score |
|--------|----------------|-------------------|
| Classwork | 1 | Included in 30% class score |
| Homework | 2 | Included in 30% class score |
| Quiz | 3 | Informational only |
| MidTerm | 4 | Included in 30% class score |
| End of Term | 5 | Exam score (70%) |
| Project | 6 | Informational only |

Click any cell to edit the score (0–100). **Save All** bulk-upserts all changes.

The Computed Grade column applies the GES formula and shows the letter grade (A1–F9) in real time.

---

## Exams `/exams`

Exam scheduling and result entry.

### Exams Tab
**Fields**: Name, exam type (Quiz / Midterm / Final / Practical), start date, end date, total marks, pass marks, weight %, venue, description, class, term, academic year.

### Results Tab
Enter scores per student per exam. Percentage and grade letter are auto-calculated. Pass/fail is determined against the exam's `passmarks`.

---

## Report Cards `/reports/report-card`

Generates GES-compliant termly report cards.

**Step 1** — Select: Academic Year → Term → Class → Student → Generate.

**Step 2** — `/reports/report-card/[studentId]`

Report sections:
1. School header (name, logo)
2. Student info (name, roll number, class, term, date)
3. Subject table: Class Score (30%) | Exam Score (70%) | Total | Grade | Remarks
4. Summary: average score, overall grade, total subjects
5. GES grade scale reference

Print button opens the browser print dialog. Sidebar and nav are hidden via `@media print`.

---

## Fees `/fees`

Fee structures and invoicing hub.

**Fee types**: Tuition, Examination, Development, Feeding, Transport, Boarding, Activity, Other.

---

## Finance

### Fee Types `/setup/fee-types`
Configurable fee categories. Create types before building fee structures.

### Fee Structures `/finance/fee-structures`
Templates linking fee type + amount + grade level + academic year + term.

### Fee Invoices `/finance/fees`
Individual invoices issued to students. Status: Pending / Paid / Partial / Waived / Overdue.

### Fee Payments `/finance/fee-payments`
Payment recording with receipt generation. Methods: Cash, Mobile Money, Bank Transfer, Cheque, Other. Receipt numbers auto-generated (`RCP-<timestamp>-<random>`) if not provided.

### Scholarships `/finance/scholarships`
**Fields**: Name, type (Full / Partial / Bursary), amount, percentage, conditions, sponsor, start date, end date, student.

---

## Library `/library`

Book catalogue and loan tracking.

### Books Tab
**Fields**: Title, author, ISBN, publisher, year, genre, quantity, location.

### Loans Tab
**Fields**: Book, borrower (student), issue date, due date, return date, status (Issued / Returned / Overdue / Lost).

---

## Timetable `/timetable`

Class schedule management.

**Fields**: Class, subject, teacher, day of week (Mon–Fri), start time, end time.

Displayed as colour-coded period blocks.

---

## Health Records `/health`

Student medical records.

**Fields**: Student, condition, treatment date, medication, remarks.

Medical clearance appears on the student profile and feeds into pool session eligibility.

---

## Disciplinary `/disciplinary`

Student disciplinary case management.

**Fields**: Student, incident date, category, description, action taken, resolved (boolean), parent notified (boolean).

---

## Staff Leave `/staff-leave`

Leave application and approval tracking.

**Fields**: Staff member, leave type, start date, end date, reason, status (Pending / Approved / Declined).

---

## Activities `/activities`

Extra-curricular activity management.

**Fields**: Activity name, type (Sport / Club / Arts / Academic / Other), teacher in charge, schedule, description.

Students can be enrolled in activities. Awards and achievements can be recorded.

---

## Announcements `/announcements`

School-wide notice board.

**Fields**: Title, body, audience (All / Students / Parents / Staff), publish date, expiry date, pinned (boolean).

Pinned announcements appear at the top of the portal.

---

## Inventory `/inventory`

Stock and asset tracking.

**Fields**: Item name, category, unit, quantity, reorder level, location, description.

Record stock receipts (in) and issues (out). Physical counts can be reconciled via adjustments.

---

## Procurement `/procurement`

Purchase order management.

**Fields**: Item, quantity, supplier, unit price, total amount, status (Pending / Approved / Rejected / Received), notes.

Approving and marking as received updates inventory stock automatically.

---

## Transport `/transport`

School vehicle and route management.

**Fields**: Registration number, make/model, capacity, driver name, driver phone, maintenance due date, status.

Student route assignments are managed per term.

---

## Swimming Pool `/pool`

Pool session and rental management.

**Tabs**: Sessions (create swim groups and sessions), Rentals (external pool hire), Transactions (revenue tracking).

Medical clearance from the Health module is required before assigning a student to any pool session.

---

## Reports `/reports`

### Summary Reports
- Attendance summary by class or period
- Academic performance summary by term
- Fee collection and outstanding balance reports

### National Exams `/reports/national-exams`
BECE / WASSCE entry tracking — candidate index numbers, results entry, pass rate analysis.

---

## Parent Portal `/portal`

Read-only view for parents with portal user accounts:
- Pinned and recent school announcements
- Child's attendance and academic summary

---

## Setup Modules

### School Profile `/setup/school-profile`
Name, motto, logo, brand colours, EMIS code, curriculum type, contact details, campus branches. Includes a school switcher dropdown when multiple schools are registered.

### Academic Years `/setup/academic-years`
**Fields**: Name (e.g. 2025-2026), start date, end date, is current, description. Each school has its own set of academic years. The current year is scoped per school.

### Terms `/setup/terms`
**Fields**: Name, academic year, term number, start date, end date.

### Grade Levels `/setup/grade-levels`
**Fields**: Name, level number, description.

Set the `levelnumber` carefully — it determines promotion order.

### Promotions `/setup/promotions`

End-of-year workflow:
1. Select academic year and grade level
2. Set each student's decision: Promoted / Retained / Transferred / Graduated
3. For promoted students: select the target class
4. **Apply Promotions** creates `sms_promotions` audit records and updates student grade/class

### Programme Tracks `/setup/programme-tracks`
Curriculum tracks (e.g. General Science, Business) for differentiated SHS programmes.

### Houses & Streams `/setup/houses`
Student house or stream assignments for pastoral care and competitions.

### Fee Types `/setup/fee-types`
Create fee categories before building fee structures.

### User Management `/setup/users`
Create and manage per-school system user accounts with role assignment. Roles: Admin, Teacher, Finance, Inventory Manager, Transport Manager, Pool Attendant, Parent, Kitchen Attendant.
