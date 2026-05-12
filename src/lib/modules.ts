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
      { key: 'pool', label: 'Swimming Pool', desc: 'Pool sessions and rentals' },
    ],
  },
];

export const ALL_MODULE_KEYS: string[] = MODULE_GROUPS.flatMap(g => g.modules.map(m => m.key));

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
];

export function moduleForPath(pathname: string): string | null {
  const match = ROUTE_MODULE_MAP.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/'));
  return match ? match[1] : null;
}
