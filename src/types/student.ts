import { BaseEntity } from './index';

export interface Student extends BaseEntity {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    email: string;
    phone: string;
    address: string;
    enrollmentDate: string;
    status: 'active' | 'graduated' | 'transferred' | 'suspended';
    guardianName: string;
    guardianPhone: string;
    guardianEmail: string;
    rollNumber?: string;
    className?: string;
    profileImage?: string;
}

export interface StudentFormData {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    email: string;
    phone: string;
    address: string;
    guardianName: string;
    guardianPhone: string;
    guardianEmail: string;
    className?: string;
}

export interface StudentFilters {
    search?: string;
    status?: string;
    className?: string;
    page?: number;
    pageSize?: number;
}