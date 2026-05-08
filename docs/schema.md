# Dataverse Schema

All tables use the `sms_` prefix. Primary keys follow the pattern `sms_<entity>id`. Every entity table (except `sms_schools`) has a `_sms_school_value` lookup column for multi-tenant data isolation.

**School binding on write**: use the navigation property pattern:
```
'sms_school@odata.bind': `/sms_schools(<schoolId>)`
```

---

## Schools — `sms_schools`

Root entity. Has no `_sms_school_value` (it IS the school). Use `getSchoolById(schoolId)` explicitly in route handlers.

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_schoolid` | `schoolid` | GUID | Primary key |
| `sms_name` | `name` | string | School name |
| `sms_motto` | `motto` | string | |
| `sms_email` | `email` | string | |
| `sms_phone` | `phone` | string | |
| `sms_website` | `website` | string | |
| `sms_address` | `address` | string | |
| `sms_region` | `region` | string | |
| `sms_district` | `district` | string | |
| `sms_emiscode` | `emiscode` | string | GES EMIS code |
| `sms_type` | `type` | int | 1=GES, 2=Cambridge, 3=IB, 4=American, 5=French, 6=Mixed |
| `sms_level` | `level` | int | 1=Primary, 2=JHS, 3=SHS, 4=International, 5=All |
| `sms_logo` | `logo` | string | Image URL |
| `sms_primarycolor` | `primarycolor` | string | Hex colour |
| `sms_sidebarcolor` | `sidebarcolor` | string | Hex colour |
| `sms_currency` | `currency` | string | e.g. GHS |

---

## Users — `sms_users`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_userid` | `userid` | GUID | Primary key |
| `sms_name` | `name` | string | Display name |
| `sms_email` | `email` | string | Login email |
| `sms_password` | `passwordhash` | string | bcrypt hash (12 rounds) |
| `sms_userrole` | `userrole` | int | 1=Admin, 2=Teacher, 3=Finance, 4=Inventory, 5=Transport, 6=Pool, 7=Parent, 8=Kitchen |
| `sms_isactive` | `isactive` | boolean | |
| `sms_relatedrecord` | `relatedrecord` | string | Linked entity GUID (e.g. teacher or parent id) |
| `_sms_school_value` | `schoolid` | GUID | Lookup → `sms_schools` |

---

## Students — `sms_students`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_studentid` | `studentid` | GUID | Primary key |
| `sms_name` | `fullname` | string | Auto: `firstname + lastname` |
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
| `_sms_school_value` | `schoolid` | GUID | Lookup → `sms_schools` |

> **Full name**: `s.fullname \|\| \`${s.firstname} ${s.lastname}\`.trim()`

---

## Teachers — `sms_teachers`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_teacherid` | `teacherid` | GUID | Primary key |
| `sms_firstname` | `firstname` | string | |
| `sms_lastname` | `lastname` | string | |
| `sms_email` | `email` | string | |
| `sms_phone` | `phone` | string | |
| `sms_dateofbirth` | `dateofbirth` | date | |
| `sms_gender` | `gender` | int | |
| `sms_qualification` | `qualification` | string | |
| `sms_specialization` | `specialization` | string | |
| `sms_hiredate` | `hiredate` | date | |
| `sms_employeeid` | `employeeid` | string | Staff ID |
| `_sms_school_value` | `schoolid` | GUID | |

---

## Employees — `sms_employees`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_employeeid` | `employeeid` | GUID | Primary key |
| `sms_firstname` | `firstname` | string | |
| `sms_lastname` | `lastname` | string | |
| `sms_email` | `email` | string | |
| `sms_phone` | `phone` | string | |
| `sms_position` | `position` | string | |
| `sms_dateofbirth` | `dateofbirth` | date | |
| `sms_department` | `department` | string | |
| `_sms_school_value` | `schoolid` | GUID | |

---

## Parents — `sms_parents`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_parentid` | `parentid` | GUID |
| `sms_firstname` | `firstname` | string |
| `sms_lastname` | `lastname` | string |
| `sms_email` | `email` | string |
| `sms_phone` | `phone` | string |
| `sms_address` | `address` | string |
| `_sms_school_value` | `schoolid` | GUID |

---

## Classes — `sms_classes`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_classid` | `classid` | GUID | Primary key |
| `sms_name` | `classname` | string | **Maps to `classname`, not `name`** |
| `sms_classnumber` | `classnumber` | string | |
| `sms_section` | `section` | string | e.g. A, B, C |
| `sms_capacity` | `capacity` | int | |
| `sms_roomnumber` | `roomnumber` | string | |
| `_sms_academicyear_value` | `academicyearid` | GUID | |
| `_sms_gradelevel_value` | `gradelevelid` | GUID | |
| `_sms_teacher_value` | `teacherid` | GUID | Class teacher |
| `_sms_school_value` | `schoolid` | GUID | |

