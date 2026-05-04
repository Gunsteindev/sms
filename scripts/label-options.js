/**
 * Converts all numeric option values in form controls to label strings.
 * Adds reverse-lookup conversion maps in submit handlers.
 */
const fs = require('fs');
const path = require('path');
const base = 'C:/Users/JaphetKomlanElormPas/School Management System/sms/src';

function write(rel, content) {
  fs.writeFileSync(path.join(base, rel), content, 'utf8');
}
function read(rel) {
  return fs.readFileSync(path.join(base, rel), 'utf8');
}
function patch(rel, ...pairs) {
  let c = read(rel);
  for (const [from, to] of pairs) c = c.split(from).join(to);
  write(rel, c);
  console.log('Patched:', rel);
}

// ─────────────────────────────────────────────────────────────
// teachers/page.tsx  — gender
// ─────────────────────────────────────────────────────────────
patch('app/(dashboard)/teachers/page.tsx',
  // schema
  ['gender:         z.coerce.number().min(1),', 'gender:         z.string().min(1, \'Required\'),'],
  // defaultValues in form component
  ['defaultValues: { gender: 1, ...defaultValues }', "defaultValues: { gender: 'Male', ...defaultValues }"],
  // SelectItem values
  ['<SelectItem value="1">Male</SelectItem>', '<SelectItem value="Male">Male</SelectItem>'],
  ['<SelectItem value="2">Female</SelectItem>', '<SelectItem value="Female">Female</SelectItem>'],
  // Controller – remove String() wrap and Number() cast
  ['value={String(field.value ?? \'\')} onValueChange={(v) => field.onChange(Number(v))}',
   'value={field.value ?? \'\'} onValueChange={(v) => field.onChange(v)}'],
  // defaultValues when editing – use existing GENDER map
  ['gender:         editing.gender,', 'gender:         GENDER[editing.gender] ?? \'Male\','],
  // handleSubmit – convert label back to code
  ['await teachersAPI.update(editing.teacherid, data);',
   'await teachersAPI.update(editing.teacherid, { ...data, gender: { Male:1, Female:2 }[data.gender] ?? 1 });'],
  ['await teachersAPI.create(data);',
   'await teachersAPI.create({ ...data, gender: { Male:1, Female:2 }[data.gender] ?? 1 });'],
);

// ─────────────────────────────────────────────────────────────
// employees/page.tsx  — gender + employeetype
// ─────────────────────────────────────────────────────────────
patch('app/(dashboard)/employees/page.tsx',
  // schema
  ['employeetype:           z.coerce.number().min(1),', "employeetype:           z.string().min(1, 'Required'),"],
  ['gender:                 z.coerce.number().min(1),', "gender:                 z.string().min(1, 'Required'),"],
  // form defaultValues
  ["defaultValues: { gender: 1, employeetype: 1, ...defaultValues }", "defaultValues: { gender: 'Male', employeetype: 'Full-time', ...defaultValues }"],
  // gender SelectItems
  ['<SelectItem value="1">Male</SelectItem>', '<SelectItem value="Male">Male</SelectItem>'],
  ['<SelectItem value="2">Female</SelectItem>', '<SelectItem value="Female">Female</SelectItem>'],
  // gender Controller
  ['value={String(field.value ?? \'\')} onValueChange={(v) => field.onChange(Number(v))}>',
   'value={field.value ?? \'\'} onValueChange={(v) => field.onChange(v)}>'],
  // employeetype SelectItem: uses ([v, l]) pattern — change value={v} to value={l}
  // The render is: {Object.entries(EMP_TYPE).map(([v, l]) => (\n<SelectItem key={v} value={v}>{l}</SelectItem>
  ['([v, l]) => (\n              <SelectItem key={v} value={v}>{l}</SelectItem>',
   '([v, l]) => (\n              <SelectItem key={v} value={l}>{l}</SelectItem>'],
  // remove Number() for employeetype too
  ['onValueChange={(v) => field.onChange(Number(v))}>\n              <SelectTrigger id="employeetype"',
   'onValueChange={(v) => field.onChange(v)}>\n              <SelectTrigger id="employeetype"'],
  // editing defaultValues
  ['gender:                 editing.gender,', 'gender:                 { 1:\'Male\', 2:\'Female\' }[editing.gender] ?? \'Male\','],
  ['employeetype:           editing.employeetype,', 'employeetype:           EMP_TYPE[editing.employeetype] ?? \'Full-time\','],
  // handleSubmit – convert
  ['await employeesAPI.update(editing.employeeid, data);',
   "await employeesAPI.update(editing.employeeid, { ...data, gender: { Male:1, Female:2 }[data.gender] ?? 1, employeetype: Object.entries(EMP_TYPE).find(([,l])=>l===data.employeetype)?.[0] ? Number(Object.entries(EMP_TYPE).find(([,l])=>l===data.employeetype)![0]) : 1 });"],
  ['await employeesAPI.create(data);',
   "await employeesAPI.create({ ...data, gender: { Male:1, Female:2 }[data.gender] ?? 1, employeetype: Object.entries(EMP_TYPE).find(([,l])=>l===data.employeetype)?.[0] ? Number(Object.entries(EMP_TYPE).find(([,l])=>l===data.employeetype)![0]) : 1 });"],
);

