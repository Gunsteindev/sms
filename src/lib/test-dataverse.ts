// test-dataverse.ts
import { 
  getStudents, 
  getTeachers, 
  getEmployees,
//   getAttendanceByDate,
  getDashboardStats 
} from '@/lib/dataverse';

async function test() {
  try {
    console.log("Testing Dataverse imports...");
    
    // Test students
    const students = await getStudents({ page: 1, pageSize: 5 });
    console.log("Students loaded:", students.items.length);
    
    // Test teachers
    const teachers = await getTeachers();
    console.log("Teachers loaded:", teachers.length);
    
    // Test employees
    const employees = await getEmployees();
    console.log("Employees loaded:", employees.length);
    
    // Test dashboard
    const stats = await getDashboardStats();
    console.log("Dashboard stats:", stats);
    
    console.log("All tests passed!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

test();