> Always use `c.classname ?? c.name` when displaying class names in dropdowns.

---

## Subjects — `sms_subjects`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_subjectid` | `subjectid` | GUID |
| `sms_name` | `name` | string |
| `sms_subjectcode` | `subjectcode` | string |
| `sms_description` | `description` | string |
| `_sms_school_value` | `schoolid` | GUID |

---

## Departments — `sms_departments`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_departmentid` | `departmentid` | GUID |
| `sms_name` | `name` | string |
| `sms_description` | `description` | string |
| `_sms_hodemployee_value` | `hodemployeeid` | GUID |
| `_sms_school_value` | `schoolid` | GUID |

---

## Academic Years — `sms_academicyears`

Each school has its own set of academic year records.

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_academicyearid` | `academicyearid` | GUID | Primary key |
| `sms_name` | `name` | string | e.g. "2025-2026" |
| `sms_startdate` | `startdate` | date | |
| `sms_enddate` | `enddate` | date | |
| `sms_iscurrent` | `iscurrent` | boolean | One per school |
| `sms_description` | `description` | string | |
| `sms_yearname` | `yearname` | string | Optional label |
| `_sms_school_value` | `schoolid` | GUID | |

---

## Terms — `sms_terms`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_termid` | `termid` | GUID |
| `sms_name` | `name` | string |
| `sms_termnumber` | `termnumber` | int |
| `sms_startdate` | `startdate` | date |
| `sms_enddate` | `enddate` | date |
| `sms_iscurrent` | `iscurrent` | boolean |
| `_sms_academicyear_value` | `academicyearid` | GUID |
| `_sms_school_value` | `schoolid` | GUID |

---

## Grade Levels — `sms_gradelevels`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_gradelevelid` | `gradelevelid` | GUID |
| `sms_name` | `name` | string |
| `sms_levelnumber` | `levelnumber` | int |
| `sms_description` | `description` | string |
| `_sms_school_value` | `schoolid` | GUID |

---

## Enrollments — `sms_enrollments`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_enrollmentid` | `enrollmentid` | GUID | |
| `sms_rollnumber` | `rollnumber` | string | |
| `sms_enrollmentdate` | `enrollmentdate` | date | |
| `sms_enrollmentstatus` | `enrollmentstatus` | int | 1=Active, 2=Withdrawn, 3=Completed, 4=Deferred |
| `_sms_student_value` | `studentid` | GUID | |
| `_sms_class_value` | `classid` | GUID | |
| `_sms_academicyear_value` | `academicyearid` | GUID | |
| `_sms_term_value` | `termid` | GUID | |
| `_sms_school_value` | `schoolid` | GUID | |

---

## Attendance — `sms_attendances`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_attendanceid` | `attendanceid` | GUID | |
| `sms_date` | `date` | date | |
| `sms_attendancestatus` | `attendancestatus` | int | 1=Present, 2=Absent, 3=Late, 4=Excused |
| `sms_remarks` | `remarks` | string | |
| `_sms_student_value` | `studentid` | GUID | |
| `_sms_class_value` | `classid` | GUID | |
| `_sms_school_value` | `schoolid` | GUID | |

---

## Grades — `sms_grades`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_gradeid` | `gradeid` | GUID | |
| `sms_assessmenttype` | `assessmenttype` | int | 1=Classwork, 2=Homework, 3=Quiz, 4=MidTerm, 5=EndOfTerm, 6=Project |
| `sms_score` | `score` | decimal | 0–100 |
| `sms_maxscore` | `maxscore` | decimal | Default 100 |
| `sms_date` | `date` | date | |
| `sms_remarks` | `remarks` | string | |
| `_sms_student_value` | `studentid` | GUID | |
| `_sms_subject_value` | `subjectid` | GUID | |
| `_sms_class_value` | `classid` | GUID | |
| `_sms_term_value` | `termid` | GUID | |
| `_sms_academicyear_value` | `academicyearid` | GUID | |
| `_sms_teacher_value` | `teacherid` | GUID | |
| `_sms_school_value` | `schoolid` | GUID | |

---

