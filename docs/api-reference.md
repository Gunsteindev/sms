# API Reference

All endpoints are under `/api/`. Every response follows the shape:

```json
{ "success": true,  "data": <payload> }
{ "success": false, "error": "<message>" }
```

Unauthenticated requests return `401 { "success": false, "error": "Unauthorized" }`.  
Requests by a role without access to the path return `403 { "success": false, "error": "Forbidden" }`.  
Validation errors return `400` with a field-level error string.  
Server errors return `500 { "success": false, "error": "Internal server error" }` (full message in development only).

Single-record reads/updates/deletes for a record that belongs to **another school** return `404` (cross-tenant isolation).

All data endpoints are automatically scoped to the active school via the `x-school-id` header (injected by `src/proxy.ts`). No client needs to pass a school ID explicitly.

---

## Authentication

### `POST /api/auth/login`
Log in. Checks bootstrap admin (env vars) first, then Dataverse `sms_users`.

**Body**
```json
{ "email": "admin@school.edu.gh", "password": "secret" }
```

**Response** — sets `sms.session` cookie (httpOnly, 24 h)
```json
{ "ok": true, "userrole": 1 }
```

**Rate limited**: per IP (50 / 15 min) and per IP+email (10 / 15 min). Over the limit → `429 { "error": "Too many login attempts. Please try again later." }` with a `Retry-After` header.

---

### `POST /api/auth/logout`
Clear the session cookie.

**Response**: `{ "ok": true }`

---

### `GET /api/auth/session`
Return the current session user.

**Response**
```json
{
  "user": {
    "userid": "...",
    "email": "admin@greyacademy.edu.gh",
    "name": "Grey Academy Admin",
    "role": "Admin",
    "userrole": 1,
    "schoolId": "3a5c5d93-b948-f111-bec6-7ced8d6e6816"
  },
  "expires": "2026-05-09T10:00:00.000Z"
}
```

---

## School

### `GET /api/school`
Return the active school's profile (name, motto, logo, colours, address, EMIS code, type, level).

### `GET /api/school/list`
Return all registered schools (id + name). Used by the onboarding switcher.

### `POST /api/school/switch`
Switch the active school. Re-issues the JWT with the new `schoolId`.

**Body**: `{ "schoolId": "<guid>" }`

### `PUT /api/school`
Update the active school's profile.

### `PUT /api/school/[id]` (super admin only)
Update a school's module configuration. Accepts either or both fields:

**Body**
```json
{
  "enabledmodules": ["students", "fees", "..."],
  "rolemoduleaccess": { "2": ["students", "classes"], "3": ["fees"] }
}
```
`rolemoduleaccess` keys are role numbers; values are module keys. Returns `403` for non-super-admin callers.

---

## Parent Portal

Parent-facing endpoints. The caller must be a parent linked to the student; otherwise `403`.

### `GET /api/portal/children`
List the logged-in parent's linked children.

**Response**: `{ "success": true, "data": [{ "studentid", "studentname", "isprimary" }], "parentFound": true, "parentName": "..." }`

### `GET /api/portal/children/[studentId]`
Full per-child summary: `classInfo`, attendance (+summary), grades, fees (+summary), disciplinary, terms, and the term report card.

| Query Param | Description |
|-------------|-------------|
| `termId` | Report card term (defaults to the most recent) |

### `GET /api/portal/feedback`
List the parent's submitted feedback.

