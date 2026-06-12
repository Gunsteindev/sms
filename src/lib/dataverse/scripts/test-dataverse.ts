import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Import all modules
import { 
  getAccessToken,
  clearTokenCache,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dataverseClient,
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  searchStudents,
  getStudentStats,
  getTeachers,
  getTeacherById,
  createTeacher,
  deleteTeacher,
  getEmployees,
  getEmployeeById,
  createEmployee,
  deleteEmployee,
  getAttendance,
  markAttendance,
  getAttendanceSummary,
  getClasses,
  getFeeStructures,
  getDashboardStats
} from '..';

// Test results tracking
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

const testResults: TestResult[] = [];
let testStudentId: string | null = null;
let testTeacherId: string | null = null;
let testEmployeeId: string | null = null;

// Helper function to run tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runTest(name: string, testFn: () => Promise<any>) {
  const startTime = Date.now();
  console.log(`\n📝 Running test: ${name}`);
  console.log("─".repeat(50));
  
  try {
    const result = await testFn();
    const duration = Date.now() - startTime;
    testResults.push({ name, passed: true, duration, data: result });
    console.log(`✅ PASSED (${duration}ms)`);
    return result;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const duration = Date.now() - startTime;
    testResults.push({ 
      name, 
      passed: false, 
      error: error.message || String(error),
      duration 
    });
    console.log(`❌ FAILED (${duration}ms)`);
    console.error(`Error: ${error.message || error}`);
    return null;
  }
}

// Test suites
async function testAuthentication() {
  console.log("\n🔐 AUTHENTICATION TESTS");
  console.log("═".repeat(50));
  
  await runTest("Get Access Token", async () => {
    const token = await getAccessToken();
    if (!token || token.length < 10) {
      throw new Error("Invalid token received");
    }
    console.log(`  Token received (length: ${token.length})`);
    return { tokenLength: token.length };
  });
  
  await runTest("Token Caching", async () => {
    const token1 = await getAccessToken();
    const token2 = await getAccessToken();
    if (token1 !== token2) {
      throw new Error("Token caching failed - tokens don't match");
    }
    console.log("  Token cached successfully");
    return { cached: true };
  });
  
  await runTest("Clear Token Cache", async () => {
    clearTokenCache();
    const token = await getAccessToken();
    if (!token) {
      throw new Error("Failed to get new token after cache clear");
    }
    console.log("  Cache cleared and new token obtained");
    return { success: true };
  });
}

