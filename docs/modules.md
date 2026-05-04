# Module Reference

## Dashboard `/dashboard`

The landing page after login. Shows live statistics:

- Total students, teachers, employees, classes
- Today's attendance count
- Current month revenue
- Recent announcements
- Attendance trend chart (last 30 days)
- AI-generated summary (requires `ANTHROPIC_API_KEY`)

Data comes from `GET /api/dashboard?full=true`.

---

## Students `/students`

Full student lifecycle management.

### Student List
- Search by name
- Filter by status (Active / Inactive / Graduated / Transferred)
- Pagination (10 per page)
- Quick actions: Edit, View profile, Delete

### Student Profile `/students/[id]`

Tabbed detail view with six tabs:

| Tab | Contents |
|-----|----------|
| **Overview** | Name, date of birth, roll number, class, grade level, status, contact, guardian |
| **Academic** | Enrolment history, class assignments |
| **Attendance** | Attendance record for current term with percentage |
| **Fees** | Fee invoices and payment status |
| **Medical** | Blood type, allergies, chronic conditions, medications, vaccinations, last check-up |
| **Disciplinary** | Incident date, type, description, action taken, resolved status |

### Add Student `/students/add`

Full creation form with fields:
- First name, last name, date of birth, gender
- Roll number, enrolment date, status
- Class and grade level assignment
- Email, phone, address
- Guardian name, phone, email
- Parent link

---

## Teachers `/teachers`

Teaching staff management.

**Fields**: Title, first name, last name, email, phone, date of birth, gender, qualification, specialization, hire date, employee ID.

List supports search and status filter. Each teacher can be linked to subjects and classes via the Timetable and Subjects modules.

---

## Employees `/employees`

Non-teaching staff management.

**Fields**: First name, last name, email, phone, position, date of birth, department.

Filter by department. Stats card shows total and active employees.

---

## Classes `/classes`

Manage classrooms.

**Fields**: Class name, section, grade level, capacity, room number, assigned teacher, academic year.

Each class can have students enrolled (via Enrollments) and subjects assigned (via Timetable).

---

## Subjects `/subjects`

Course catalogue.

**Fields**: Subject name, subject code, description.

Subjects are assigned to classes through the Timetable module.

---

## Departments `/departments`

Administrative departments.

**Fields**: Department name, description, head of department (linked to an employee).

---

## Enrollments `/enrollments`

Links students to classes.

**Fields**: Student, class, academic year, roll number, enrolment date, enrolment status (Active / Withdrawn / Completed / Deferred).

---

## Attendance `/attendance`

Daily attendance recording.

### Marking Attendance
1. Select a date and class
2. Each enrolled student appears with Present / Absent / Late / Excused radio buttons
3. Submit marks all records in bulk via `POST /api/attendance`

### Attendance Trends
A line chart shows daily attendance rates over the last 30 days (configurable).

**Status codes**: 1 = Present, 2 = Absent, 3 = Late, 4 = Excused.

---

## Gradebook `/gradebook`

Enter and review continuous assessment scores following the GES framework.

### Filter Bar (cascading)
Class → Subject → Academic Year → Term

### Score Entry
Once filters are selected, a table shows all students in the class. Columns correspond to assessment types:

| Column | Type Code | Weight in Class Score |
|--------|-----------|----------------------|
| Classwork | 1 | Included in 30% |
| Homework | 2 | Included in 30% |
| Quiz | 3 | — (informational) |
| MidTerm | 4 | Included in 30% |
| End of Term | 5 | Maps to Exam Score (70%) |
| Project | 6 | — (informational) |

Click any cell to edit the score (0–100). **Save All** bulk-upserts all changes.

### Grade Computation
The Computed Grade column applies the GES formula and displays the letter grade (A1–F9) in real time.

---

## Exams `/exams`

Exam scheduling and result entry.

### Exams Tab
Create and manage exams:
- **Fields**: Name, exam type, start date, end date, total marks, pass marks, weight %, venue, description
- **Exam types**: 1 = Quiz, 2 = Midterm, 3 = Final, 4 = Practical