### `POST /api/portal/feedback`
Submit feedback. **Fields**: `subject`, `message`, `feedbacktype` (1=Feedback, 2=Complaint, 3=Suggestion, 4=Question), optional `studentid` (must be the parent's child).

---

## Onboarding

### `POST /api/onboarding/complete`
Complete the school registration wizard. Creates the school record and sets it as the active session school.

**Body**: full school profile fields (name, motto, address, region, district, type, level, email, phone, website, emiscode)

---

## Students

### `GET /api/students`
| Query Param | Type | Description |
|-------------|------|-------------|
| `search` | string | Filter by name |
| `status` | number | 1=Active, 2=Inactive, 3=Graduated, 4=Transferred |
| `classid` | string | Filter by class GUID |
| `stats` | `true` | Return aggregate statistics |

**Response**: `{ "success": true, "data": [...], "totalCount": 120 }`

### `POST /api/students`
**Required**: `firstname`, `lastname`, `dateofbirth`, `enrollmentdate`  
**Optional**: `gender`, `studentstatus`, `classid`, `gradelevelid`, `address`, `phone`, `email`, `rollnumber`, `parentid`

### `GET /api/students/[id]`
### `PUT /api/students/[id]`
### `DELETE /api/students/[id]`

---

## Teachers

### `GET /api/teachers`
| Query Param | Description |
|-------------|-------------|
| `search` | Filter by name |
| `stats` | `true` — return statistics |

### `POST /api/teachers`
**Required**: `firstname`, `lastname`, `email`, `dateofbirth`, `gender`, `hiredate`, `qualification`, `specialization`  
**Optional**: `phone`, `address`, `employeeid`

### `GET /api/teachers/[id]`
### `PUT /api/teachers/[id]`
### `DELETE /api/teachers/[id]`

---

## Employees

### `GET /api/employees`
| Query Param | Description |
|-------------|-------------|
| `department` | Filter by department name |
| `stats` | `true` — return statistics |

### `POST /api/employees`
### `GET /api/employees/[id]`
### `PUT /api/employees/[id]`
### `DELETE /api/employees/[id]`

---

## Parents

### `GET /api/parents`
### `POST /api/parents`
**Fields**: `firstname`, `lastname`, `email`, `phone`, `address`, `relationship`

### `GET /api/parents/[id]`
### `PUT /api/parents/[id]`
### `DELETE /api/parents/[id]`

### `GET /api/student-parents`
| Query Param | Description |
|-------------|-------------|
| `studentid` | Get parents of a student |
| `parentid` | Get students of a parent |

### `POST /api/student-parents`
**Fields**: `studentid`, `parentid`, `relationship`, `isprimary`

### `PUT /api/student-parents/[id]`
### `DELETE /api/student-parents/[id]`

---

## Classes

### `GET /api/classes`
| Query Param | Description |
|-------------|-------------|
| `stats` | `true` — return class count statistics |

### `POST /api/classes`
**Required**: `classname`, `capacity`  
**Optional**: `roomnumber`, `gradelevelid`, `teacherid`, `academicyearid`, `description`

### `GET /api/classes/[id]`
### `PUT /api/classes/[id]`
### `DELETE /api/classes/[id]`

---

## Subjects

### `GET /api/subjects`
### `POST /api/subjects`
### `GET /api/subjects/[id]`
### `PUT /api/subjects/[id]`
### `DELETE /api/subjects/[id]`

---

## Departments

### `GET /api/departments`
### `POST /api/departments`
### `GET /api/departments/[id]`
### `PUT /api/departments/[id]`
### `DELETE /api/departments/[id]`

---

## Enrollments

### `GET /api/enrollments`
### `POST /api/enrollments`
**Fields**: `studentid`, `classid`, `academicyearid`, `termid`, `enrollmentdate`, `rollnumber`, `enrollmentstatus`

### `GET /api/enrollments/[id]`
### `PUT /api/enrollments/[id]`
### `DELETE /api/enrollments/[id]`

---

## Attendance

### `GET /api/attendance`
| Query Param | Description |
|-------------|-------------|
| `date` | YYYY-MM-DD — filter by date |
| `classid` | Filter by class |
| `trends` | `true` — return daily trend data |
| `days` | Number of days for trends (default 30, max 365) |

### `POST /api/attendance`
Bulk submit attendance records.

**Body**
```json
{
  "records": [
    { "studentid": "...", "date": "2026-05-08", "attendancestatus": 1, "classid": "..." }
  ]
}
```

**Status**: 1=Present, 2=Absent, 3=Late, 4=Excused

### `PUT /api/attendance/[id]`
### `DELETE /api/attendance/[id]`

---

## Grades

### `GET /api/grades`
| Query Param | Description |
|-------------|-------------|
| `classid` | Filter by class |
| `subjectid` | Filter by subject |
| `termid` | Filter by term |
| `academicyearid` | Filter by academic year |
| `studentid` | Filter by student |
| `assessmenttype` | 1=Classwork, 2=Homework, 3=Quiz, 4=MidTerm, 5=EndOfTerm, 6=Project |

### `POST /api/grades`
Single grade or bulk array (include `gradeid` to update existing):

```json
[
  { "gradeid": "existing-id", "assessmenttype": 1, "score": 75, "studentid": "...", "subjectid": "...", "classid": "...", "termid": "...", "academicyearid": "..." },
  { "assessmenttype": 2, "score": 80, ... }
]
```

**Response**: `{ "success": true, "data": { "saved": 12 } }`

### `GET /api/grades/[id]`
### `PUT /api/grades/[id]`
### `DELETE /api/grades/[id]`

---

## Exams

### `GET /api/exams`
| Query Param | Description |
|-------------|-------------|
| `search` | Filter by exam name |
| `classid` | Filter by class |
| `termid` | Filter by term |

### `POST /api/exams`
**Required**: `name`, `examtype`, `startdate`, `enddate`  
**Exam types**: 1=Quiz, 2=Midterm, 3=Final, 4=Practical  
**Optional**: `classid`, `termid`, `academicyearid`, `totalmarks`, `passmarks`, `weightpercent`, `venue`, `description`

### `GET /api/exams/[id]`
### `PUT /api/exams/[id]`
### `DELETE /api/exams/[id]`

### `GET /api/exams/results`
### `POST /api/exams/results`
**Fields**: `examid`, `studentid`, `score`, `remarks`

### `GET /api/exams/results/[id]`
### `PUT /api/exams/results/[id]`
### `DELETE /api/exams/results/[id]`

---

## Academic Years

### `GET /api/academic-years`
| Query Param | Description |
|-------------|-------------|
| `search` | Filter by name |

Results are automatically scoped to the active school.

### `POST /api/academic-years`
**Fields**: `name`, `startdate`, `enddate`, `iscurrent`, `description`

### `GET /api/academic-years/[id]`
### `PUT /api/academic-years/[id]`
### `DELETE /api/academic-years/[id]`

---

## Terms

### `GET /api/terms`
| Query Param | Description |
|-------------|-------------|
| `search` | Filter by name |
| `academicyearid` | Filter by academic year |

### `POST /api/terms`
**Fields**: `name`, `termnumber`, `academicyearid`, `startdate`, `enddate`

### `GET /api/terms/[id]`
### `PUT /api/terms/[id]`
### `DELETE /api/terms/[id]`

---

## Grade Levels

### `GET /api/grade-levels`
### `POST /api/grade-levels`
**Fields**: `name`, `levelnumber`, `description`

### `GET /api/grade-levels/[id]`
### `PUT /api/grade-levels/[id]`
### `DELETE /api/grade-levels/[id]`

---

## Finance — Fee Types

### `GET /api/fee-types`
### `POST /api/fee-types`
**Fields**: `name`, `description`, `ismandatory`

### `GET /api/fee-types/[id]`
### `PUT /api/fee-types/[id]`
### `DELETE /api/fee-types/[id]`

---

## Finance — Fee Structures

### `GET /api/finance/fee-structures`
| Query Param | Description |
|-------------|-------------|
| `gradelevelid` | Filter by grade level |
| `academicyearid` | Filter by academic year |

### `POST /api/finance/fee-structures`
### `GET /api/finance/fee-structures/[id]`
### `PUT /api/finance/fee-structures/[id]`
### `DELETE /api/finance/fee-structures/[id]`

---

## Finance — Fee Invoices

### `GET /api/finance/fees`
### `POST /api/finance/fees`
**Fields**: `studentid`, `feestructureid`, `amountdue`, `duedate`, `feestatus`, `academicyearid`, `termid`

### `GET /api/finance/fees/[id]`
### `PUT /api/finance/fees/[id]`
### `DELETE /api/finance/fees/[id]`

---

## Finance — Fee Payments

### `GET /api/finance/fee-payments`
| Query Param | Description |
|-------------|-------------|
| `studentid` | Filter by student |
| `status` | Filter by payment status |
| `pageSize` | Records per page |

### `POST /api/finance/fee-payments`
**Required**: `studentid`, `feeid`, `amount`, `paymentdate`, `paymentmethod`  
**Payment methods**: 1=Cash, 2=Mobile Money, 3=Bank Transfer, 4=Cheque, 5=Other  
**Optional**: `transactionid`, `receiptnumber` (auto-generated if omitted: `RCP-<timestamp>-<random>`)

### `GET /api/finance/fee-payments/[id]`
### `PUT /api/finance/fee-payments/[id]`
### `DELETE /api/finance/fee-payments/[id]`

---

## Finance — Scholarships

### `GET /api/finance/scholarships`
### `POST /api/finance/scholarships`
**Fields**: `name`, `scholarshiptype`, `amount`, `percentage`, `studentid`, `startdate`, `enddate`, `conditions`, `sponsoredby`

### `GET /api/finance/scholarships/[id]`
### `PUT /api/finance/scholarships/[id]`
### `DELETE /api/finance/scholarships/[id]`

---

## Library

### `GET /api/library`
### `POST /api/library`
**Fields**: `title`, `author`, `isbn`, `publisher`, `year`, `genre`, `quantity`, `location`

### `GET /api/library/[id]`
### `PUT /api/library/[id]`
### `DELETE /api/library/[id]`

### `GET /api/library/loans`
### `POST /api/library/loans`
**Fields**: `bookid`, `studentid`, `issuedate`, `duedate`, `status`

### `GET /api/library/loans/[id]`
### `PUT /api/library/loans/[id]`
### `DELETE /api/library/loans/[id]`

---

## Inventory

### `GET /api/inventory`
### `POST /api/inventory`
**Fields**: `name`, `category`, `unit`, `quantity`, `reorderlevel`, `location`, `description`

### `GET /api/inventory/[id]`
### `PUT /api/inventory/[id]`
### `DELETE /api/inventory/[id]`

---

## Procurement

### `GET /api/procurement`
### `POST /api/procurement`
**Fields**: `item`, `quantity`, `supplier`, `unitprice`, `totalamount`, `status`, `notes`

### `GET /api/procurement/[id]`
### `PUT /api/procurement/[id]`
### `DELETE /api/procurement/[id]`

---

## Transport

### `GET /api/transport`
### `POST /api/transport`
**Fields**: `registration`, `make`, `model`, `capacity`, `drivername`, `driverphone`, `maintenancedue`, `status`

### `GET /api/transport/[id]`
### `PUT /api/transport/[id]`
### `DELETE /api/transport/[id]`

---

## Pool

### `GET /api/pool/sessions`
### `POST /api/pool/sessions`
### `GET /api/pool/sessions/[id]`
### `PUT /api/pool/sessions/[id]`
### `DELETE /api/pool/sessions/[id]`

### `GET /api/pool/rentals`
### `POST /api/pool/rentals`
### `GET /api/pool/rentals/[id]`
### `PUT /api/pool/rentals/[id]`
### `DELETE /api/pool/rentals/[id]`

### `GET /api/pool/transactions`
### `POST /api/pool/transactions`

---

## Staff Leave

### `GET /api/staff-leave`
| Query Param | Description |
|-------------|-------------|
| `status` | Filter by approval status |

### `POST /api/staff-leave`
**Fields**: `staffid`, `leavetype`, `startdate`, `enddate`, `reason`, `status`

### `GET /api/staff-leave/[id]`
### `PUT /api/staff-leave/[id]`
### `DELETE /api/staff-leave/[id]`

---

## Activities

### `GET /api/activities`
### `POST /api/activities`
**Fields**: `name`, `type`, `teacherid`, `schedule`, `description`

### `GET /api/activities/[id]`
### `PUT /api/activities/[id]`
### `DELETE /api/activities/[id]`

---

## Announcements

### `GET /api/announcements`
### `POST /api/announcements`
**Fields**: `title`, `body`, `audience`, `publishdate`, `expirydate`, `ispinned`

### `GET /api/announcements/[id]`
### `PUT /api/announcements/[id]`
### `DELETE /api/announcements/[id]`

---

## Disciplinary Records

### `GET /api/disciplinary`
| Query Param | Description |
|-------------|-------------|
| `studentid` | Filter by student |

### `POST /api/disciplinary`
**Fields**: `studentid`, `incidentdate`, `category`, `description`, `actiontaken`, `resolved`, `parentnotified`

### `GET /api/disciplinary/[id]`
### `PUT /api/disciplinary/[id]`
### `DELETE /api/disciplinary/[id]`

---

## Medical Records

### `GET /api/medical`
| Query Param | Description |
|-------------|-------------|
| `studentid` | Filter by student |

### `POST /api/medical`
**Fields**: `studentid`, `condition`, `treatmentdate`, `remarks`, `medication`

### `GET /api/medical/[id]`
### `PUT /api/medical/[id]`
### `DELETE /api/medical/[id]`

---

## Timetable

### `GET /api/timetable`
### `POST /api/timetable`
**Fields**: `classid`, `subjectid`, `teacherid`, `day` (1=Mon … 5=Fri), `starttime` (HH:MM), `endtime`

### `GET /api/timetable/[id]`
### `PUT /api/timetable/[id]`
### `DELETE /api/timetable/[id]`

---

## Promotions

### `GET /api/promotions`
| Query Param | Description |
|-------------|-------------|
| `academicyearid` | Filter by academic year |
| `gradelevelid` | Filter by grade level |

### `POST /api/promotions`
### `GET /api/promotions/[id]`
### `PUT /api/promotions/[id]`
### `DELETE /api/promotions/[id]`

### `POST /api/promotions/bulk`
Bulk-create promotion records and update student grade/class assignments.

**Body**
```json
{
  "academicyearid": "...",
  "promotions": [
    {
      "studentid": "...",
      "status": 1,
      "fromgradelevelid": "...",
      "togradelevelid": "...",
      "fromclassid": "...",
      "toclassid": "...",
      "remarks": ""
    }
  ]
}
```
**Status**: 1=Promoted, 2=Retained, 3=Transferred, 4=Graduated

---

## Users

### `GET /api/users`
| Query Param | Description |
|-------------|-------------|
| `role` | Filter by userrole number (1–8) |

### `POST /api/users`
**Fields**: `name`, `email`, `password`, `userrole`, `relatedrecord`

### `GET /api/users/[id]`
### `PUT /api/users/[id]`
**Updatable**: `name`, `email`, `password`, `userrole`, `isactive`, `relatedrecord`

### `DELETE /api/users/[id]`

---

## Reports

### `GET /api/reports/report-card`
Generate a student's term report card data.

| Query Param | Required | Description |
|-------------|----------|-------------|
| `studentId` | Yes | Student GUID |
| `termId` | No | Term GUID — if omitted, aggregates all grades |

**Response**
```json
{
  "success": true,
  "data": {
    "student": { "studentid": "...", "firstname": "...", "lastname": "...", "rollnumber": "..." },
    "termId": "...",
    "subjectRows": [
      {
        "subjectid": "...",
        "subjectname": "Mathematics",
        "subjectcode": "MATH",
        "classScore": 76.5,
        "examScore": 68.0,
        "finalScore": 70.55,
        "grade": "B2",
        "remarks": "Very Good"
      }
    ],
    "summary": {
      "average": 68.3,
      "overallGrade": "B3",
      "totalSubjects": 8
    }
  }
}
```

---

## Dashboard

### `GET /api/dashboard`
| Query Param | Description |
|-------------|-------------|
| `full` | `true` — return full stats including announcements and trends |

---

## Other

### `GET /api/health`
Public health check (no auth required).

**Response**: `{ "status": "ok", "timestamp": "..." }`

### `GET /api/search`
| Query Param | Description |
|-------------|-------------|
| `q` | Search term across students, teachers, subjects |

### `POST /api/ai/summary`
Generate an AI-powered text summary (requires `ANTHROPIC_API_KEY`).