// ─────────────────────────────────────────────────────────────
// components/students/StudentForm.tsx — gender, studentstatus, enrollmentstatus
// ─────────────────────────────────────────────────────────────
patch('components/students/StudentForm.tsx',
  ['gender:           z.coerce.number().min(1),', "gender:           z.string().min(1, 'Required'),"],
  ['studentstatus:    z.coerce.number().optional(),', 'studentstatus:    z.string().optional(),'],
  ['enrollmentstatus: z.coerce.number().optional(),', 'enrollmentstatus: z.string().optional(),'],
  // form defaultValues
  ["defaultValues: { gender: 1, studentstatus: 1, enrollmentstatus: 1, ...defaultValues }",
   "defaultValues: { gender: 'Male', studentstatus: 'Active', enrollmentstatus: 'Enrolled', ...defaultValues }"],
  // gender SelectItems + Controller
  ['value={String(field.value ?? \'\')} onValueChange={v => field.onChange(Number(v))}>\n                <SelectTrigger id="gender"',
   'value={field.value ?? \'\'} onValueChange={v => field.onChange(v)}>\n                <SelectTrigger id="gender"'],
  ['<SelectItem value="1">Male</SelectItem>', '<SelectItem value="Male">Male</SelectItem>'],
  ['<SelectItem value="2">Female</SelectItem>', '<SelectItem value="Female">Female</SelectItem>'],
  // studentstatus SelectItems + Controller
  ['value={String(field.value ?? \'1\')} onValueChange={v => field.onChange(Number(v))}>\n                <SelectTrigger id="studentstatus"',
   'value={field.value ?? \'Active\'} onValueChange={v => field.onChange(v)}>\n                <SelectTrigger id="studentstatus"'],
  ['<SelectItem value="1">Active</SelectItem>\n                  <SelectItem value="2">Graduated</SelectItem>\n                  <SelectItem value="3">Transferred</SelectItem>\n                  <SelectItem value="4">Suspended</SelectItem>',
   '<SelectItem value="Active">Active</SelectItem>\n                  <SelectItem value="Graduated">Graduated</SelectItem>\n                  <SelectItem value="Transferred">Transferred</SelectItem>\n                  <SelectItem value="Suspended">Suspended</SelectItem>'],
  // enrollmentstatus SelectItems + Controller
  ['value={String(field.value ?? \'1\')} onValueChange={v => field.onChange(Number(v))}>\n                <SelectTrigger id="enrollmentstatus"',
   'value={field.value ?? \'Enrolled\'} onValueChange={v => field.onChange(v)}>\n                <SelectTrigger id="enrollmentstatus"'],
  ['<SelectItem value="1">Enrolled</SelectItem>\n                  <SelectItem value="2">Completed</SelectItem>\n                  <SelectItem value="3">Dropped</SelectItem>\n                  <SelectItem value="4">On Hold</SelectItem>',
   '<SelectItem value="Enrolled">Enrolled</SelectItem>\n                  <SelectItem value="Completed">Completed</SelectItem>\n                  <SelectItem value="Dropped">Dropped</SelectItem>\n                  <SelectItem value="On Hold">On Hold</SelectItem>'],
);

