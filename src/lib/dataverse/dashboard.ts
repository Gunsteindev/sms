// src/lib/dataverse/dashboard.ts
import { getStudentStats } from "./students";
import { getEmployeeStats } from "./employees";
import { getTeacherStats } from "./teachers";
import { getClassesCount } from "./classes";
import { getAttendanceSummary, getAttendanceTrends } from "./attendance";
import { getCurrentMonthRevenue } from "./fees";

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalEmployees: number;
  totalClasses: number;
  todayAttendance: number;
  monthlyRevenue: number;
  pendingFees: number;
  activeUsers: number;
}

export interface DashboardData {
  stats: DashboardStats;
  attendanceTrends: Array<{
    date: string;
    percentage: number;
    present: number;
    total: number;
  }>;
  lastUpdated: string;
}

// Get basic dashboard statistics
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [studentStats, teacherStats, employeeStats, classStats, attendanceStats, revenueStats] = await Promise.all([
      getStudentStats(),
      getTeacherStats(),
      getEmployeeStats(),
      getClassesCount(),
      getAttendanceSummary(today),
      getCurrentMonthRevenue()
    ]);
    
    return {
      totalStudents: studentStats?.total || 0,
      totalTeachers: teacherStats?.total || 0,
      totalEmployees: employeeStats?.total || 0,
      totalClasses: classStats?.total || 0,
      todayAttendance: attendanceStats?.percentage || 0,
      monthlyRevenue: revenueStats?.totalRevenue || 0,
      pendingFees: revenueStats?.totalRevenue * 0.1 || 0, // Example calculation
      activeUsers: studentStats?.active || 0
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

// Get complete dashboard data with trends
export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    const [stats, attendanceTrends] = await Promise.all([
      getDashboardStats(),
      getAttendanceTrends(30)
    ]);
    
    return {
      stats,
      attendanceTrends,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
};

// Get dashboard stats for a specific date
export const getDashboardStatsForDate = async (date: string): Promise<DashboardStats> => {
  try {
    const [studentStats, teacherStats, employeeStats, classStats, attendanceStats, revenueStats] = await Promise.all([
      getStudentStats(),
      getTeacherStats(),
      getEmployeeStats(),
      getClassesCount(),
      getAttendanceSummary(date),
      getCurrentMonthRevenue()
    ]);
    
    return {
      totalStudents: studentStats?.total || 0,
      totalTeachers: teacherStats?.total || 0,
      totalEmployees: employeeStats?.total || 0,
      totalClasses: classStats?.total || 0,
      todayAttendance: attendanceStats?.percentage || 0,
      monthlyRevenue: revenueStats?.totalRevenue || 0,
      pendingFees: revenueStats?.totalRevenue * 0.1 || 0,
      activeUsers: studentStats?.active || 0
    };
  } catch (error) {
    console.error("Error fetching dashboard stats for date:", error);
    throw error;
  }
};

// Get quick stats (lightweight version)
export const getQuickStats = async () => {
  try {
    const [studentStats, teacherStats, classStats] = await Promise.all([
      getStudentStats(),
      getTeacherStats(),
      getClassesCount()
    ]);
    
    return {
      totalStudents: studentStats?.total || 0,
      totalTeachers: teacherStats?.total || 0,
      totalClasses: classStats?.total || 0,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching quick stats:", error);
    throw error;
  }
};