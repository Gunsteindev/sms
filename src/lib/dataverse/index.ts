// Export all modules from a single entry point
export * from './auth';
export * from './client';
export * from './students';
export * from './teachers';
export * from './employees';
export * from './attendance';
export * from './classes';
export * from './fees';
export * from './dashboard';
export * from './subjects';
export * from './enrollments';
export * from './departments';
export * from './exams';
export * from './examresults';
export * from './parents';
export * from './studentparents';
export * from './library';
export * from './timetable';
export * from './feeinvoices';
export * from './scholarships';
export * from './academicyears';
export * from './terms';
export * from './gradelevels';

// Re-export commonly used items
export { getAccessToken, clearTokenCache, isTokenValid } from './auth';
export { dataverseClient } from './client';

// Export types
export type { Student, CreateStudentRequest, StudentFilters } from './students';
export type { Teacher, CreateTeacherRequest } from './teachers';
export type { Employee, CreateEmployeeRequest } from './employees';
export type { Attendance, CreateAttendanceRequest, AttendanceSummary } from './attendance';
export type { Class, CreateClassRequest } from './classes';
export type { FeeStructure, FeePayment, CreateFeePaymentRequest } from './fees';
export type { DashboardStats } from './dashboard';
export type { Subject, CreateSubjectRequest } from './subjects';
export type { Enrollment, CreateEnrollmentRequest } from './enrollments';
export type { Department, CreateDepartmentRequest } from './departments';
export type { Exam, CreateExamRequest } from './exams';
export type { ExamResult, CreateExamResultRequest, ExamResultFilters } from './examresults';
export type { Parent, CreateParentRequest } from './parents';
export type { StudentParent, LinkStudentParentRequest } from './studentparents';
export type { LibraryBook, CreateLibraryBookRequest } from './library';
export type { TimetableEntry, CreateTimetableEntryRequest } from './timetable';
export type { FeeInvoice, CreateFeeInvoiceRequest, FeeInvoiceFilters } from './feeinvoices';
export type { Scholarship, CreateScholarshipRequest } from './scholarships';
export type { AcademicYear, CreateAcademicYearRequest } from './academicyears';
export type { Term, CreateTermRequest } from './terms';
export type { GradeLevel, CreateGradeLevelRequest } from './gradelevels';