// ─────────────────────────────────────────────────────────────
// attendance/page.tsx — attendancestatus
// ─────────────────────────────────────────────────────────────
patch('app/(dashboard)/attendance/page.tsx',
  ['attendancestatus: z.coerce.number().min(1).max(4).default(1),', "attendancestatus: z.string().default('Present'),"],
  ["defaultValues: { date: today(), attendancestatus: 1, ...defaultValues }",
   "defaultValues: { date: today(), attendancestatus: 'Present', ...defaultValues }"],
  // Controller: uses Object.entries(STATUSES) with k as value
  ['value={String(field.value)} onValueChange={v => field.onChange(Number(v))}',
   'value={field.value} onValueChange={v => field.onChange(v)}'],
  // SelectItem: change value={k} to value={v.label}
  ['<SelectItem key={k} value={k}>{v.label}</SelectItem>',
   '<SelectItem key={k} value={v.label}>{v.label}</SelectItem>'],
  // editing defaultValues
  ['attendancestatus: editing.attendancestatus,',
   'attendancestatus: STATUSES[editing.attendancestatus]?.label ?? \'Present\','],
  // handleSubmit – convert back
  ['await attendanceAPI.update(editing.attendanceid, data);',
   "await attendanceAPI.update(editing.attendanceid, { ...data, attendancestatus: Object.entries(STATUSES).find(([,v])=>v.label===data.attendancestatus)?.[0] ? Number(Object.entries(STATUSES).find(([,v])=>v.label===data.attendancestatus)![0]) : 1 });"],
  ['await attendanceAPI.markBulk([data]);',
   "await attendanceAPI.markBulk([{ ...data, attendancestatus: Object.entries(STATUSES).find(([,v])=>v.label===data.attendancestatus)?.[0] ? Number(Object.entries(STATUSES).find(([,v])=>v.label===data.attendancestatus)![0]) : 1 }]);"],
);

// ─────────────────────────────────────────────────────────────
// timetable/page.tsx — dayofweek
// ─────────────────────────────────────────────────────────────
patch('app/(dashboard)/timetable/page.tsx',
  ['dayofweek:    z.coerce.number().min(1).max(7),', "dayofweek:    z.string().min(1, 'Required'),"],
  ["defaultValues: { dayofweek: 1, ...defaultValues }",
   "defaultValues: { dayofweek: 'Monday', ...defaultValues }"],
  // Controller
  ['value={String(field.value)} onValueChange={v => field.onChange(Number(v))}',
   'value={field.value} onValueChange={v => field.onChange(v)}'],
  // SelectItem value: Object.entries(DAYS_OF_WEEK) uses k as value → change to v
  ['<SelectItem key={k} value={k}>{v}</SelectItem>',
   '<SelectItem key={k} value={v}>{v}</SelectItem>'],
  // editing defaultValues
  ['dayofweek:    editing.dayofweek,',
   'dayofweek:    DAYS_OF_WEEK[editing.dayofweek] ?? \'Monday\','],
  // handleSubmit
  ['await timetableAPI.update(editing.timetableid, data);',
   "await timetableAPI.update(editing.timetableid, { ...data, dayofweek: Object.entries(DAYS_OF_WEEK).find(([,v])=>v===data.dayofweek)?.[0] ? Number(Object.entries(DAYS_OF_WEEK).find(([,v])=>v===data.dayofweek)![0]) : 1 });"],
  ['await timetableAPI.create(data);',
   "await timetableAPI.create({ ...data, dayofweek: Object.entries(DAYS_OF_WEEK).find(([,v])=>v===data.dayofweek)?.[0] ? Number(Object.entries(DAYS_OF_WEEK).find(([,v])=>v===data.dayofweek)![0]) : 1 });"],
);

