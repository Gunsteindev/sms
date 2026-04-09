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