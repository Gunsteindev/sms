// ── Core ─────────────────────────────────────────────────────────────────────
export * from './auth';
export * from './client';          // includes DvList, DvRow
export * from './tenant';
export * from './school';
export * from './dashboard';
export * from './users';

// ── People ───────────────────────────────────────────────────────────────────
export * from './students';
export * from './teachers';
export * from './employees';
export * from './parents';
export * from './studentparents';

// ── Academic ─────────────────────────────────────────────────────────────────
export * from './classes';
export * from './subjects';
export * from './departments';
export * from './enrollments';
export * from './attendance';
export * from './grades';
export * from './exams';
export * from './examresults';
export * from './timetable';
export * from './academicyears';
export * from './terms';
export * from './gradelevels';
export * from './promotions';

// ── Finance ──────────────────────────────────────────────────────────────────
export * from './fees';
export * from './feeinvoices';
export * from './feetypes';
export * from './scholarships';

// ── Operations ───────────────────────────────────────────────────────────────
export * from './library';
export * from './libraryloans';
export * from './inventory';
export * from './inventoryMovements';
export * from './procurement';
export * from './announcements';
export * from './activities';
export * from './activityParticipants';
export * from './disciplinary';
export * from './medical';
export * from './staffleave';

// ── Facilities ───────────────────────────────────────────────────────────────
export * from './transport';
export * from './routeAssignments';
export * from './vehicleMaintenance';
export * from './kitchen';
export * from './mealOrders';
export * from './poolsessions';
export * from './poolrentals';
export * from './pooltransactions';