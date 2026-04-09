import { dataverseClient } from "./client";

export interface Employee {
  employeeid: string;
  employeecode: string;
  firstname: string;
  lastname: string;
  dateofbirth: Date;
  gender: number;
  emailaddress1: string;
  telephone1: string;
  address1_line1: string;
  department: string;
  designation: string;
  employeetype: number; // 1=Full-time, 2=Part-time, 3=Contract, 4=Intern
  hiredate: Date;
  statuscode: number; // 1=Active, 2=On Leave, 3=Resigned, 4=Terminated
  salary?: number;
  bankaccount?: string;
  emergencycontactname: string;
  emergencycontactphone: string;
  createdon: Date;
  modifiedon: Date;
}

export interface CreateEmployeeRequest {
  employeecode: string;
  firstname: string;
  lastname: string;
  dateofbirth: string;
  gender: number;
  emailaddress1: string;
  telephone1: string;
  address1_line1: string;
  department: string;
  designation: string;
  employeetype: number;
  hiredate: string;
  salary?: number;
  bankaccount?: string;
  emergencycontactname: string;
  emergencycontactphone: string;
}

export const getEmployees = async (department?: string) => {
  try {
    let filter = "statuscode eq 1";
    if (department) {
      filter += ` and department eq '${department}'`;
    }
    
    const response = await dataverseClient.getWithFilter<{ value: Employee[] }>(
      "employees",
      ["employeeid", "employeecode", "firstname", "lastname", "emailaddress1", "telephone1", "department", "designation", "employeetype", "hiredate"],
      filter,
      "firstname asc"
    );
    
    console.log("Employees fetched:", response.value.length);
    return response.value;
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};

export const getEmployeeById = async (id: string): Promise<Employee> => {
  const response = await dataverseClient.get<Employee>(`employees(${id})`);
  return response;
};

export const createEmployee = async (data: CreateEmployeeRequest) => {
  const response = await dataverseClient.post<Employee>("employees", data);
  console.log("Employee created:", response);
  return response;
};

export const updateEmployee = async (id: string, data: Partial<CreateEmployeeRequest>) => {
  const response = await dataverseClient.patch<Employee>(`employees(${id})`, data);
  return response;
};

export const deleteEmployee = async (id: string): Promise<void> => {
  await dataverseClient.delete(`employees(${id})`);
};

export const getEmployeeStats = async () => {
  try {
    const fetchXml = `
      <fetch aggregate='true'>
        <entity name='employee'>
          <attribute name='employeeid' aggregate='count' alias='total' />
          <attribute name='department' aggregate='groupby' alias='department' />
          <attribute name='employeetype' aggregate='groupby' alias='type' />
        </entity>
      </fetch>
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await dataverseClient.fetchXml<any>(fetchXml);
    return response;
  } catch (error) {
    console.error("Error fetching employee stats:", error);
    throw error;
  }
};