async function testStudents() {
  console.log("\n👨‍🎓 STUDENT MANAGEMENT TESTS");
  console.log("═".repeat(50));
  
  // Create student
  await runTest("Create Student", async () => {
    const student = await createStudent({
      firstname: `Test_${Date.now()}`,
      lastname: "Student",
      dateofbirth: "2010-01-01",
      gender: 1,
      email: `test.student.${Date.now()}@example.com`,
      phone: "+1234567890",
      address: "123 Test St",
      enrollmentdate: new Date().toISOString().split('T')[0],
      rollnumber: `ROLL${Date.now()}`
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    testStudentId = (student as any).sms_studentid ?? (student as any).studentid;
    console.log(`  Created student with ID: ${testStudentId}`);
    return student;
  });
  
  // Get all students
  await runTest("Get All Students", async () => {
    const students = await getStudents({ pageSize: 5 });
    if (!students.items || students.items.length === 0) {
      console.log("  Warning: No students found, but this might be expected");
    }
    console.log(`  Found ${students.totalCount} total students`);
    return { count: students.totalCount };
  });
  
  // Get student by ID
  if (testStudentId) {
    await runTest("Get Student By ID", async () => {
      const student = await getStudentById(testStudentId!);
      if (!student || student.studentid !== testStudentId) {
        throw new Error("Student not found or ID mismatch");
      }
      console.log(`  Retrieved student: ${student.firstname} ${student.lastname}`);
      return student;
    });
    
    // Update student
    await runTest("Update Student", async () => {
      const updated = await updateStudent(testStudentId!, {
        firstname: `Updated_${Date.now()}`
      });
      console.log(`  Updated student name`);
      return updated;
    });
    
    // Search students
    await runTest("Search Students", async () => {
      const results = await searchStudents("Test");
      console.log(`  Found ${results.length} students matching "Test"`);
      return { results: results.length };
    });
  }
  
  // Get student stats
  await runTest("Get Student Statistics", async () => {
    const stats = await getStudentStats();
    console.log(`  Total students: ${stats.total}`);
    console.log(`  Active: ${stats.active}`);
    return stats;
  });
}

async function testTeachers() {
  console.log("\n👨‍🏫 TEACHER MANAGEMENT TESTS");
  console.log("═".repeat(50));
  
  // Create teacher
  await runTest("Create Teacher", async () => {
    const teacher = await createTeacher({
      firstname: `Teacher_${Date.now()}`,
      lastname: "Test",
      dateofbirth: "1980-01-01",
      gender: 1,
      email: `teacher.${Date.now()}@example.com`,
      phone: "+1234567890",
      address: "123 Teacher St",
      hiredate: "2020-01-01",
      qualification: "Master's Degree",
      specialization: "Mathematics",
      employeeid: `TCH${Date.now()}`
    });
    
    testTeacherId = teacher.teacherid;
    console.log(`  Created teacher with ID: ${testTeacherId}`);
    return teacher;
  });
  
  // Get all teachers
  await runTest("Get All Teachers", async () => {
    const teachers = await getTeachers();
    console.log(`  Found ${teachers.totalCount} teachers`);
    return { count: teachers.totalCount };
  });
  
  // Get teacher by ID
  if (testTeacherId) {
    await runTest("Get Teacher By ID", async () => {
      const teacher = await getTeacherById(testTeacherId!);
      if (!teacher || teacher.teacherid !== testTeacherId) {
        throw new Error("Teacher not found or ID mismatch");
      }
      console.log(`  Retrieved teacher: ${teacher.firstname} ${teacher.lastname}`);
      return teacher;
    });
  }
}

async function testEmployees() {
  console.log("\n👔 EMPLOYEE MANAGEMENT TESTS");
  console.log("═".repeat(50));
  
  // Create employee
  await runTest("Create Employee", async () => {
    const employee = await createEmployee({
      employeecode: `EMP${Date.now()}`,
      firstname: `Employee_${Date.now()}`,
      lastname: "Test",
      dateofbirth: "1985-01-01",
      gender: 1,
      emailaddress1: `employee.${Date.now()}@example.com`,
      telephone1: "+1234567890",
      address1_line1: "123 Employee St",
      department: "Administration",
      designation: "Test Coordinator",
      employeetype: 1,
      hiredate: "2021-01-01",
      emergencycontactname: "Emergency Contact",
      emergencycontactphone: "+1234567890"
    });
    
    testEmployeeId = employee.employeeid;
    console.log(`  Created employee with ID: ${testEmployeeId}`);
    return employee;
  });
  
  // Get all employees
  await runTest("Get All Employees", async () => {
    const employees = await getEmployees();
    console.log(`  Found ${employees.length} employees`);
    return { count: employees.length };
  });
  
  // Get employee by ID
  if (testEmployeeId) {
    await runTest("Get Employee By ID", async () => {
      const employee = await getEmployeeById(testEmployeeId!);
      if (!employee || employee.employeeid !== testEmployeeId) {
        throw new Error("Employee not found or ID mismatch");
      }
      console.log(`  Retrieved employee: ${employee.firstname} ${employee.lastname}`);
      return employee;
    });
  }
}

async function testAttendance() {
  console.log("\n📅 ATTENDANCE MANAGEMENT TESTS");
  console.log("═".repeat(50));
  
  const today = new Date().toISOString().split('T')[0];
  
  // Get attendance by date
  await runTest("Get Attendance By Date", async () => {
    const attendance = await getAttendance(today);
    console.log(`  Found ${attendance.length} attendance records for today`);
    return { count: attendance.length };
  });
  
  // Get attendance summary
  await runTest("Get Attendance Summary", async () => {
    const summary = await getAttendanceSummary(today);
    console.log(`  Total students: ${summary.totalStudents}`);
    console.log(`  Present: ${summary.present} (${summary.percentage.toFixed(1)}%)`);
    console.log(`  Absent: ${summary.absent}`);
    console.log(`  Late: ${summary.late}`);
    return summary;
  });
  
  // Mark attendance (if we have a student)
  if (testStudentId) {
    await runTest("Mark Attendance", async () => {
      const result = await markAttendance([{
        studentid: testStudentId!,
        date: today,
        attendancestatus: 1, // Present
        checkintime: "08:00",
        remarks: "Test attendance record"
      }]);
      
      console.log(`  Marked attendance for student`);
      return result;
    });
  }
}

async function testClasses() {
  console.log("\n📚 CLASS MANAGEMENT TESTS");
  console.log("═".repeat(50));
  
  await runTest("Get All Classes", async () => {
    const classes = await getClasses();
    console.log(`  Found ${classes.length} classes`);
    if (classes.length > 0) {
      console.log(`  Sample class: ${classes[0].classname} (Grade ${classes[0].gradelevelid})`);
    }
    return { count: classes.length };
  });
}

async function testFees() {
  console.log("\n💰 FEE MANAGEMENT TESTS");
  console.log("═".repeat(50));
  
  const currentYear = new Date().getFullYear().toString();
  
  await runTest("Get Fee Structures", async () => {
    const feeStructures = await getFeeStructures();
    console.log(`  Found ${feeStructures.length} fee structures for ${currentYear}`);
    return { count: feeStructures.length };
  });
}

async function testDashboard() {
  console.log("\n📊 DASHBOARD TESTS");
  console.log("═".repeat(50));
  
  await runTest("Get Dashboard Statistics", async () => {
    const stats = await getDashboardStats();
    console.log(`  Total Students: ${stats.totalStudents}`);
    console.log(`  Total Teachers: ${stats.totalTeachers}`);
    console.log(`  Total Employees: ${stats.totalEmployees}`);
    console.log(`  Total Classes: ${stats.totalClasses}`);
    console.log(`  Today's Attendance: ${stats.todayAttendance.toFixed(1)}%`);
    console.log(`  Monthly Revenue: $${stats.monthlyRevenue.toLocaleString()}`);
    return stats;
  });
}

async function testCleanup() {
  console.log("\n🧹 CLEANUP TESTS");
  console.log("═".repeat(50));
  
  // Delete test student
  if (testStudentId) {
    await runTest("Delete Test Student", async () => {
      await deleteStudent(testStudentId!);
      console.log(`  Deleted student: ${testStudentId}`);
      return { deleted: true };
    });
  }
  
  // Delete test teacher
  if (testTeacherId) {
    await runTest("Delete Test Teacher", async () => {
      await deleteTeacher(testTeacherId!);
      console.log(`  Deleted teacher: ${testTeacherId}`);
      return { deleted: true };
    });
  }
  
  // Delete test employee
  if (testEmployeeId) {
    await runTest("Delete Test Employee", async () => {
      await deleteEmployee(testEmployeeId!);
      console.log(`  Deleted employee: ${testEmployeeId}`);
      return { deleted: true };
    });
  }
}

// Generate test report
function generateReport() {
  console.log("\n\n📊 TEST REPORT");
  console.log("═".repeat(50));
  
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`\n📈 Summary:`);
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  ✅ Passed: ${passedTests}`);
  console.log(`  ❌ Failed: ${failedTests}`);
  console.log(`  ⏱️  Total Duration: ${totalDuration}ms`);
  console.log(`  📊 Pass Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests > 0) {
    console.log(`\n❌ Failed Tests:`);
    testResults
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
  }
  
  console.log(`\n📋 Detailed Results:`);
  console.log("─".repeat(50));
  testResults.forEach(r => {
    const status = r.passed ? "✅" : "❌";
    console.log(`${status} ${r.name.padEnd(30)} ${r.duration}ms`);
  });
  
  return { totalTests, passedTests, failedTests, passRate: (passedTests / totalTests) * 100 };
}

// Main test runner
async function runAllTests() {
  console.log("\n🚀 STARTING DATAVERSE INTEGRATION TESTS");
  console.log("═".repeat(50));
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Dataverse URL: ${process.env.DATAVERSE_URL || 'Not set'}`);
  console.log(`Azure Tenant: ${process.env.AZURE_TENANT_ID ? '✓ Set' : '✗ Missing'}`);
  console.log(`Azure Client ID: ${process.env.AZURE_CLIENT_ID ? '✓ Set' : '✗ Missing'}`);
  console.log(`Azure Client Secret: ${process.env.AZURE_CLIENT_SECRET ? '✓ Set' : '✗ Missing'}`);
  
  try {
    await testAuthentication();
    await testStudents();
    await testTeachers();
    await testEmployees();
    await testAttendance();
    await testClasses();
    await testFees();
    await testDashboard();
    await testCleanup();
    
    const report = generateReport();
    
    if (report.failedTests === 0) {
      console.log("\n🎉 ALL TESTS PASSED! Dataverse integration is working correctly.");
    } else {
      console.log(`\n⚠️ ${report.failedTests} test(s) failed. Please check the errors above.`);
      process.exit(1);
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("\n💥 FATAL ERROR:", error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

export { runAllTests, runTest, testResults };