### Results Tab
Enter scores for each student per exam:
- **Fields**: Student, exam, score, remarks
- Percentage and grade letter are auto-calculated: `(score / totalmarks) × 100`
- Pass/fail determined by comparing percentage against exam's `passmarks`

---

## Report Cards `/reports/report-card`

Generates GES-compliant termly report cards.

### Step 1 — Selection Page
Choose: Academic Year → Term → Class → Student, then click **Generate Report Card**.

### Step 2 — Report Card Page `/reports/report-card/[studentId]`

Displays and prints the student's full term report.

**Report sections:**

1. **School Header** — school name and logo
2. **Student Info** — name, roll number, class, term, academic year, date printed
3. **Subject Table**:

   | Subject | Class Score (30%) | Exam Score (70%) | Total | Grade | Remarks |
   |---------|-------------------|------------------|-------|-------|---------|

   - Class Score = average of Classwork, Homework, MidTerm grades
   - Exam Score = End-of-Term exam result
   - Remarks derived from grade: Excellent (A1), Very Good (B2), Good (B3), Credit (C4–C6), Pass (D7–E8), Fail (F9)

4. **Summary** — average score, overall grade, total subjects
5. **GES Grade Scale** reference table

**Print** — Click the Print button to open the browser print dialog. Sidebar and navigation are hidden via `@media print` CSS for a clean output.

---

## Fees `/fees`

Overview of fee structures linked to grade levels.

Lists fee structures with type, amount, due date, and grade level. Administrators can create, edit, and delete structures here.

**Fee types**: Tuition, Examination, Development, Feeding, Transport, Boarding, Activity, Other.

---

## Finance

### Fee Structures `/finance/fee-structures`
Manage fee templates: amount, type, due date, academic year, grade level.

### Fee Invoices `/finance/fees`
Individual fee invoices issued to students:
- **Fields**: Student, fee structure, amount due, due date, status (Pending / Paid / Partial / Waived / Overdue)

### Fee Payments `/finance/fee-payments`
Record actual payments against invoices:
- **Fields**: Fee invoice, student, amount, payment date, method (Cash, Mobile Money, Bank Transfer, Cheque, Other), status, transaction ID, receipt number
- Receipt numbers auto-generated if not provided: `RCP-<timestamp>-<random>`

### Scholarships `/finance/scholarships`
Scholarship awards:
- **Fields**: Name, description, type (Full / Partial / Bursary), amount, percentage, conditions, sponsor, start date, end date, student
- Scholarship type determines whether a fixed amount or percentage is applied

---

## Library `/library`

Book inventory and loan tracking.

### Books Tab
Catalogue of available books:
- **Fields**: Title, author, ISBN, publisher, year, genre, quantity, location

### Loans Tab
Track book loans:
- **Fields**: Book, borrower (student), issue date, due date, return date (filled on return), status (Issued / Returned / Overdue / Lost)

---

## Timetable `/timetable`

Class schedule management:
- **Fields**: Class, subject, teacher, day of week, start time, end time
- Displayed with colour-coded period blocks

---

## Setup Modules

### Academic Years `/setup/academic-years`
Define academic years (e.g. 2024–2025). Mark one as the current year.

**Fields**: Name, start date, end date, is current.

### Terms `/setup/terms`
Define terms within an academic year (e.g. Term 1, Term 2, Term 3).

**Fields**: Name, academic year, term number, start date, end date.

### Grade Levels `/setup/grade-levels`
Define the school's grade structure (e.g. KG1, Primary 1, JHS 1, SHS 1).

**Fields**: Name, level number, description.

### Promotions `/setup/promotions`

End-of-year workflow to advance students to the next grade level.

**Step 1** — Select academic year and grade level to promote from.

**Step 2** — A table lists all students in that grade with:
- Name, roll number, average grade, attendance %
- Status dropdown: Promoted / Retained / Transferred / Graduated
- For promoted students: select the target class

**Step 3** — **Apply Promotions** triggers a bulk operation:
- Creates `sms_promotions` records for audit trail
- Updates each student's grade level and class assignment
- Sets status to "Graduated" for students at the final grade

**History Tab** — View all past promotions filterable by academic year and grade.
