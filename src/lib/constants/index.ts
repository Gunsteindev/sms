// ─── Gender ────────────────────────────────────────────────────────────────

/** Form value → Dataverse option-set code */
export const GENDER = { Male: 1, Female: 2 } as const;
export type GenderCode = (typeof GENDER)[keyof typeof GENDER];

/** Dataverse code → display label */
export const GENDER_LABEL: Record<number, string> = { 1: 'Male', 2: 'Female' };

// ─── Student status ────────────────────────────────────────────────────────

export const STUDENT_STATUS = {
    Active:      1,
    Graduated:   2,
    Transferred: 3,
    Suspended:   4,
} as const;
export type StudentStatusCode = (typeof STUDENT_STATUS)[keyof typeof STUDENT_STATUS];

export const STUDENT_STATUS_LABEL: Record<number, string> = {
    1: 'Active',
    2: 'Graduated',
    3: 'Transferred',
    4: 'Suspended',
};

export const STUDENT_STATUS_VARIANT: Record<number, 'success' | 'info' | 'warning' | 'error'> = {
    1: 'success',
    2: 'info',
    3: 'warning',
    4: 'error',
};

export const STUDENT_STATUS_OPTIONS = [
    { value: 1, label: 'Active',      variant: 'success' as const },
    { value: 2, label: 'Graduated',   variant: 'info'    as const },
    { value: 3, label: 'Transferred', variant: 'warning' as const },
    { value: 4, label: 'Suspended',   variant: 'error'   as const },
];

// ─── Enrollment status ─────────────────────────────────────────────────────
//
// Dataverse sms_enrollmentstatus has only ONE valid option-set value (922330000).
// The UI shows multiple labels but all map to the same code until more options
// are added in the Power Apps admin.

export const ENROLLMENT_STATUS_CODE = 922330000;

export const ENROLLMENT_STATUS_LABEL: Record<number, string> = {
    [ENROLLMENT_STATUS_CODE]: 'Enrolled',
};

export const ENROLLMENT_STATUS_OPTIONS = [
    { value: ENROLLMENT_STATUS_CODE, label: 'Enrolled' },
];

// ─── Teacher status ────────────────────────────────────────────────────────

export const TEACHER_STATUS = { Active: 1, OnLeave: 2, Resigned: 3 } as const;
export type TeacherStatusCode = (typeof TEACHER_STATUS)[keyof typeof TEACHER_STATUS];

export const TEACHER_STATUS_LABEL: Record<number, string> = {
    1: 'Active',
    2: 'On Leave',
    3: 'Resigned',
};

// ─── Employee status / type ────────────────────────────────────────────────

export const EMPLOYEE_STATUS = { Active: 1, OnLeave: 2, Resigned: 3, Terminated: 4 } as const;
export type EmployeeStatusCode = (typeof EMPLOYEE_STATUS)[keyof typeof EMPLOYEE_STATUS];

export const EMPLOYEE_STATUS_LABEL: Record<number, string> = {
    1: 'Active',
    2: 'On Leave',
    3: 'Resigned',
    4: 'Terminated',
};

export const EMPLOYEE_TYPE = { FullTime: 1, PartTime: 2, Contract: 3, Intern: 4 } as const;

export const EMPLOYEE_TYPE_LABEL: Record<number, string> = {
    1: 'Full-time',
    2: 'Part-time',
    3: 'Contract',
    4: 'Intern',
};

// ─── User roles ────────────────────────────────────────────────────────────

export const USER_ROLE = {
    Admin:             1,
    Teacher:           2,
    Finance:           3,
    InventoryManager:  4,
    TransportManager:  5,
    PoolAttendant:     6,
    Parent:            7,
    KitchenAttendant:  8,
} as const;
export type UserRoleCode = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const USER_ROLE_LABEL: Record<number, string> = {
    1: 'Admin',
    2: 'Teacher',
    3: 'Finance',
    4: 'Inventory Manager',
    5: 'Transport Manager',
    6: 'Pool Attendant',
    7: 'Parent',
    8: 'Kitchen Attendant',
};
