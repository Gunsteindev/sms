import { BaseEntity } from './index';

export interface Employee extends BaseEntity {
    employeeCode: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    email: string;
    phone: string;
    address: string;
    department: string;
    designation: string;
    employeeType: 'full-time' | 'part-time' | 'contract' | 'intern';
    hireDate: string;
    status: 'active' | 'on-leave' | 'resigned' | 'terminated';
    salary?: number;
    bankAccount?: string;
    emergencyContact: string;
    emergencyPhone: string;
}

export interface EmployeeFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    designation: string;
    employeeType: string;
    hireDate: string;
    salary?: number;
}