## Exams — `sms_exams`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_examid` | `examid` | GUID | |
| `sms_examcode` | `examcode` | string | |
| `sms_examtype` | `examtype` | int | 1=Quiz, 2=Midterm, 3=Final, 4=Practical |
| `sms_startdate` | `startdate` | date | |
| `sms_enddate` | `enddate` | date | |
| `sms_totalmarks` | `totalmarks` | decimal | Default 100 |
| `sms_passmarks` | `passmarks` | decimal | |
| `sms_weightpercent` | `weightpercent` | decimal | |
| `sms_venue` | `venue` | string | |
| `_sms_academicyear_value` | `academicyearid` | GUID | |
| `_sms_class_value` | `classid` | GUID | |
| `_sms_subject_value` | `subjectid` | GUID | |
| `_sms_term_value` | `termid` | GUID | |
| `_sms_school_value` | `schoolid` | GUID | |

---

## Exam Results — `sms_examresults`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_examresultid` | `examresultid` | GUID | |
| `sms_score` | `score` | decimal | |
| `sms_percentage` | `percentage` | decimal | `(score / totalmarks) × 100` |
| `sms_gradeletter` | `gradeletter` | string | GES letter (A1–F9) |
| `sms_gradepointvalue` | `gradepointvalue` | decimal | |
| `sms_ispassed` | `ispassed` | boolean | |
| `sms_remarks` | `remarks` | string | |
| `_sms_exam_value` | `examid` | GUID | |
| `_sms_student_value` | `studentid` | GUID | |
| `_sms_school_value` | `schoolid` | GUID | |

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
| `_sms_school_value` | `schoolid` | GUID | |

---

## Fee Types — `sms_feetypes`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_feetypeid` | `feetypeid` | GUID |
| `sms_name` | `name` | string |
| `sms_description` | `description` | string |
| `sms_ismandatory` | `ismandatory` | boolean |
| `_sms_school_value` | `schoolid` | GUID |

---

## Fee Structures — `sms_feestructures`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_feestructureid` | `feestructureid` | GUID | |
| `sms_amount` | `amount` | decimal | |
| `sms_duedate` | `duedate` | date | |
| `_sms_feetype_value` | `feetypeid` | GUID | Lookup → `sms_feetypes` |
| `_sms_gradelevel_value` | `gradelevelid` | GUID | |
| `_sms_academicyear_value` | `academicyearid` | GUID | |
| `_sms_term_value` | `termid` | GUID | |
| `_sms_school_value` | `schoolid` | GUID | |

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
| `_sms_school_value` | `schoolid` | GUID | |

---

## Fee Payments — `sms_feepayments`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_feepaymentid` | `feepaymentid` | GUID | |
| `sms_amount` | `amount` | decimal | |
| `sms_paymentdate` | `paymentdate` | date | |
| `sms_paymentmethod` | `paymentmethod` | int | 1=Cash, 2=Mobile Money, 3=Bank Transfer, 4=Cheque, 5=Other |
| `sms_transactionid` | `transactionid` | string | |
| `sms_receiptnumber` | `receiptnumber` | string | Auto-generated if omitted |
| `_sms_student_value` | `studentid` | GUID | |
| `sms_fee@odata.bind` | — | navigation | Bind to fee invoice on write |
| `_sms_school_value` | `schoolid` | GUID | |

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
| `sms_condition` | `conditions` | string | |
| `sms_sponsoredby` | `sponsoredby` | string | |
| `_sms_student_value` | `studentid` | GUID | |
| `_sms_school_value` | `schoolid` | GUID | |

---

## Library Books — `sms_librarybooks`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_librarybookid` | `bookid` | GUID |
| `sms_title` | `title` | string |
| `sms_author` | `author` | string |
| `sms_isbn` | `isbn` | string |
| `sms_publisher` | `publisher` | string |
| `sms_publishyear` | `year` | int |
| `sms_genre` | `genre` | string |
| `sms_quantity` | `quantity` | int |
| `sms_location` | `location` | string |
| `_sms_school_value` | `schoolid` | GUID |

---

## Library Loans — `sms_libraryloans`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_libraryloanid` | `loansid` | GUID | |
| `sms_issuedate` | `issuedate` | date | |
| `sms_duedate` | `duedate` | date | |
| `sms_returndate` | `returndate` | date | Filled on return |
| `sms_status` | `status` | int | 1=Issued, 2=Returned, 3=Overdue, 4=Lost |
| `_sms_book_value` | `bookid` | GUID | |
| `_sms_student_value` | `studentid` | GUID | |
| `_sms_school_value` | `schoolid` | GUID | |

---

