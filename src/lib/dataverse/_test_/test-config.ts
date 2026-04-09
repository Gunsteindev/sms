// Test configuration and mock data
export const testConfig = {
  // Use test entities to avoid affecting real data
  testPrefix: "TEST_",
  
  // Sample test data
  sampleStudent: {
    firstname: "Test",
    lastname: "Student",
    dateofbirth: "2010-01-01",
    gender: 1,
    emailaddress1: `test.student.${Date.now()}@example.com`,
    telephone1: "+1234567890",
    address1_line1: "123 Test Street",
    address1_city: "Test City",
    address1_stateorprovince: "Test State",
    address1_postalcode: "12345",
    enrollmentdate: new Date().toISOString().split('T')[0],
    parentname: "Test Parent",
    parentphone: "+1234567890",
    parentemail: `test.parent.${Date.now()}@example.com`,
    rollnumber: `TEST${Date.now()}`,
    classname: "Test Class"
  },

  sampleTeacher: {
    firstname: "Test",
    lastname: "Teacher",
    dateofbirth: "1980-01-01",
    gender: 1,
    emailaddress1: `test.teacher.${Date.now()}@example.com`,
    telephone1: "+1234567890",
    address1_line1: "123 Teacher Street",
    hiredate: "2020-01-01",
    qualification: "Master's Degree",
    specialization: "Mathematics",
    employeecode: `TCH${Date.now()}`,
    department: "Mathematics"
  },

  sampleEmployee: {
    employeecode: `EMP${Date.now()}`,
    firstname: "Test",
    lastname: "Employee",
    dateofbirth: "1985-01-01",
    gender: 1,
    emailaddress1: `test.employee.${Date.now()}@example.com`,
    telephone1: "+1234567890",
    address1_line1: "123 Employee Street",
    department: "Administration",
    designation: "Test Coordinator",
    employeetype: 1,
    hiredate: "2021-01-01",
    emergencycontactname: "Emergency Contact",
    emergencycontactphone: "+1234567890"
  },

  sampleAttendance: {
    date: new Date().toISOString().split('T')[0],
    status: 0, // Present
    checkintime: "08:00",
    checkouttime: "15:00"
  }
};