// ─────────────────────────────────────────────────────────────
// enrollments/page.tsx — enrollmentstatus
// ─────────────────────────────────────────────────────────────
patch('app/(dashboard)/enrollments/page.tsx',
  ['enrollmentstatus: z.coerce.number().default(1),', "enrollmentstatus: z.string().default('Active'),"],
  ["defaultValues: { enrollmentstatus: 1, ...defaultValues }",
   "defaultValues: { enrollmentstatus: 'Active', ...defaultValues }"],
  // SelectRoot Controller
  ['value={String(field.value)} onValueChange={v => field.onChange(Number(v))}',
   'value={field.value} onValueChange={v => field.onChange(v)}'],
  // SelectItem: uses k as value
  ['<SelectItem key={k} value={k}>{v}</SelectItem>', '<SelectItem key={k} value={v}>{v}</SelectItem>'],
  // editing defaultValues
  ['enrollmentstatus: editing.enrollmentstatus,',
   'enrollmentstatus: ENROLLMENT_STATUS[editing.enrollmentstatus] ?? \'Active\','],
  // handleSubmit
  ['await enrollmentsAPI.update(editing.enrollmentid, data);',
   "await enrollmentsAPI.update(editing.enrollmentid, { ...data, enrollmentstatus: Object.entries(ENROLLMENT_STATUS).find(([,v])=>v===data.enrollmentstatus)?.[0] ? Number(Object.entries(ENROLLMENT_STATUS).find(([,v])=>v===data.enrollmentstatus)![0]) : 1 });"],
  ['await enrollmentsAPI.create(data);',
   "await enrollmentsAPI.create({ ...data, enrollmentstatus: Object.entries(ENROLLMENT_STATUS).find(([,v])=>v===data.enrollmentstatus)?.[0] ? Number(Object.entries(ENROLLMENT_STATUS).find(([,v])=>v===data.enrollmentstatus)![0]) : 1 });"],
);

// ─────────────────────────────────────────────────────────────
// exams/page.tsx — examtype (native Select)
// ─────────────────────────────────────────────────────────────
patch('app/(dashboard)/exams/page.tsx',
  ['examtype:       z.coerce.number().min(1),', "examtype:       z.string().min(1, 'Required'),"],
  ["defaultValues: { examtype: 3, ...defaultValues }",
   "defaultValues: { examtype: 'Final', ...defaultValues }"],
  // native option: <option key={k} value={k}>{v}</option> → value={v}
  ['{Object.entries(EXAM_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}',
   '{Object.entries(EXAM_TYPES).map(([k, v]) => <option key={k} value={v}>{v}</option>)}'],
  // editing defaultValues
  ['examtype:       editing.examtype,',
   'examtype:       EXAM_TYPES[editing.examtype] ?? \'Final\','],
  // handleSubmit
  ['await examsAPI.update(editing.examid, data);',
   "await examsAPI.update(editing.examid, { ...data, examtype: Object.entries(EXAM_TYPES).find(([,v])=>v===data.examtype)?.[0] ? Number(Object.entries(EXAM_TYPES).find(([,v])=>v===data.examtype)![0]) : 3 });"],
  ['await examsAPI.create(data);',
   "await examsAPI.create({ ...data, examtype: Object.entries(EXAM_TYPES).find(([,v])=>v===data.examtype)?.[0] ? Number(Object.entries(EXAM_TYPES).find(([,v])=>v===data.examtype)![0]) : 3 });"],
);