## Timetable — `sms_timetable`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_timetableid` | `timetableid` | GUID | |
| `sms_day` | `day` | int | 1=Monday … 5=Friday |
| `sms_starttime` | `starttime` | string | HH:MM |
| `sms_endtime` | `endtime` | string | HH:MM |
| `_sms_class_value` | `classid` | GUID | |
| `_sms_subject_value` | `subjectid` | GUID | |
| `_sms_teacher_value` | `teacherid` | GUID | |
| `_sms_school_value` | `schoolid` | GUID | |

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
| `_sms_school_value` | `schoolid` | GUID |

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
| `_sms_school_value` | `schoolid` | GUID |

---

## Staff Leaves — `sms_staffleaves`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_staffleaveid` | `staffleaveid` | GUID | |
| `sms_leavetype` | `leavetype` | string | Annual / Sick / Maternity / Other |
| `sms_startdate` | `startdate` | date | |
| `sms_enddate` | `enddate` | date | |
| `sms_reason` | `reason` | string | |
| `sms_status` | `status` | int | 1=Pending, 2=Approved, 3=Declined |
| `_sms_school_value` | `schoolid` | GUID | |

---

## Activities — `sms_activities`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_activityid` | `activityid` | GUID |
| `sms_name` | `name` | string |
| `sms_type` | `type` | string |
| `sms_description` | `description` | string |
| `sms_schedule` | `schedule` | string |
| `_sms_teacher_value` | `teacherid` | GUID |
| `_sms_school_value` | `schoolid` | GUID |

---

## Announcements — `sms_announcements`

| Dataverse Field | App Field | Type | Description |
|-----------------|-----------|------|-------------|
| `sms_announcementid` | `announcementid` | GUID | |
| `sms_title` | `title` | string | |
| `sms_body` | `body` | string | |
| `sms_audience` | `audience` | string | All / Students / Parents / Staff |
| `sms_publishdate` | `publishdate` | date | |
| `sms_expirydate` | `expirydate` | date | |
| `sms_ispinned` | `ispinned` | boolean | |
| `_sms_school_value` | `schoolid` | GUID | |

---

## Inventory Items — `sms_inventoryitems`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_inventoryitemid` | `inventoryitemid` | GUID |
| `sms_name` | `name` | string |
| `sms_category` | `category` | string |
| `sms_unit` | `unit` | string |
| `sms_quantity` | `quantity` | int |
| `sms_reorderlevel` | `reorderlevel` | int |
| `sms_location` | `location` | string |
| `_sms_school_value` | `schoolid` | GUID |

---

## Vehicles — `sms_vehicles`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_vehicleid` | `vehicleid` | GUID |
| `sms_registration` | `registration` | string |
| `sms_make` | `make` | string |
| `sms_model` | `model` | string |
| `sms_capacity` | `capacity` | int |
| `sms_drivername` | `drivername` | string |
| `sms_driverphone` | `driverphone` | string |
| `sms_maintenancedue` | `maintenancedue` | date |
| `sms_status` | `status` | string |
| `_sms_school_value` | `schoolid` | GUID |

---

## Pool Sessions — `sms_poolsessions`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_poolsessionid` | `poolsessionid` | GUID |
| `sms_date` | `date` | date |
| `sms_starttime` | `starttime` | string |
| `sms_endtime` | `endtime` | string |
| `sms_swimgroup` | `swimgroup` | string |
| `sms_capacity` | `capacity` | int |
| `_sms_school_value` | `schoolid` | GUID |

---

## Pool Rentals — `sms_poolrentals`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_poolrentalid` | `poolrentalid` | GUID |
| `sms_clientname` | `clientname` | string |
| `sms_clientphone` | `clientphone` | string |
| `sms_date` | `date` | date |
| `sms_starttime` | `starttime` | string |
| `sms_endtime` | `endtime` | string |
| `sms_amount` | `amount` | decimal |
| `_sms_school_value` | `schoolid` | GUID |

---

## Pool Transactions — `sms_pooltransactions`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_pooltransactionid` | `pooltransactionid` | GUID |
| `sms_type` | `type` | string |
| `sms_amount` | `amount` | decimal |
| `sms_date` | `date` | date |
| `sms_description` | `description` | string |
| `_sms_school_value` | `schoolid` | GUID |

---

## Expenditures — `sms_expenditures`

| Dataverse Field | App Field | Type |
|-----------------|-----------|------|
| `sms_expenditureid` | `expenditureid` | GUID |
| `sms_description` | `description` | string |
| `sms_amount` | `amount` | decimal |
| `sms_date` | `date` | date |
| `sms_category` | `category` | string |
| `_sms_school_value` | `schoolid` | GUID |
