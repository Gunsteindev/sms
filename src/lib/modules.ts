// All toggleable modules. The key maps to NavItem.module in the Sidebar.
// Modules without a key in this list are always shown (dashboard, setup, docs).

export interface ModuleDef {
  key: string;
  label: string;
  desc: string;
}

export interface ModuleGroup {
  group: string;
  modules: ModuleDef[];
}

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    group: 'People',
    modules: [
      { key: 'students',  label: 'Students',  desc: 'Student records and profiles' },
      { key: 'teachers',  label: 'Teachers',  desc: 'Teaching staff management' },
      { key: 'employees', label: 'Employees', desc: 'Non-teaching staff' },
      { key: 'parents',   label: 'Parents',   desc: 'Guardian profiles and portal access' },
    ],
  },
  {
    group: 'Academic',
    modules: [
      { key: 'classes',     label: 'Classes',     desc: 'Classroom management' },
      { key: 'subjects',    label: 'Subjects',    desc: 'Course catalogue' },
      { key: 'timetable',   label: 'Timetable',   desc: 'Class schedules' },
      { key: 'enrollments', label: 'Enrollments', desc: 'Student class assignments' },
      { key: 'attendance',  label: 'Attendance',  desc: 'Daily attendance marking' },
      { key: 'exams',       label: 'Exams',       desc: 'Exam scheduling and results' },
      { key: 'gradebook',   label: 'Gradebook',   desc: 'Continuous assessment scores' },
    ],
  },
  {
    group: 'Welfare',
    modules: [
      { key: 'health',       label: 'Health Records', desc: 'Student medical records' },
      { key: 'disciplinary', label: 'Disciplinary',   desc: 'Incident and sanction tracking' },
    ],
  },
  {
    group: 'Administration',
    modules: [
      { key: 'departments',   label: 'Departments',   desc: 'Academic department structure' },
      { key: 'library',       label: 'Library',       desc: 'Book catalogue and loans' },
      { key: 'inventory',     label: 'Inventory',     desc: 'Stock and asset management' },
      { key: 'procurement',   label: 'Procurement',   desc: 'Purchase order tracking' },
      { key: 'staff-leave',   label: 'Staff Leave',   desc: 'Leave applications and approvals' },
      { key: 'announcements', label: 'Announcements', desc: 'School-wide notices' },
      { key: 'transport',     label: 'Transport',     desc: 'Fleet and route management' },
      { key: 'activities',    label: 'Activities',    desc: 'Extra-curricular programmes' },
      { key: 'reports',       label: 'Reports',       desc: 'Report cards and national exams' },
    ],
  },
  {
    group: 'Finance',
    modules: [
      { key: 'fees',         label: 'Fees',         desc: 'Fee invoices and payments' },
      { key: 'scholarships', label: 'Scholarships', desc: 'Scholarship and bursary management' },
    ],
  },
  {
    group: 'Facilities',
    modules: [
      { key: 'pool',    label: 'Swimming Pool',    desc: 'Pool sessions and rentals' },
      { key: 'kitchen', label: 'Kitchen / Cafeteria', desc: 'Daily menus and meal order tracking' },
    ],
  },
];

export const ALL_MODULE_KEYS: string[] = MODULE_GROUPS.flatMap(g => g.modules.map(m => m.key));

// Per-role module access. Keyed by user-role number (see USER_ROLES in
// src/lib/dataverse/users.ts), value is the list of module keys that role may reach.
// The super admin (bootstrap) always bypasses this map.
export type RoleModuleAccess = Record<number, string[]>;

// Default access per module — the role numbers that historically saw each module
// in the Sidebar. Used to seed the matrix and as a fallback when a school has no
// saved configuration. Role numbers: 1=Admin 2=Teacher 3=Finance 4=Inventory
// 5=Transport 6=Pool 7=Parent 8=Kitchen.
export const MODULE_DEFAULT_ROLES: Record<string, number[]> = {
  students:      [1, 2, 3, 4],
  teachers:      [1],
  employees:     [1],
  parents:       [1, 2, 3],
  classes:       [1, 2],
  subjects:      [1, 2],
  timetable:     [1, 2],
  enrollments:   [1, 2, 3],
  attendance:    [1, 2],
  exams:         [1, 2],
  gradebook:     [1, 2],
  health:        [1, 2],
  disciplinary:  [1, 2],
  departments:   [1],
  library:       [1, 4],
  inventory:     [1, 4],
  procurement:   [1, 3],
  'staff-leave': [1],
  announcements: [1, 2, 3],
  transport:     [1, 5],
  activities:    [1, 2],
  reports:       [1, 2, 3],
  fees:          [1, 3],
  scholarships:  [1, 3],
  pool:          [1, 6, 8],
  kitchen:       [1, 8],
};

// All roles that can hold module access (excludes Parent, who uses the separate portal).
export const ACCESS_ROLES: number[] = [1, 2, 3, 4, 5, 6, 8];

// Builds the default role → module-keys map by inverting MODULE_DEFAULT_ROLES.
export function defaultRoleModuleAccess(): RoleModuleAccess {
  const map: RoleModuleAccess = {};
  for (const role of ACCESS_ROLES) map[role] = [];
  for (const [moduleKey, roles] of Object.entries(MODULE_DEFAULT_ROLES)) {
    for (const role of roles) {
      if (!map[role]) map[role] = [];
      map[role].push(moduleKey);
    }
  }
  return map;
}

// True if `role` may access `moduleKey` given a (possibly partial) access map.
// Falls back to MODULE_DEFAULT_ROLES when the role has no configured entry.
export function roleHasModule(access: RoleModuleAccess | undefined, role: number, moduleKey: string): boolean {
  const configured = access?.[role];
  if (configured) return configured.includes(moduleKey);
  return (MODULE_DEFAULT_ROLES[moduleKey] ?? []).includes(role);
}

// Maps route prefixes to the module key that controls them.
// Checked with startsWith so /students/[id] is covered by '/students'.
// Routes not in this map are always accessible (dashboard, setup, docs, etc.)
export const ROUTE_MODULE_MAP: Array<[string, string]> = [
  ['/students',             'students'     ],
  ['/teachers',             'teachers'     ],
  ['/employees',            'employees'    ],
  ['/parents',              'parents'      ],
  ['/classes',              'classes'      ],
  ['/subjects',             'subjects'     ],
  ['/timetable',            'timetable'    ],
  ['/enrollments',          'enrollments'  ],
  ['/attendance',           'attendance'   ],
  ['/exams',                'exams'        ],
  ['/gradebook',            'gradebook'    ],
  ['/health',               'health'       ],
  ['/disciplinary',         'disciplinary' ],
  ['/departments',          'departments'  ],
  ['/library',              'library'      ],
  ['/inventory',            'inventory'    ],
  ['/procurement',          'procurement'  ],
  ['/staff-leave',          'staff-leave'  ],
  ['/announcements',        'announcements'],
  ['/transport',            'transport'    ],
  ['/activities',           'activities'   ],
  ['/reports',              'reports'      ],
  ['/fees',                      'fees'        ],
  ['/finance/fee-structures',    'fees'        ],
  ['/finance/fee-payments',      'fees'        ],
  ['/finance/scholarships',      'scholarships'],
  ['/pool',                      'pool'        ],
  ['/kitchen',                   'kitchen'     ],
];

export function moduleForPath(pathname: string): string | null {
  const match = ROUTE_MODULE_MAP.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/'));
  return match ? match[1] : null;
}