// ─────────────────────────────────────────────────────────────
// fees/page.tsx — feetype (native Select)
// ─────────────────────────────────────────────────────────────
patch('app/(dashboard)/fees/page.tsx',
  ['feetype:        z.coerce.number().min(1),', "feetype:        z.string().min(1, 'Required'),"],
  ["defaultValues: defaultValues ?? { feetype: 1, amount: 0 }",
   "defaultValues: defaultValues ?? { feetype: 'Tuition', amount: 0 }"],
  ['{Object.entries(FEE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}',
   '{Object.entries(FEE_TYPES).map(([k, v]) => <option key={k} value={v}>{v}</option>)}'],
  ['feetype:        editing.feetype,',
   'feetype:        FEE_TYPES[editing.feetype] ?? \'Tuition\','],
  ['await feesAPI.update(editing.feestructureid, data);',
   "await feesAPI.update(editing.feestructureid, { ...data, feetype: Object.entries(FEE_TYPES).find(([,v])=>v===data.feetype)?.[0] ? Number(Object.entries(FEE_TYPES).find(([,v])=>v===data.feetype)![0]) : 1 });"],
  ['await feesAPI.create(data);',
   "await feesAPI.create({ ...data, feetype: Object.entries(FEE_TYPES).find(([,v])=>v===data.feetype)?.[0] ? Number(Object.entries(FEE_TYPES).find(([,v])=>v===data.feetype)![0]) : 1 });"],
);

// ─────────────────────────────────────────────────────────────
// finance/fees/page.tsx — feestatus (native Select)
// ─────────────────────────────────────────────────────────────
patch('app/(dashboard)/finance/fees/page.tsx',
  ['feestatus:      z.coerce.number().default(1),', "feestatus:      z.string().default('Pending'),"],
  ["defaultValues: defaultValues ?? { feestatus: 1, amount: 0 }",
   "defaultValues: defaultValues ?? { feestatus: 'Pending', amount: 0 }"],
  ['{Object.entries(FEE_INVOICE_STATUS).map(([k, v]) => (\n                    <option key={k} value={k}>{v}</option>',
   '{Object.entries(FEE_INVOICE_STATUS).map(([k, v]) => (\n                    <option key={k} value={v}>{v}</option>'],
  ['feestatus:      editing.feestatus,',
   'feestatus:      FEE_INVOICE_STATUS[editing.feestatus] ?? \'Pending\','],
  ['await feeInvoicesAPI.update(editing.feeinvoiceid, data);',
   "await feeInvoicesAPI.update(editing.feeinvoiceid, { ...data, feestatus: Object.entries(FEE_INVOICE_STATUS).find(([,v])=>v===data.feestatus)?.[0] ? Number(Object.entries(FEE_INVOICE_STATUS).find(([,v])=>v===data.feestatus)![0]) : 1 });"],
  ['await feeInvoicesAPI.create(data);',
   "await feeInvoicesAPI.create({ ...data, feestatus: Object.entries(FEE_INVOICE_STATUS).find(([,v])=>v===data.feestatus)?.[0] ? Number(Object.entries(FEE_INVOICE_STATUS).find(([,v])=>v===data.feestatus)![0]) : 1 });"],
);

