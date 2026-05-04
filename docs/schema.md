# Dataverse Schema

All tables use the `sms_` prefix. Primary keys follow the pattern `sms_<entity>id`.

## Students — `sms_students`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_studentid` | `studentid` | GUID | Primary key |
| `sms_name` | — | string | Auto-computed: `firstname + lastname` |
| `sms_firstname` | `firstname` | string | |
| `sms_lastname` | `lastname` | string | |
| `sms_dateofbirth` | `dateofbirth` | date | |
| `sms_gender` | `gender` | int | 1=Male, 2=Female |
| `sms_email` | `email` | string | |
| `sms_phone` | `phone` | string | |
| `sms_address` | `address` | string | |
| `sms_studentnumber` | `studentnumber` | string | Roll number / student ID |
| `sms_studentstatus` | `studentstatus` | int | 1=Active, 2=Inactive, 3=Graduated, 4=Transferred |
| `sms_guardianname` | `guardianname` | string | |
| `sms_guardianphone` | `guardianphone` | string | |
| `_sms_class_value` | `classid` | GUID | Lookup → `sms_classes` |
| `_sms_gradelevel_value` | `gradelevelid` | GUID | Lookup → `sms_gradelevels` |
| `_sms_parent_value` | `parentid` | GUID | Lookup → `sms_parents` |

---

## Grades — `sms_grades`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_gradeid` | `gradeid` | GUID | Primary key |
| `sms_assessmenttype` | `assessmenttype` | int | 1=Classwork, 2=Homework, 3=Quiz, 4=MidTerm, 5=EndOfTerm, 6=Project |
| `sms_score` | `score` | decimal | 0–100 |
| `sms_maxscore` | `maxscore` | decimal | Default 100 |
| `sms_date` | `date` | date | Assessment date |
| `sms_remarks` | `remarks` | string | |
| `_sms_student_value` | `studentid` | GUID | Lookup → `sms_students` |
| `_sms_subject_value` | `subjectid` | GUID | Lookup → `sms_subjects` |
| `_sms_class_value` | `classid` | GUID | Lookup → `sms_classes` |
| `_sms_term_value` | `termid` | GUID | Lookup → `sms_terms` |
| `_sms_academicyear_value` | `academicyearid` | GUID | Lookup → `sms_academicyears` |
| `_sms_teacher_value` | `teacherid` | GUID | Lookup → `sms_teachers` |

---

## Exams — `sms_exams`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_examid` | `examid` | GUID | Primary key |
| `sms_examcode` | `examcode` | string | |
| `sms_examtype` | `examtype` | int | 1=Quiz, 2=Midterm, 3=Final, 4=Practical |
| `sms_startdate` | `startdate` | date | |
| `sms_enddate` | `enddate` | date | |
| `sms_totalmarks` | `totalmarks` | decimal | Default 100 |
| `sms_passmarks` | `passmarks` | decimal | |
| `sms_weightpercent` | `weightpercent` | decimal | Contribution to final score |
| `sms_venue` | `venue` | string | |
| `_sms_academicyear_value` | `academicyearid` | GUID | |
| `_sms_class_value` | `classid` | GUID | |
| `_sms_subject_value` | `subjectid` | GUID | |
| `_sms_term_value` | `termid` | GUID | |

---

## Exam Results — `sms_examresults`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_examresultid` | `examresultid` | GUID | Primary key |
| `sms_score` | `score` | decimal | Raw score |
| `sms_percentage` | `percentage` | decimal | Calculated: `(score / totalmarks) × 100` |
| `sms_gradeletter` | `gradeletter` | string | GES letter grade (A1–F9) |
| `sms_gradepointvalue` | `gradepointvalue` | decimal | |
| `sms_ispassed` | `ispassed` | boolean | |
| `sms_remarks` | `remarks` | string | |
| `_sms_exam_value` | `examid` | GUID | Lookup → `sms_exams` |
| `_sms_student_value` | `studentid` | GUID | Lookup → `sms_students` |

---

