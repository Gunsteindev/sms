# API Reference

All endpoints are under `/api/`. Every response follows the shape:

```json
{ "success": true,  "data": <payload> }
{ "success": false, "error": "<message>" }
```

Unauthenticated requests return `401 { "success": false, "error": "Unauthorized" }`.  
Validation errors return `400` with a field-level error string.  
Server errors return `500 { "success": false, "error": "Internal server error" }` (full message in development only).

---

## Authentication

### `POST /api/auth/login`
Log in with admin credentials.

**Body**
```json
{ "email": "admin@school.edu.gh", "password": "secret" }
```

**Response** — sets `sms.session` cookie (httpOnly, 24 h)
```json
{ "ok": true }
```

---

### `POST /api/auth/logout`
Clear the session cookie.

**Response**
```json
{ "ok": true }
```

---

### `GET /api/auth/session`
Return the current session user.

**Response**
```json
{
  "user": { "email": "...", "name": "Administrator", "role": "admin" },
  "expires": "2025-05-05T10:00:00.000Z"
}
```
Returns `null` if not authenticated.

---

## Students

### `GET /api/students`
| Query Param | Type | Description |
|-------------|------|-------------|
| `search` | string | Filter by name |
| `status` | number | 1=Active, 2=Inactive, 3=Graduated, 4=Transferred |
| `classid` | string | Filter by class GUID |
| `stats` | `true` | Return aggregate statistics instead of list |

**Response**
```json
{ "success": true, "data": [...], "totalCount": 120 }
```

### `POST /api/students`
**Required body fields**: `firstname`, `lastname`, `dateofbirth`, `enrollmentdate`

**Optional**: `gender` (number), `studentstatus`, `enrollmentstatus`, `classid`, `gradelevelid`, `address`, `phone`, `email`, `rollnumber`, `parentid`

### `GET /api/students/[id]`
### `PUT /api/students/[id]`
### `DELETE /api/students/[id]`

---

## Teachers

### `GET /api/teachers`
| Query Param | Type | Description |
|-------------|------|-------------|
| `search` | string | Filter by name |
| `status` | number | Employment status |
| `pageSize` | number | Records per page |
| `stats` | `true` | Return statistics |

### `POST /api/teachers`
**Required**: `firstname`, `lastname`, `email`, `dateofbirth`, `gender`, `hiredate`, `qualification`, `specialization`

**Optional**: `phone`, `address`, `employeeid`

### `GET /api/teachers/[id]`
### `PUT /api/teachers/[id]`
### `DELETE /api/teachers/[id]`

---

## Employees

### `GET /api/employees`
| Query Param | Type | Description |
|-------------|------|-------------|
| `department` | string | Filter by department name |
| `stats` | `true` | Return statistics |

### `POST /api/employees`
### `GET /api/employees/[id]`
### `PUT /api/employees/[id]`
### `DELETE /api/employees/[id]`

---

## Classes

### `GET /api/classes`
| Query Param | Type | Description |
|-------------|------|-------------|
| `stats` | `true` | Return class count statistics |

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
**Fields**: `studentid`, `classid`, `academicyearid`, `enrollmentdate`, `rollnumber`, `enrollmentstatus`

### `GET /api/enrollments/[id]`
### `PUT /api/enrollments/[id]`
### `DELETE /api/enrollments/[id]`

---

## Attendance

### `GET /api/attendance`
| Query Param | Type | Description |
|-------------|------|-------------|
| `date` | string | YYYY-MM-DD — filter by date |
| `trends` | `true` | Return daily trend data instead of records |
| `days` | number | Number of days for trends (default 30, max 365) |

### `POST /api/attendance`
Submit bulk attendance records.

**Body**
```json
{
  "records": [
    { "studentid": "...", "date": "2025-05-04", "attendancestatus": 1, "classid": "..." }
  ]
}
```

**Status values**: 1 = Present, 2 = Absent, 3 = Late, 4 = Excused