// ─────────────────────────────────────────────────────────────
// finance/fee-payments/page.tsx — paymentmethod + paymentstatus
// ─────────────────────────────────────────────────────────────
patch('app/(dashboard)/finance/fee-payments/page.tsx',
  ['paymentmethod:  z.coerce.number().min(1),', "paymentmethod:  z.string().min(1, 'Required'),"],
  ['paymentstatus:  z.coerce.number().default(1),', "paymentstatus:  z.string().default('Paid'),"],
  ["defaultValues: defaultValues ?? { paymentmethod: 1, paymentstatus: 1, amount: 0 }",
   "defaultValues: defaultValues ?? { paymentmethod: 'Cash', paymentstatus: 'Paid', amount: 0 }"],
  // paymentmethod option values
  ['{Object.entries(PAYMENT_METHODS).map(([k, v]) => (\n                    <option key={k} value={k}>{v}</option>',
   '{Object.entries(PAYMENT_METHODS).map(([k, v]) => (\n                    <option key={k} value={v}>{v}</option>'],
  // paymentstatus option values
  ['{Object.entries(PAYMENT_STATUS).map(([k, v]) => (\n                    <option key={k} value={k}>{v}</option>',
   '{Object.entries(PAYMENT_STATUS).map(([k, v]) => (\n                    <option key={k} value={v}>{v}</option>'],
  // editing defaultValues
  ['paymentmethod:  editing.paymentmethod,',
   'paymentmethod:  PAYMENT_METHODS[editing.paymentmethod] ?? \'Cash\','],
  ['paymentstatus:  editing.paymentstatus,',
   'paymentstatus:  PAYMENT_STATUS[editing.paymentstatus] ?? \'Paid\','],
  // handleSubmit
  ['await feePaymentsAPI.update(editing.feepaymentid, data);',
   "await feePaymentsAPI.update(editing.feepaymentid, { ...data, paymentmethod: Object.entries(PAYMENT_METHODS).find(([,v])=>v===data.paymentmethod)?.[0] ? Number(Object.entries(PAYMENT_METHODS).find(([,v])=>v===data.paymentmethod)![0]) : 1, paymentstatus: Object.entries(PAYMENT_STATUS).find(([,v])=>v===data.paymentstatus)?.[0] ? Number(Object.entries(PAYMENT_STATUS).find(([,v])=>v===data.paymentstatus)![0]) : 1 });"],
  ['await feePaymentsAPI.create(data);',
   "await feePaymentsAPI.create({ ...data, paymentmethod: Object.entries(PAYMENT_METHODS).find(([,v])=>v===data.paymentmethod)?.[0] ? Number(Object.entries(PAYMENT_METHODS).find(([,v])=>v===data.paymentmethod)![0]) : 1, paymentstatus: Object.entries(PAYMENT_STATUS).find(([,v])=>v===data.paymentstatus)?.[0] ? Number(Object.entries(PAYMENT_STATUS).find(([,v])=>v===data.paymentstatus)![0]) : 1 });"],
);

// ─────────────────────────────────────────────────────────────
// finance/scholarships/page.tsx — scholarshiptype
// ─────────────────────────────────────────────────────────────
patch('app/(dashboard)/finance/scholarships/page.tsx',
  ['scholarshiptype: z.coerce.number(),', "scholarshiptype: z.string().min(1, 'Required'),"],
  ["defaultValues: defaultValues ?? { scholarshiptype: 922330000 }",
   "defaultValues: defaultValues ?? { scholarshiptype: 'Full' }"],
  ['{Object.entries(SCHOLARSHIP_TYPES).map(([k, v]) => (\n                    <option key={k} value={k}>{v}</option>',
   '{Object.entries(SCHOLARSHIP_TYPES).map(([k, v]) => (\n                    <option key={k} value={v}>{v}</option>'],
  ['scholarshiptype: editing.scholarshiptype,',
   'scholarshiptype: SCHOLARSHIP_TYPES[editing.scholarshiptype] ?? \'Full\','],
  ['await scholarshipsAPI.update(editing.scholarshipid, data);',
   "await scholarshipsAPI.update(editing.scholarshipid, { ...data, scholarshiptype: Object.entries(SCHOLARSHIP_TYPES).find(([,v])=>v===data.scholarshiptype)?.[0] ? Number(Object.entries(SCHOLARSHIP_TYPES).find(([,v])=>v===data.scholarshiptype)![0]) : 922330000 });"],
  ['await scholarshipsAPI.create(data);',
   "await scholarshipsAPI.create({ ...data, scholarshiptype: Object.entries(SCHOLARSHIP_TYPES).find(([,v])=>v===data.scholarshiptype)?.[0] ? Number(Object.entries(SCHOLARSHIP_TYPES).find(([,v])=>v===data.scholarshiptype)![0]) : 922330000 });"],
);