## Attendance — `sms_attendances`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_attendanceid` | `attendanceid` | GUID | Primary key |
| `sms_date` | `date` | date | |
| `sms_attendancestatus` | `attendancestatus` | int | 1=Present, 2=Absent, 3=Late, 4=Excused |
| `sms_checkintime` | `checkintime` | time | |
| `sms_remarks` | `remarks` | string | |
| `_sms_student_value` | `studentid` | GUID | Lookup → `sms_students` |
| `_sms_class_value` | `classid` | GUID | Lookup → `sms_classes` |
| `_sms_subject_value` | `subjectid` | GUID | Lookup → `sms_subjects` |

---

## Classes — `sms_classes`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_classid` | `classid` | GUID | Primary key |
| `sms_name` | `classname` | string | **Note**: maps to `classname` in app, not `name` |
| `sms_classnumber` | `classnumber` | string | |
| `sms_section` | `section` | string | e.g. A, B, C |
| `sms_capacity` | `capacity` | int | Maximum students |
| `sms_roomnumber` | `roomnumber` | string | |
| `sms_enrolledcount` | `enrolledcount` | int | Rollup count (read-only) |
| `_sms_academicyear_value` | `academicyearid` | GUID | |
| `_sms_gradelevel_value` | `gradelevelid` | GUID | |
| `_sms_teacher_value` | `teacherid` | GUID | Class teacher |

> **Important**: The Dataverse field `sms_name` maps to `classname` in the application — always use `c.classname ?? c.name` when displaying class names in dropdowns.

---

## Teachers — `sms_teachers`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_teachid` | `teachid` | GUID |
| `sms_firstname` | `firstname` | string |
| `sms_lastname` | `lastname` | string |
| `sms_email` | `email` | string |
| `sms_phone` | `phone` | string |
| `sms_dateofbirth` | `dateofbirth` | date |
| `sms_gender` | `gender` | int |
| `sms_qualification` | `qualification` | string |
| `sms_specialization` | `specialization` | string |
| `sms_hiredate` | `hiredate` | date |
| `sms_employeeid` | `employeeid` | string |

---

## Employees — `sms_employees`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_employeeid` | `employeeid` | GUID |
| `sms_firstname` | `firstname` | string |
| `sms_lastname` | `lastname` | string |
| `sms_email` | `email` | string |
| `sms_phone` | `phone` | string |
| `sms_position` | `position` | string |
| `sms_dateofbirth` | `dateofbirth` | date |
| `sms_department` | `department` | string |

---

## Fee Structures — `sms_feestructures`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_feestructureid` | `feestructureid` | GUID | |
| `sms_feetype` | `feetype` | int | 1=Tuition, 2=Examination, 3=Development, etc. |
| `sms_amount` | `amount` | decimal | |
| `sms_duedate` | `duedate` | date | |
| `_sms_gradelevel_value` | `gradelevelid` | GUID | |
| `_sms_academicyear_value` | `academicyearid` | GUID | |

---

## Fee Invoices — `sms_fees`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_feeid` | `feeid` | GUID | |
| `sms_amountdue` | `amountdue` | decimal | |
| `sms_duedate` | `duedate` | date | |
| `sms_feestatus` | `feestatus` | int | 1=Pending, 2=Paid, 3=Partial, 4=Waived, 5=Overdue |
| `_sms_student_value` | `studentid` | GUID | |
| `_sms_feestructure_value` | `feestructureid` | GUID | |
| `_sms_academicyear_value` | `academicyearid` | GUID | |
| `_sms_term_value` | `termid` | GUID | |

---

## Fee Payments — `sms_feepayments`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_feepaymentid` | `feepaymentid` | GUID | |
| `sms_amount` | `amount` | decimal | |
| `sms_paymentdate` | `paymentdate` | date | |
| `sms_paymentmethod` | `paymentmethod` | int | 1=Cash, 2=Mobile Money, 3=Bank Transfer, 4=Cheque, 5=Other |
| `sms_paymentstatus` | `paymentstatus` | int | |
| `sms_transactionid` | `transactionid` | string | |
| `sms_receiptnumber` | `receiptnumber` | string | Auto-generated if not provided |
| `_sms_student_value` | `studentid` | GUID | |
| `sms_fee@odata.bind` | `feeid` | GUID | Navigation property — bound on write |

---

