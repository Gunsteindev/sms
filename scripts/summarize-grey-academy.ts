import { readFileSync } from 'fs';
import { resolve } from 'path';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const d: any = JSON.parse(readFileSync(resolve(process.cwd(), 'scripts/.grey-academy-data.json'), 'utf-8'));

const short = (id: string | undefined) => id ? id.slice(0, 8) : '-';

console.log('== Academic Years ==');
d.academicyears.forEach((a: any) => console.log(`${short(a.sms_academicyearid)}  ${a.sms_name}  ${a.sms_startdate}..${a.sms_enddate}  iscurrent=${a.sms_iscurrent}`));

console.log('\n== Terms ==');
d.terms.forEach((t: any) => console.log(`${short(t.sms_termid)}  ${t.sms_name}  ${t.sms_startdate}..${t.sms_enddate}  ay=${short(t._sms_academicyear_value)}`));

console.log('\n== Grade Levels ==');
d.gradelevels.sort((a:any,b:any)=>(a.sms_ordernumber??0)-(b.sms_ordernumber??0)).forEach((g: any) => console.log(`${short(g.sms_gradelevelid)}  ${g.sms_name}  order=${g.sms_ordernumber}`));

console.log('\n== Classes ==');
d.classes.forEach((c: any) => console.log(`${short(c.sms_classid)}  ${c.sms_name}  ay=${short(c._sms_academicyear_value)} gl=${short(c._sms_gradelevel_value)} teacher=${short(c._sms_teacher_value)}`));

console.log('\n== Teachers ==');
d.teachers.forEach((t: any) => console.log(`${short(t.sms_teacherid)}  ${t.sms_firstname} ${t.sms_lastname}  class=${short(t._sms_class_value)}`));

console.log('\n== Subjects ==');
d.subjects.forEach((s: any) => console.log(`${short(s.sms_subjectid)}  ${s.sms_name} (${s.sms_code})  gl=${short(s._sms_gradelevel_value)} teacher=${short(s._sms_teacher_value)}`));

console.log('\n== Exams ==');
d.exams.forEach((e: any) => console.log(`${short(e.sms_examid)}  ${e.sms_name}  type=${e.sms_examtype}  ${e.sms_startdate}..${e.sms_enddate}  ay=${short(e._sms_academicyear_value)} class=${short(e._sms_class_value)} subj=${short(e._sms_subject_value)} term=${short(e._sms_term_value)}`));

console.log('\n== Fee Structures (sample 10) ==');
d.feestructures.slice(0,10).forEach((f: any) => console.log(`${short(f.sms_feestructureid)}  ${f.sms_name}  amount=${f.sms_amount} due=${f.sms_duedate}  gl=${short(f._sms_gradelevel_value)} ay=${short(f._sms_academicyear_value)}`));
console.log(`...total ${d.feestructures.length}`);

console.log('\n== Fee Invoices due-date histogram ==');
const dueDates: Record<string, number> = {};
d.feeinvoices.forEach((f: any) => { const m = (f.sms_duedate||'').slice(0,7); dueDates[m] = (dueDates[m]||0)+1; });
Object.entries(dueDates).sort().forEach(([m,c]) => console.log(`  ${m}: ${c}`));
console.log(`...total ${d.feeinvoices.length}, sample term/ay: ${short(d.feeinvoices[0]?._sms_academicyear_value)} / ${short(d.feeinvoices[0]?._sms_term_value)}`);

console.log('\n== Scholarships ==');
d.scholarships.forEach((s: any) => console.log(`${short(s.sms_scholarshipid)}  ${s.sms_name}  student=${short(s._sms_student_value)} ay=${short(s._sms_academicyear_value)} start=${s.sms_startdate} end=${s.sms_enddate}`));

console.log('\n== Activities ==');
d.activities.forEach((a: any) => console.log(`${short(a.sms_activityid)}  ${a.sms_name}  (${a.sms_category})`));

console.log('\n== Students (sample 10) ==');
d.students.slice(0,10).forEach((s: any) => console.log(`${short(s.sms_studentid)}  ${s.sms_firstname} ${s.sms_lastname}  class=${short(s._sms_class_value)} gl=${short(s._sms_gradelevel_value)} parent=${short(s._sms_parent_value)}`));
console.log(`...total ${d.students.length}`);

console.log('\n== Parents (sample 10) ==');
d.parents.slice(0,10).forEach((p: any) => console.log(`${short(p.sms_parentid)}  ${p.sms_firstname} ${p.sms_lastname}`));
console.log(`...total ${d.parents.length}`);

console.log('\n== Enrollments (sample 5) ==');
d.enrollments.slice(0,5).forEach((e: any) => console.log(`${short(e.sms_enrollmentid)}  roll=${e.sms_rollnumber} student=${short(e._sms_student_value)} class=${short(e._sms_class_value)} ay=${short(e._sms_academicyear_value)} status=${e.sms_enrollmentstatus}`));

console.log('\n== Library books (sample 5) / loans (sample 5) ==');
d.librarybooks.slice(0,5).forEach((b: any) => console.log(`book ${short(b.sms_librarybookid)}  ${b.sms_name}`));
d.libraryloans.forEach((l: any) => console.log(`loan ${short(l.sms_libraryloanid)}  book=${short(l._sms_librarybook_value)} student=${short(l._sms_student_value)} teacher=${short(l._sms_teacher_value)} type=${l.sms_borrowertypecode} status=${l.sms_loanstatus}`));

console.log('\n== Vehicles ==');
d.vehicles.forEach((v: any) => console.log(`${short(v.sms_vehicleid)}  ${v.sms_name}  ${v.sms_plate} type=${v.sms_vehicletype} cap=${v.sms_capacity} status=${v.sms_status}`));

console.log('\n== Inventory items (sample 10) ==');
d.inventoryitems.slice(0,10).forEach((i: any) => console.log(`${short(i.sms_inventoryitemid)}  ${i.sms_name}  qty=${i.sms_quantity}`));
console.log(`...total ${d.inventoryitems.length}`);

console.log('\n== Employees (sample 10) ==');
d.employees.slice(0,10).forEach((e: any) => console.log(`${short(e.sms_employeeid)}  ${e.sms_firstname} ${e.sms_lastname}  ${e.sms_designation}  dept=${e.sms_department}`));
console.log(`...total ${d.employees.length}`);

console.log('\n== Departments ==');
d.departments.forEach((dp: any) => console.log(`${short(dp.sms_departmentid)}  ${dp.sms_name}`));