### `PUT /api/attendance/[id]`
### `DELETE /api/attendance/[id]`

### `GET /api/attendance/student/[id]`
| Query Param | Description |
|-------------|-------------|
| `startDate` | Filter start date |
| `endDate` | Filter end date |

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
| `assessmenttype` | Filter by type (1–6) |

### `POST /api/grades`

**Single grade**
```json
{
  "assessmenttype": 1,
  "score": 82.5,
  "studentid": "...",
  "subjectid": "...",
  "classid": "...",
  "termid": "...",
  "academicyearid": "...",
  "date": "2025-05-04"
}
```

**Assessment types**: 1=Classwork, 2=Homework, 3=Quiz, 4=MidTerm, 5=EndOfTerm, 6=Project

**Bulk upsert** — POST an array of grade objects (include `gradeid` to update existing):
```json
[
  { "gradeid": "existing-id", "assessmenttype": 1, "score": 75, ... },
  { "assessmenttype": 2, "score": 80, ... }
]
```

**Response**
```json
{ "success": true, "data": { "saved": 12 }, "message": "12 grades saved" }
```

### `GET /api/grades/[id]`
### `PUT /api/grades/[id]`
### `DELETE /api/grades/[id]`

---

## Exams

### `GET /api/exams`
| Query Param | Description |
|-------------|-------------|
| `search` | Filter by exam name |

### `POST /api/exams`
**Required**: `name`, `examtype`, `startdate`, `enddate`

**Exam types**: 1=Quiz, 2=Midterm, 3=Final, 4=Practical

**Optional**: `classid`, `termid`, `academicyearid`, `totalmarks`, `passmarks`, `weightpercent`, `venue`, `description`

### `GET /api/exams/[id]`
### `PUT /api/exams/[id]`
### `DELETE /api/exams/[id]`

### `GET /api/exams/results`
| Query Param | Description |
|-------------|-------------|
| `examid` | Filter by exam |
| `studentid` | Filter by student |

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

### `POST /api/academic-years`
**Fields**: `name`, `startdate`, `enddate`, `iscurrent`

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

## Finance — Fee Structures

### `GET /api/finance/fee-structures`
| Query Param | Description |
|-------------|-------------|
| `gradelevel` | Filter by grade level |

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

**Optional**: `paymentstatus`, `transactionid`, `receiptnumber` (auto-generated if omitted)

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
| Query Param | Description |
|-------------|-------------|
| `studentid` | Filter by borrower |
| `status` | Filter by loan status |

### `POST /api/library/loans`
**Fields**: `bookid`, `studentid`, `issuedate`, `duedate`, `status`

### `GET /api/library/loans/[id]`
### `PUT /api/library/loans/[id]`
### `DELETE /api/library/loans/[id]`

---

## Timetable

### `GET /api/timetable`
### `POST /api/timetable`
**Fields**: `classid`, `subjectid`, `teacherid`, `day`, `starttime`, `endtime`

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

## Parents & Student-Parents

### `GET /api/parents`
### `POST /api/parents`
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
    "student": { "studentid": "...", "firstname": "...", "lastname": "...", ... },
    "termId": "...",
    "subjectRows": [
      {
        "subjectid": "...",
        "subjectname": "Mathematics",
        "subjectcode": "MATH",
        "classScore": 76.5,
        "examScore": 68.0,
        "finalScore": 70.55,
        "grade": "B2"
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
Health check endpoint (public, no auth required).

**Response**: `{ "status": "ok", "timestamp": "..." }`

### `GET /api/search`
| Query Param | Description |
|-------------|-------------|
| `q` | Search term across students, teachers, subjects |

### `POST /api/ai/summary`
Generate an AI-powered text summary (requires `ANTHROPIC_API_KEY`).

### `GET /api/announcements`
### `POST /api/announcements`
### `GET /api/announcements/[id]`
### `PUT /api/announcements/[id]`
### `DELETE /api/announcements/[id]`