## Scholarships — `sms_scholarships`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_scholarshipid` | `scholarshipid` | GUID | |
| `sms_scholarshiptype` | `scholarshiptype` | int | 922330000=Full, 922330001=Partial, 922330002=Bursary |
| `sms_amount` | `amount` | decimal | |
| `sms_percentage` | `percentage` | decimal | |
| `sms_startdate` | `startdate` | date | |
| `sms_enddate` | `enddate` | date | |
| `sms_condition` | `conditions` | string | Eligibility conditions |
| `sms_sponsoredby` | `sponsoredby` | string | |
| `_sms_student_value` | `studentid` | GUID | |

---

## Academic Years — `sms_academicyears`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_academicyearid` | `academicyearid` | GUID |
| `sms_name` | `name` | string |
| `sms_startdate` | `startdate` | date |
| `sms_enddate` | `enddate` | date |
| `sms_iscurrent` | `iscurrent` | boolean |

---

## Terms — `sms_terms`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_termid` | `termid` | GUID |
| `sms_name` | `name` | string |
| `sms_termnumber` | `termnumber` | int |
| `sms_startdate` | `startdate` | date |
| `sms_enddate` | `enddate` | date |
| `_sms_academicyear_value` | `academicyearid` | GUID |

---

## Promotions — `sms_promotions`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_promotionid` | `promotionid` | GUID | |
| `sms_status` | `status` | int | 1=Promoted, 2=Retained, 3=Transferred, 4=Graduated |
| `sms_promotiondate` | `promotiondate` | date | |
| `sms_remarks` | `remarks` | string | |
| `_sms_student_value` | `studentid` | GUID | |
| `_sms_fromgradelevel_value` | `fromgradelevelid` | GUID | |
| `_sms_togradelevel_value` | `togradelevelid` | GUID | |
| `_sms_fromclass_value` | `fromclassid` | GUID | |
| `_sms_toclass_value` | `toclassid` | GUID | |
| `_sms_academicyear_value` | `academicyearid` | GUID | |

---

## Library Books — `sms_librarybooks`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_bookid` | `bookid` | GUID |
| `sms_title` | `title` | string |
| `sms_author` | `author` | string |
| `sms_isbn` | `isbn` | string |
| `sms_publisher` | `publisher` | string |
| `sms_publishyear` | `year` | int |
| `sms_genre` | `genre` | string |
| `sms_quantity` | `quantity` | int |
| `sms_location` | `location` | string |

---

## Library Loans — `sms_libraryloans`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_libraryloansid` | `loansid` | GUID | |
| `sms_issuedate` | `issuedate` | date | |
| `sms_duedate` | `duedate` | date | |
| `sms_returndate` | `returndate` | date | Filled when returned |
| `sms_status` | `status` | int | 1=Issued, 2=Returned, 3=Overdue, 4=Lost |
| `_sms_book_value` | `bookid` | GUID | |
| `_sms_student_value` | `studentid` | GUID | |

---

## Timetable — `sms_timetables`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_timetableid` | `timetableid` | GUID | |
| `sms_day` | `day` | int | 1=Monday … 5=Friday |
| `sms_starttime` | `starttime` | string | HH:MM |
| `sms_endtime` | `endtime` | string | HH:MM |
| `_sms_class_value` | `classid` | GUID | |
| `_sms_subject_value` | `subjectid` | GUID | |
| `_sms_teacher_value` | `teacherid` | GUID | |

---

## Medical — `sms_medical`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_medicalid` | `medicalid` | GUID |
| `sms_condition` | `condition` | string |
| `sms_treatmentdate` | `treatmentdate` | date |
| `sms_remarks` | `remarks` | string |
| `sms_medication` | `medication` | string |
| `_sms_student_value` | `studentid` | GUID |

---

## Disciplinary — `sms_disciplinary`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_disciplinaryid` | `disciplinaryid` | GUID |
| `sms_incidentdate` | `incidentdate` | date |
| `sms_category` | `category` | string |
| `sms_description` | `description` | string |
| `sms_actiontaken` | `actiontaken` | string |
| `sms_resolved` | `resolved` | boolean |
| `sms_parentnotified` | `parentnotified` | boolean |
| `_sms_student_value` | `studentid` | GUID |