// ─────────────────────────────────────────────────────────────
// students/[id]/page.tsx — relationship in ParentForm
// ─────────────────────────────────────────────────────────────
patch('app/(dashboard)/students/[id]/page.tsx',
  ['relationship: z.coerce.number().default(3),', "relationship: z.string().default('Guardian'),"],
  ["defaultValues: { relationship: 3, ...defaultValues }",
   "defaultValues: { relationship: 'Guardian', ...defaultValues }"],
  // native Select option: <option key={k} value={k}>{v}</option>
  ['{Object.entries(PARENT_RELATIONSHIPS).map(([k, v]) => (\n            <option key={k} value={k}>{v}</option>',
   '{Object.entries(PARENT_RELATIONSHIPS).map(([k, v]) => (\n            <option key={k} value={v}>{v}</option>'],
  // editing defaultValues for parent form
  ["relationship: editingParent.relationship,",
   "relationship: PARENT_RELATIONSHIPS[editingParent.relationship] ?? 'Guardian',"],
  // handleAddParent submit
  ['await parentsAPI.create({ ...d, studentid: student.studentid });',
   "await parentsAPI.create({ ...d, studentid: student.studentid, relationship: Object.entries(PARENT_RELATIONSHIPS).find(([,v])=>v===d.relationship)?.[0] ? Number(Object.entries(PARENT_RELATIONSHIPS).find(([,v])=>v===d.relationship)![0]) : 3 });"],
  // handleEditParent submit
  ['await parentsAPI.update(editingParent.parentid, d);',
   "await parentsAPI.update(editingParent.parentid, { ...d, relationship: Object.entries(PARENT_RELATIONSHIPS).find(([,v])=>v===d.relationship)?.[0] ? Number(Object.entries(PARENT_RELATIONSHIPS).find(([,v])=>v===d.relationship)![0]) : 3 });"],
);

// ─────────────────────────────────────────────────────────────
// students/page.tsx — statusFilter SelectRoot + UpdateStatusModal
// ─────────────────────────────────────────────────────────────
patch('app/(dashboard)/students/page.tsx',
  // STATUS_OPTIONS: use label as value
  ["{ value: '1', label: 'Active' },", "{ value: 'Active', label: 'Active' },"],
  ["{ value: '2', label: 'Graduated' },", "{ value: 'Graduated', label: 'Graduated' },"],
  ["{ value: '3', label: 'Transferred' },", "{ value: 'Transferred', label: 'Transferred' },"],
  ["{ value: '4', label: 'Suspended' },", "{ value: 'Suspended', label: 'Suspended' },"],
  // handleStatusChange — convert label to number
  ["setStatusFilter(v ? Number(v) : undefined);",
   "const _STATUS_MAP: Record<string,number> = { Active:1, Graduated:2, Transferred:3, Suspended:4 };\n    setStatusFilter(v ? _STATUS_MAP[v] : undefined);"],
  // UpdateStatusModal SelectItem values
  ['{String(s.value)}>{s.label}</SelectItem>', '{s.label}>{s.label}</SelectItem>'],
  // UpdateStatusModal: onChange — remove Number()
  ['onValueChange={v => setStudentStatus(Number(v))}', 'onValueChange={v => setStudentStatus(v as unknown as number)}'],
  ['onValueChange={v => setEnrollmentStatus(Number(v))}', 'onValueChange={v => setEnrollmentStatus(v as unknown as number)}'],
);

console.log('\nDone.');
