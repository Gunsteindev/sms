/**
 * seed-people.ts — Seeds teachers, subjects, classes, parents, and students
 * with real-world Ghana Basic Education records. Runs in dependency order:
 *   grade-level lookups → teachers → subjects → classes → parents → students
 * Skips records that already exist. Safe to re-run.
 * Run: npx tsx scripts/seed-people.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T  = process.env.AZURE_TENANT_ID!;
const C  = process.env.AZURE_CLIENT_ID!;
const S  = process.env.AZURE_CLIENT_SECRET!;
const D  = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

async function getToken() {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({
            client_id: C, client_secret: S,
            scope: `${D}/.default`, grant_type: 'client_credentials',
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
}

function hdr(token: string) {
    return {
        Authorization: `Bearer ${token}`, Accept: 'application/json',
        'OData-MaxVersion': '4.0', 'OData-Version': '4.0',
        Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
    };
}
function phdr(token: string) {
    return { ...hdr(token), 'Content-Type': 'application/json', Prefer: 'return=representation' };
}

// ─── seed data ────────────────────────────────────────────────────────────────

const TEACHERS = [
    { first: 'Akosua',   last: 'Mensah',      dob: '1985-03-15', gender: 2, email: 'akosua.mensah@ghs.edu.gh',   phone: '0244123001', hired: '2015-09-01', qual: 'B.Ed Primary Education',   spec: 'Primary Education',  addr: 'Accra, Ghana'      },
    { first: 'Kofi',     last: 'Asante',      dob: '1980-07-22', gender: 1, email: 'kofi.asante@ghs.edu.gh',     phone: '0244123002', hired: '2010-09-01', qual: 'B.Ed Primary Education',   spec: 'Primary Education',  addr: 'Kumasi, Ghana'     },
    { first: 'Abena',    last: 'Boateng',     dob: '1988-11-05', gender: 2, email: 'abena.boateng@ghs.edu.gh',   phone: '0244123003', hired: '2018-01-10', qual: 'B.Ed Primary Education',   spec: 'Primary Education',  addr: 'Accra, Ghana'      },
    { first: 'Kwame',    last: 'Owusu',       dob: '1975-04-30', gender: 1, email: 'kwame.owusu@ghs.edu.gh',     phone: '0244123004', hired: '2005-09-01', qual: 'B.Ed Primary Education',   spec: 'Primary Education',  addr: 'Tema, Ghana'       },
    { first: 'Ama',      last: 'Adjei',       dob: '1990-08-14', gender: 2, email: 'ama.adjei@ghs.edu.gh',       phone: '0244123005', hired: '2019-09-01', qual: 'B.Ed Primary Education',   spec: 'Primary Education',  addr: 'Accra, Ghana'      },
    { first: 'Yaw',      last: 'Darko',       dob: '1983-01-28', gender: 1, email: 'yaw.darko@ghs.edu.gh',       phone: '0244123006', hired: '2012-09-01', qual: 'B.Ed Primary Education',   spec: 'Primary Education',  addr: 'Cape Coast, Ghana' },
    { first: 'Efua',     last: 'Nkrumah',     dob: '1979-09-12', gender: 2, email: 'efua.nkrumah@ghs.edu.gh',   phone: '0244123007', hired: '2008-01-15', qual: 'M.Ed Mathematics',          spec: 'Mathematics',        addr: 'Accra, Ghana'      },
    { first: 'Kwabena',  last: 'Osei',        dob: '1982-06-19', gender: 1, email: 'kwabena.osei@ghs.edu.gh',   phone: '0244123008', hired: '2011-09-01', qual: 'B.A. English',              spec: 'English Language',   addr: 'Kumasi, Ghana'     },
    { first: 'Adwoa',    last: 'Amankwah',    dob: '1986-02-25', gender: 2, email: 'adwoa.amankwah@ghs.edu.gh', phone: '0244123009', hired: '2016-09-01', qual: 'B.Sc Science Education',   spec: 'Integrated Science', addr: 'Accra, Ghana'      },
    { first: 'Kojo',     last: 'Appiah',      dob: '1977-12-08', gender: 1, email: 'kojo.appiah@ghs.edu.gh',    phone: '0244123010', hired: '2007-09-01', qual: 'B.Ed Social Studies',       spec: 'Social Studies',     addr: 'Accra, Ghana'      },
    { first: 'Akua',     last: 'Frimpong',    dob: '1992-05-17', gender: 2, email: 'akua.frimpong@ghs.edu.gh',  phone: '0244123011', hired: '2020-09-01', qual: 'B.A. French',               spec: 'French',             addr: 'Takoradi, Ghana'   },
    { first: 'Nana',     last: 'Amponsah',    dob: '1984-10-03', gender: 1, email: 'nana.amponsah@ghs.edu.gh',  phone: '0244123012', hired: '2014-09-01', qual: 'B.Ed Religious Studies',    spec: 'RME & Pre-Technical', addr: 'Kumasi, Ghana'    },
];

// sms_type picklist: 922330000=Core, 922330001=Elective, 922330002=Extra
const SUBJECT_TYPE = { Core: 922330000, Elective: 922330001, Extra: 922330002 };

// grade: grade level NAME as seeded in sms_gradelevels
// teacher: first+last name (resolved at runtime)
interface SubjectSeed {
    name: string; code: string; type: number; credits: number; pass: number;
    grade: string; teacher: string; desc: string;
}
const SUBJECTS: SubjectSeed[] = [
    { name: 'English Language',          code: 'ENG',    type: SUBJECT_TYPE.Core,     credits: 3, pass: 50, grade: 'Primary 1', teacher: 'Akosua Mensah',   desc: 'Phonics, grammar, composition, and oral communication.'      },
    { name: 'Mathematics',               code: 'MTH',    type: SUBJECT_TYPE.Core,     credits: 3, pass: 50, grade: 'Primary 1', teacher: 'Kofi Asante',     desc: 'Number sense, basic operations, and problem-solving skills.' },
    { name: 'Ghanaian Language',         code: 'GLC',    type: SUBJECT_TYPE.Core,     credits: 2, pass: 50, grade: 'Primary 1', teacher: 'Abena Boateng',   desc: 'Twi language, proverbs, and Ghanaian cultural studies.'      },
    { name: 'Creative Arts & Design',    code: 'CAD',    type: SUBJECT_TYPE.Core,     credits: 2, pass: 40, grade: 'Primary 1', teacher: 'Ama Adjei',       desc: 'Visual arts, craft, music, and drama at primary level.'      },
    { name: 'Science',                   code: 'SCI',    type: SUBJECT_TYPE.Core,     credits: 3, pass: 50, grade: 'Primary 3', teacher: 'Adwoa Amankwah',  desc: 'Basic biology, physics, and chemistry concepts.'             },
    { name: 'Our World Our People',      code: 'OWP',    type: SUBJECT_TYPE.Core,     credits: 2, pass: 50, grade: 'Primary 3', teacher: 'Kojo Appiah',     desc: 'Social studies, history, civics, and geography.'             },
    { name: 'Religious & Moral Educ.',   code: 'RME',    type: SUBJECT_TYPE.Core,     credits: 2, pass: 40, grade: 'Primary 3', teacher: 'Nana Amponsah',   desc: 'Values, ethics, and comparative religious studies.'          },
    { name: 'English Language (JHS)',    code: 'ENGJHS', type: SUBJECT_TYPE.Core,     credits: 4, pass: 50, grade: 'JHS 1',     teacher: 'Kwabena Osei',    desc: 'Advanced grammar, literature, essays, and debates.'          },
    { name: 'Mathematics (JHS)',         code: 'MTHJHS', type: SUBJECT_TYPE.Core,     credits: 4, pass: 50, grade: 'JHS 1',     teacher: 'Efua Nkrumah',    desc: 'Algebra, geometry, statistics, and BECE preparation.'        },
    { name: 'Integrated Science',        code: 'ISC',    type: SUBJECT_TYPE.Core,     credits: 4, pass: 50, grade: 'JHS 1',     teacher: 'Adwoa Amankwah',  desc: 'Physics, chemistry, biology; laboratory and field work.'     },
    { name: 'Social Studies (JHS)',      code: 'SSTJHS', type: SUBJECT_TYPE.Core,     credits: 3, pass: 50, grade: 'JHS 1',     teacher: 'Kojo Appiah',     desc: 'West African history, geography, civics, and governance.'    },
    { name: 'French',                    code: 'FRN',    type: SUBJECT_TYPE.Core,     credits: 3, pass: 50, grade: 'JHS 1',     teacher: 'Akua Frimpong',   desc: 'French oral and written communication; BECE French module.'  },
    { name: 'Religious & Moral Ed. JHS', code: 'RMEJHS', type: SUBJECT_TYPE.Core,     credits: 2, pass: 40, grade: 'JHS 1',     teacher: 'Nana Amponsah',   desc: 'Ethics, world religions, and moral reasoning.'               },
    { name: 'Pre-Technical Skills',      code: 'PTS',    type: SUBJECT_TYPE.Core,     credits: 3, pass: 50, grade: 'JHS 1',     teacher: 'Nana Amponsah',   desc: 'Woodwork, metalwork, home economics, and agricultural sci.'  },
    { name: 'ICT & Computing',           code: 'ICT',    type: SUBJECT_TYPE.Elective, credits: 2, pass: 50, grade: 'JHS 1',     teacher: 'Efua Nkrumah',    desc: 'Digital literacy, office applications, and basic coding.'    },
];

// grade: grade level name; teacher: first+last name
interface ClassSeed {
    name: string; section: string; capacity: number; room: string;
    grade: string; teacher: string;
}
const CLASSES: ClassSeed[] = [
    { name: 'Primary 1A', section: 'A', capacity: 32, room: 'Room 101', grade: 'Primary 1', teacher: 'Akosua Mensah'  },
    { name: 'Primary 2A', section: 'A', capacity: 30, room: 'Room 102', grade: 'Primary 2', teacher: 'Kofi Asante'    },
    { name: 'Primary 3A', section: 'A', capacity: 31, room: 'Room 103', grade: 'Primary 3', teacher: 'Abena Boateng'  },
    { name: 'Primary 4A', section: 'A', capacity: 33, room: 'Room 104', grade: 'Primary 4', teacher: 'Kwame Owusu'    },
    { name: 'Primary 5A', section: 'A', capacity: 30, room: 'Room 105', grade: 'Primary 5', teacher: 'Ama Adjei'      },
    { name: 'Primary 6A', section: 'A', capacity: 29, room: 'Room 106', grade: 'Primary 6', teacher: 'Yaw Darko'      },
    { name: 'JHS 1A',     section: 'A', capacity: 35, room: 'Room 201', grade: 'JHS 1',     teacher: 'Kwabena Osei'   },
    { name: 'JHS 2A',     section: 'A', capacity: 33, room: 'Room 202', grade: 'JHS 2',     teacher: 'Efua Nkrumah'   },
    { name: 'JHS 3A',     section: 'A', capacity: 32, room: 'Room 203', grade: 'JHS 3',     teacher: 'Adwoa Amankwah' },
];

// relationship: 1=Father, 2=Mother, 3=Guardian, 4=Other
const PARENTS = [
    { first: 'Emmanuel', last: 'Asante',      rel: 1, email: 'emmanuel.asante@gmail.com',     phone: '0244500001', addr: 'East Legon, Accra'      },
    { first: 'Grace',    last: 'Mensah',      rel: 2, email: 'grace.mensah@gmail.com',         phone: '0244500002', addr: 'Achimota, Accra'        },
    { first: 'Samuel',   last: 'Boateng',     rel: 1, email: 'samuel.boateng@yahoo.com',       phone: '0244500003', addr: 'Adum, Kumasi'           },
    { first: 'Comfort',  last: 'Owusu',       rel: 2, email: 'comfort.owusu@gmail.com',        phone: '0244500004', addr: 'Suame, Kumasi'          },
    { first: 'Joseph',   last: 'Adjei',       rel: 1, email: 'joseph.adjei@gmail.com',         phone: '0244500005', addr: 'Dansoman, Accra'        },
    { first: 'Rebecca',  last: 'Darko',       rel: 2, email: 'rebecca.darko@gmail.com',        phone: '0244500006', addr: 'Tema Community 1'       },
    { first: 'Isaac',    last: 'Nkrumah',     rel: 1, email: 'isaac.nkrumah@gmail.com',        phone: '0244500007', addr: 'Osu, Accra'             },
    { first: 'Agnes',    last: 'Osei',        rel: 2, email: 'agnes.osei@yahoo.com',           phone: '0244500008', addr: 'Bantama, Kumasi'        },
    { first: 'Benjamin', last: 'Amankwah',    rel: 1, email: 'benjamin.amankwah@gmail.com',    phone: '0244500009', addr: 'Cape Coast, CR'         },
    { first: 'Esther',   last: 'Appiah',      rel: 2, email: 'esther.appiah@gmail.com',        phone: '0244500010', addr: 'Labone, Accra'          },
    { first: 'Daniel',   last: 'Frimpong',    rel: 1, email: 'daniel.frimpong@gmail.com',      phone: '0244500011', addr: 'Takoradi, WR'           },
    { first: 'Mary',     last: 'Amponsah',    rel: 2, email: 'mary.amponsah@yahoo.com',        phone: '0244500012', addr: 'Madina, Accra'          },
    { first: 'Michael',  last: 'Agyei',       rel: 1, email: 'michael.agyei@gmail.com',        phone: '0244500013', addr: 'Nhyiaeso, Kumasi'       },
    { first: 'Hanna',    last: 'Bediako',     rel: 2, email: 'hanna.bediako@gmail.com',        phone: '0244500014', addr: 'Asylum Down, Accra'     },
    { first: 'Peter',    last: 'Quaye',       rel: 3, email: 'peter.quaye@gmail.com',          phone: '0244500015', addr: 'Adabraka, Accra'        },
    { first: 'Naomi',    last: 'Tetteh',      rel: 2, email: 'naomi.tetteh@gmail.com',         phone: '0244500016', addr: 'Tema Community 5'       },
    { first: 'George',   last: 'Asiedu',      rel: 1, email: 'george.asiedu@gmail.com',        phone: '0244500017', addr: 'Kwame Nkrumah Ave, KS'  },
    { first: 'Victoria', last: 'Acheampong',  rel: 2, email: 'victoria.acheampong@yahoo.com',  phone: '0244500018', addr: 'Ridge, Accra'           },
    { first: 'Frank',    last: 'Kumi',        rel: 1, email: 'frank.kumi@gmail.com',           phone: '0244500019', addr: 'Cape Coast, CR'         },
    { first: 'Dorothy',  last: 'Adusei',      rel: 2, email: 'dorothy.adusei@gmail.com',       phone: '0244500020', addr: 'Tamale, NR'             },
];

// class: class name (from CLASSES); parent: parent first+last name; gender: 1=Male 2=Female
interface StudentSeed {
    first: string; last: string; dob: string; gender: number;
    num: string; class: string; grade: string;
    parentFirst: string; parentLast: string;
    guardianName: string; guardianPhone: string;
}
const STUDENTS: StudentSeed[] = [
    // Primary 1A
    { first: 'Kofi',      last: 'Asante Jr',    dob: '2019-03-10', gender: 1, num: 'STU-2025-001', class: 'Primary 1A', grade: 'Primary 1', parentFirst: 'Emmanuel', parentLast: 'Asante',     guardianName: 'Emmanuel Asante',    guardianPhone: '0244500001' },
    { first: 'Ama',       last: 'Mensah',        dob: '2019-07-22', gender: 2, num: 'STU-2025-002', class: 'Primary 1A', grade: 'Primary 1', parentFirst: 'Grace',    parentLast: 'Mensah',     guardianName: 'Grace Mensah',       guardianPhone: '0244500002' },
    { first: 'Kwame',     last: 'Boateng',       dob: '2019-01-15', gender: 1, num: 'STU-2025-003', class: 'Primary 1A', grade: 'Primary 1', parentFirst: 'Samuel',   parentLast: 'Boateng',    guardianName: 'Samuel Boateng',     guardianPhone: '0244500003' },
    { first: 'Abena',     last: 'Owusu',         dob: '2019-05-30', gender: 2, num: 'STU-2025-004', class: 'Primary 1A', grade: 'Primary 1', parentFirst: 'Comfort',  parentLast: 'Owusu',      guardianName: 'Comfort Owusu',      guardianPhone: '0244500004' },
    // Primary 2A
    { first: 'Yaw',       last: 'Adjei',         dob: '2018-09-04', gender: 1, num: 'STU-2025-005', class: 'Primary 2A', grade: 'Primary 2', parentFirst: 'Joseph',   parentLast: 'Adjei',      guardianName: 'Joseph Adjei',       guardianPhone: '0244500005' },
    { first: 'Akua',      last: 'Darko',         dob: '2018-12-18', gender: 2, num: 'STU-2025-006', class: 'Primary 2A', grade: 'Primary 2', parentFirst: 'Rebecca',  parentLast: 'Darko',      guardianName: 'Rebecca Darko',      guardianPhone: '0244500006' },
    { first: 'Kojo',      last: 'Nkrumah',       dob: '2018-03-25', gender: 1, num: 'STU-2025-007', class: 'Primary 2A', grade: 'Primary 2', parentFirst: 'Isaac',    parentLast: 'Nkrumah',    guardianName: 'Isaac Nkrumah',      guardianPhone: '0244500007' },
    { first: 'Efua',      last: 'Osei',          dob: '2018-08-11', gender: 2, num: 'STU-2025-008', class: 'Primary 2A', grade: 'Primary 2', parentFirst: 'Agnes',    parentLast: 'Osei',       guardianName: 'Agnes Osei',         guardianPhone: '0244500008' },
    // Primary 3A
    { first: 'Kwabena',   last: 'Amankwah',      dob: '2017-06-07', gender: 1, num: 'STU-2025-009', class: 'Primary 3A', grade: 'Primary 3', parentFirst: 'Benjamin', parentLast: 'Amankwah',   guardianName: 'Benjamin Amankwah',  guardianPhone: '0244500009' },
    { first: 'Adwoa',     last: 'Appiah',        dob: '2017-02-14', gender: 2, num: 'STU-2025-010', class: 'Primary 3A', grade: 'Primary 3', parentFirst: 'Esther',   parentLast: 'Appiah',     guardianName: 'Esther Appiah',      guardianPhone: '0244500010' },
    { first: 'Fiifi',     last: 'Frimpong',      dob: '2017-10-20', gender: 1, num: 'STU-2025-011', class: 'Primary 3A', grade: 'Primary 3', parentFirst: 'Daniel',   parentLast: 'Frimpong',   guardianName: 'Daniel Frimpong',    guardianPhone: '0244500011' },
    { first: 'Nana',      last: 'Amponsah',      dob: '2017-04-03', gender: 2, num: 'STU-2025-012', class: 'Primary 3A', grade: 'Primary 3', parentFirst: 'Mary',     parentLast: 'Amponsah',   guardianName: 'Mary Amponsah',      guardianPhone: '0244500012' },
    // Primary 4A
    { first: 'Akosua',    last: 'Agyei',         dob: '2016-11-28', gender: 2, num: 'STU-2025-013', class: 'Primary 4A', grade: 'Primary 4', parentFirst: 'Michael',  parentLast: 'Agyei',      guardianName: 'Michael Agyei',      guardianPhone: '0244500013' },
    { first: 'Emmanuel',  last: 'Bediako',       dob: '2016-07-09', gender: 1, num: 'STU-2025-014', class: 'Primary 4A', grade: 'Primary 4', parentFirst: 'Hanna',    parentLast: 'Bediako',    guardianName: 'Hanna Bediako',      guardianPhone: '0244500014' },
    { first: 'Gifty',     last: 'Quaye',         dob: '2016-03-16', gender: 2, num: 'STU-2025-015', class: 'Primary 4A', grade: 'Primary 4', parentFirst: 'Peter',    parentLast: 'Quaye',      guardianName: 'Peter Quaye',        guardianPhone: '0244500015' },
    { first: 'Bright',    last: 'Tetteh',        dob: '2016-09-01', gender: 1, num: 'STU-2025-016', class: 'Primary 4A', grade: 'Primary 4', parentFirst: 'Naomi',    parentLast: 'Tetteh',     guardianName: 'Naomi Tetteh',       guardianPhone: '0244500016' },
    // Primary 5A
    { first: 'Bernice',   last: 'Asiedu',        dob: '2015-05-20', gender: 2, num: 'STU-2025-017', class: 'Primary 5A', grade: 'Primary 5', parentFirst: 'George',   parentLast: 'Asiedu',     guardianName: 'George Asiedu',      guardianPhone: '0244500017' },
    { first: 'Courage',   last: 'Acheampong',    dob: '2015-01-08', gender: 1, num: 'STU-2025-018', class: 'Primary 5A', grade: 'Primary 5', parentFirst: 'Victoria', parentLast: 'Acheampong', guardianName: 'Victoria Acheampong',guardianPhone: '0244500018' },
    { first: 'Doris',     last: 'Kumi',          dob: '2015-08-14', gender: 2, num: 'STU-2025-019', class: 'Primary 5A', grade: 'Primary 5', parentFirst: 'Frank',    parentLast: 'Kumi',       guardianName: 'Frank Kumi',         guardianPhone: '0244500019' },
    { first: 'Felix',     last: 'Adusei',        dob: '2015-12-30', gender: 1, num: 'STU-2025-020', class: 'Primary 5A', grade: 'Primary 5', parentFirst: 'Dorothy',  parentLast: 'Adusei',     guardianName: 'Dorothy Adusei',     guardianPhone: '0244500020' },
    // Primary 6A
    { first: 'Gloria',    last: 'Asante',        dob: '2014-04-17', gender: 2, num: 'STU-2025-021', class: 'Primary 6A', grade: 'Primary 6', parentFirst: 'Emmanuel', parentLast: 'Asante',     guardianName: 'Emmanuel Asante',    guardianPhone: '0244500001' },
    { first: 'Herman',    last: 'Mensah',        dob: '2014-09-05', gender: 1, num: 'STU-2025-022', class: 'Primary 6A', grade: 'Primary 6', parentFirst: 'Grace',    parentLast: 'Mensah',     guardianName: 'Grace Mensah',       guardianPhone: '0244500002' },
    { first: 'Irene',     last: 'Boateng',       dob: '2014-02-28', gender: 2, num: 'STU-2025-023', class: 'Primary 6A', grade: 'Primary 6', parentFirst: 'Samuel',   parentLast: 'Boateng',    guardianName: 'Samuel Boateng',     guardianPhone: '0244500003' },
    { first: 'John',      last: 'Owusu',         dob: '2014-07-12', gender: 1, num: 'STU-2025-024', class: 'Primary 6A', grade: 'Primary 6', parentFirst: 'Comfort',  parentLast: 'Owusu',      guardianName: 'Comfort Owusu',      guardianPhone: '0244500004' },
    // JHS 1A
    { first: 'Kekeli',    last: 'Adjei',         dob: '2013-10-03', gender: 1, num: 'STU-2025-025', class: 'JHS 1A',     grade: 'JHS 1',     parentFirst: 'Joseph',   parentLast: 'Adjei',      guardianName: 'Joseph Adjei',       guardianPhone: '0244500005' },
    { first: 'Linda',     last: 'Darko',         dob: '2013-05-19', gender: 2, num: 'STU-2025-026', class: 'JHS 1A',     grade: 'JHS 1',     parentFirst: 'Rebecca',  parentLast: 'Darko',      guardianName: 'Rebecca Darko',      guardianPhone: '0244500006' },
    { first: 'Michael',   last: 'Nkrumah',       dob: '2013-01-24', gender: 1, num: 'STU-2025-027', class: 'JHS 1A',     grade: 'JHS 1',     parentFirst: 'Isaac',    parentLast: 'Nkrumah',    guardianName: 'Isaac Nkrumah',      guardianPhone: '0244500007' },
    { first: 'Nancy',     last: 'Osei',          dob: '2013-08-06', gender: 2, num: 'STU-2025-028', class: 'JHS 1A',     grade: 'JHS 1',     parentFirst: 'Agnes',    parentLast: 'Osei',       guardianName: 'Agnes Osei',         guardianPhone: '0244500008' },
    // JHS 2A
    { first: 'Oscar',     last: 'Amankwah',      dob: '2012-11-15', gender: 1, num: 'STU-2025-029', class: 'JHS 2A',     grade: 'JHS 2',     parentFirst: 'Benjamin', parentLast: 'Amankwah',   guardianName: 'Benjamin Amankwah',  guardianPhone: '0244500009' },
    { first: 'Patricia',  last: 'Appiah',        dob: '2012-06-27', gender: 2, num: 'STU-2025-030', class: 'JHS 2A',     grade: 'JHS 2',     parentFirst: 'Esther',   parentLast: 'Appiah',     guardianName: 'Esther Appiah',      guardianPhone: '0244500010' },
    { first: 'Quentin',   last: 'Frimpong',      dob: '2012-03-08', gender: 1, num: 'STU-2025-031', class: 'JHS 2A',     grade: 'JHS 2',     parentFirst: 'Daniel',   parentLast: 'Frimpong',   guardianName: 'Daniel Frimpong',    guardianPhone: '0244500011' },
    { first: 'Rachel',    last: 'Amponsah',      dob: '2012-09-21', gender: 2, num: 'STU-2025-032', class: 'JHS 2A',     grade: 'JHS 2',     parentFirst: 'Mary',     parentLast: 'Amponsah',   guardianName: 'Mary Amponsah',      guardianPhone: '0244500012' },
    // JHS 3A
    { first: 'Samuel',    last: 'Agyei',         dob: '2011-07-14', gender: 1, num: 'STU-2025-033', class: 'JHS 3A',     grade: 'JHS 3',     parentFirst: 'Michael',  parentLast: 'Agyei',      guardianName: 'Michael Agyei',      guardianPhone: '0244500013' },
    { first: 'Theresa',   last: 'Bediako',       dob: '2011-12-02', gender: 2, num: 'STU-2025-034', class: 'JHS 3A',     grade: 'JHS 3',     parentFirst: 'Hanna',    parentLast: 'Bediako',    guardianName: 'Hanna Bediako',      guardianPhone: '0244500014' },
    { first: 'Uriah',     last: 'Quaye',         dob: '2011-04-29', gender: 1, num: 'STU-2025-035', class: 'JHS 3A',     grade: 'JHS 3',     parentFirst: 'Peter',    parentLast: 'Quaye',      guardianName: 'Peter Quaye',        guardianPhone: '0244500015' },
    { first: 'Vivian',    last: 'Tetteh',        dob: '2011-09-18', gender: 2, num: 'STU-2025-036', class: 'JHS 3A',     grade: 'JHS 3',     parentFirst: 'Naomi',    parentLast: 'Tetteh',     guardianName: 'Naomi Tetteh',       guardianPhone: '0244500016' },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function section(title: string) {
    console.log(`\n══════════════════════════════════════════════════`);
    console.log(`  ${title}`);
    console.log(`══════════════════════════════════════════════════\n`);
}
function tally(created: number, skipped: number, failed: number) {
    console.log(`  ──────────────────────────────────────────────`);
    console.log(`  ✓ ${created} created  ⏭  ${skipped} skipped  ✗ ${failed} failed\n`);
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    console.log('\nAcquiring token…');
    const token = await getToken();
    const h  = hdr(token);
    const ph = phdr(token);
    console.log('✓ Token acquired');

    // ── Phase 0: fetch grade level ID map ─────────────────────────────────────
    section('Phase 0 — Fetch grade levels');
    const glRes = await axios.get(`${API}/sms_gradelevels?$select=sms_gradelevelid,sms_name`, { headers: h, timeout: 20000 });
    const gradeLevelMap = new Map<string, string>();
    for (const g of glRes.data.value ?? []) {
        gradeLevelMap.set((g.sms_name as string).toLowerCase(), g.sms_gradelevelid as string);
    }
    console.log(`  ${gradeLevelMap.size} grade level(s) found:`);
    gradeLevelMap.forEach((id, name) => console.log(`    ${name} → ${String(id).slice(0, 8)}…`));
    if (gradeLevelMap.size === 0) {
        console.warn('\n  ⚠  No grade levels found. Run seed:grade-levels first for full linking.\n');
    }

    // ── Phase 1: seed teachers ─────────────────────────────────────────────────
    section('Phase 1 — Teachers (sms_teachers)');
    const existTeachersRes = await axios.get(`${API}/sms_teachers?$select=sms_teacherid,sms_email`, { headers: h, timeout: 20000 });
    const existTeacherEmails = new Set<string>((existTeachersRes.data.value ?? []).map((t: any) => (t.sms_email ?? '').toLowerCase()));
    console.log(`  ${existTeacherEmails.size} teacher(s) already in Dataverse\n`);

    const teacherIdMap = new Map<string, string>(); // "Firstname Lastname" → id
    // Pre-populate with already-existing teachers
    for (const t of existTeachersRes.data.value ?? []) {
        const existing = await axios.get(`${API}/sms_teachers?$select=sms_teacherid,sms_firstname,sms_lastname&$filter=sms_email eq '${t.sms_email}'`, { headers: h, timeout: 20000 });
        for (const r of existing.data.value ?? []) {
            teacherIdMap.set(`${r.sms_firstname} ${r.sms_lastname}`, r.sms_teacherid);
        }
    }

    let tc = 0, ts = 0, tf = 0;
    for (const t of TEACHERS) {
        const key = `${t.first} ${t.last}`;
        if (existTeacherEmails.has(t.email.toLowerCase())) {
            console.log(`  ⏭  Skip  ${key}`);
            ts++;
            continue;
        }
        try {
            const res = await axios.post(`${API}/sms_teachers`, {
                sms_firstname:      t.first,
                sms_lastname:       t.last,
                sms_dateofbirth:    t.dob,
                sms_gender:         t.gender,
                sms_email:          t.email,
                sms_phone:          t.phone,
                sms_hiredate:       t.hired,
                sms_qualification:  t.qual,
                sms_specialization: t.spec,
                sms_address:        t.addr,
            }, { headers: ph, timeout: 30000 });
            const id = res.data?.sms_teacherid ?? res.headers['odata-entityid'] ?? '';
            teacherIdMap.set(key, id);
            console.log(`  ✓ ${key} (${t.spec}) — ${String(id).slice(0, 8)}…`);
            tc++;
        } catch (err: any) {
            console.error(`  ✗ ${key}: ${err.response?.data?.error?.message?.slice(0, 120) ?? err.message}`);
            tf++;
        }
    }
    tally(tc, ts, tf);

    // ── Phase 2: seed subjects ─────────────────────────────────────────────────
    section('Phase 2 — Subjects (sms_subjects)');
    const existSubjectsRes = await axios.get(`${API}/sms_subjects?$select=sms_subjectid,sms_code`, { headers: h, timeout: 20000 });
    const existSubjectCodes = new Set<string>((existSubjectsRes.data.value ?? []).map((s: any) => (s.sms_code ?? '').toLowerCase()));
    console.log(`  ${existSubjectCodes.size} subject(s) already in Dataverse\n`);

    let sc = 0, ss = 0, sf = 0;
    for (const subj of SUBJECTS) {
        if (existSubjectCodes.has(subj.code.toLowerCase())) {
            console.log(`  ⏭  Skip  ${subj.name} (${subj.code})`);
            ss++;
            continue;
        }
        const payload: Record<string, unknown> = {
            sms_name:        subj.name,
            sms_code:        subj.code,
            sms_type:        subj.type,
            sms_credithours: subj.credits,
            sms_passscore:   subj.pass,
            sms_description: subj.desc,
        };
        const glId = gradeLevelMap.get(subj.grade.toLowerCase());
        if (glId) payload['sms_gradelevel@odata.bind'] = `/sms_gradelevels(${glId})`;

        const tid = teacherIdMap.get(subj.teacher);
        if (tid) payload['sms_teacher@odata.bind'] = `/sms_teachers(${tid})`;

        try {
            const res = await axios.post(`${API}/sms_subjects`, payload, { headers: ph, timeout: 30000 });
            const id = res.data?.sms_subjectid ?? res.headers['odata-entityid'] ?? '';
            const links = [glId ? `GL:${subj.grade}` : '—GL', tid ? `T:${subj.teacher}` : '—T'].join(' ');
            console.log(`  ✓ ${subj.name} (${subj.code}) — ${links} — ${String(id).slice(0, 8)}…`);
            sc++;
        } catch (err: any) {
            console.error(`  ✗ ${subj.name}: ${err.response?.data?.error?.message?.slice(0, 120) ?? err.message}`);
            sf++;
        }
    }
    tally(sc, ss, sf);

    // ── Phase 3: fetch / create academic year ──────────────────────────────────
    section('Phase 3 — Academic year lookup');
    const ayRes = await axios.get(`${API}/sms_academicyears?$select=sms_academicyearid,sms_name&$orderby=sms_startdate desc&$top=1`, { headers: h, timeout: 20000 });
    let academicYearId = (ayRes.data.value ?? [])[0]?.sms_academicyearid ?? null;
    if (academicYearId) {
        console.log(`  ✓ Using academic year: ${ayRes.data.value[0].sms_name} (${String(academicYearId).slice(0, 8)}…)`);
    } else {
        console.log('  No academic year found — creating 2024/2025…');
        try {
            const r = await axios.post(`${API}/sms_academicyears`, {
                sms_name:      '2024/2025',
                sms_startdate: '2024-09-02',
                sms_enddate:   '2025-07-31',
                sms_iscurrent: true,
                sms_yearname:  '2024/2025',
            }, { headers: ph, timeout: 30000 });
            academicYearId = r.data?.sms_academicyearid ?? null;
            console.log(`  ✓ Created 2024/2025 (${String(academicYearId).slice(0, 8)}…)`);
        } catch (err: any) {
            console.error(`  ✗ Could not create academic year: ${err.response?.data?.error?.message?.slice(0, 120) ?? err.message}`);
        }
    }

    // ── Phase 4: seed classes ──────────────────────────────────────────────────
    section('Phase 4 — Classes (sms_classes)');
    const existClassesRes = await axios.get(`${API}/sms_classes?$select=sms_classid,sms_name`, { headers: h, timeout: 20000 });
    const existClassNames = new Set<string>((existClassesRes.data.value ?? []).map((c: any) => (c.sms_name ?? '').toLowerCase()));
    console.log(`  ${existClassNames.size} class(es) already in Dataverse\n`);

    const classIdMap = new Map<string, string>(); // class name → id
    for (const c of existClassesRes.data.value ?? []) {
        classIdMap.set((c.sms_name as string).toLowerCase(), c.sms_classid);
    }

    let cc = 0, csk = 0, cf = 0;
    for (const cls of CLASSES) {
        if (existClassNames.has(cls.name.toLowerCase())) {
            classIdMap.set(cls.name.toLowerCase(), (existClassesRes.data.value.find((c: any) => c.sms_name?.toLowerCase() === cls.name.toLowerCase()) as any)?.sms_classid ?? '');
            console.log(`  ⏭  Skip  ${cls.name}`);
            csk++;
            continue;
        }
        const payload: Record<string, unknown> = {
            sms_name:       cls.name,
            sms_section:    cls.section,
            sms_capacity:   cls.capacity,
            sms_roomnumber: cls.room,
        };
        const glId = gradeLevelMap.get(cls.grade.toLowerCase());
        if (glId) payload['sms_gradelevel@odata.bind'] = `/sms_gradelevels(${glId})`;
        const tid = teacherIdMap.get(cls.teacher);
        if (tid) payload['sms_teacher@odata.bind'] = `/sms_teachers(${tid})`;
        if (academicYearId) payload['sms_academicyear@odata.bind'] = `/sms_academicyears(${academicYearId})`;

        try {
            const res = await axios.post(`${API}/sms_classes`, payload, { headers: ph, timeout: 30000 });
            const id = res.data?.sms_classid ?? res.headers['odata-entityid'] ?? '';
            classIdMap.set(cls.name.toLowerCase(), id);
            console.log(`  ✓ ${cls.name} (cap:${cls.capacity} ${cls.room}) — ${String(id).slice(0, 8)}…`);
            cc++;
        } catch (err: any) {
            console.error(`  ✗ ${cls.name}: ${err.response?.data?.error?.message?.slice(0, 120) ?? err.message}`);
            cf++;
        }
    }
    tally(cc, csk, cf);

    // ── Phase 5: seed parents ──────────────────────────────────────────────────
    section('Phase 5 — Parents (sms_parents)');
    const existParentsRes = await axios.get(`${API}/sms_parents?$select=sms_parentid,sms_email,sms_firstname,sms_lastname`, { headers: h, timeout: 20000 });
    const existParentEmails = new Set<string>((existParentsRes.data.value ?? []).map((p: any) => (p.sms_email ?? '').toLowerCase()));
    console.log(`  ${existParentEmails.size} parent(s) already in Dataverse\n`);

    const parentIdMap = new Map<string, string>(); // "First Last" → id
    for (const p of existParentsRes.data.value ?? []) {
        if (p.sms_firstname && p.sms_lastname) {
            parentIdMap.set(`${p.sms_firstname} ${p.sms_lastname}`, p.sms_parentid);
        }
    }

    let pc = 0, ps = 0, pf = 0;
    for (const par of PARENTS) {
        const key = `${par.first} ${par.last}`;
        if (existParentEmails.has(par.email.toLowerCase())) {
            console.log(`  ⏭  Skip  ${key}`);
            ps++;
            continue;
        }
        try {
            const res = await axios.post(`${API}/sms_parents`, {
                sms_firstname:    par.first,
                sms_lastname:     par.last,
                sms_email:        par.email,
                sms_phone:        par.phone,
                sms_relationship: par.rel,
                sms_address:      par.addr,
            }, { headers: ph, timeout: 30000 });
            const id = res.data?.sms_parentid ?? res.headers['odata-entityid'] ?? '';
            parentIdMap.set(key, id);
            const relLabel = ['Father', 'Mother', 'Guardian', 'Other'][par.rel - 1] ?? '';
            console.log(`  ✓ ${key} (${relLabel}) — ${String(id).slice(0, 8)}…`);
            pc++;
        } catch (err: any) {
            console.error(`  ✗ ${key}: ${err.response?.data?.error?.message?.slice(0, 120) ?? err.message}`);
            pf++;
        }
    }
    tally(pc, ps, pf);

    // ── Phase 6: seed students ─────────────────────────────────────────────────
    section('Phase 6 — Students (sms_students)');
    const existStudentsRes = await axios.get(`${API}/sms_students?$select=sms_studentid,sms_studentnumber`, { headers: h, timeout: 20000 });
    const existStudentNums = new Set<string>((existStudentsRes.data.value ?? []).map((s: any) => (s.sms_studentnumber ?? '').toLowerCase()));
    console.log(`  ${existStudentNums.size} student(s) already in Dataverse\n`);

    let stc = 0, sts = 0, stf = 0;
    for (const stu of STUDENTS) {
        if (existStudentNums.has(stu.num.toLowerCase())) {
            console.log(`  ⏭  Skip  ${stu.first} ${stu.last} (${stu.num})`);
            sts++;
            continue;
        }
        const payload: Record<string, unknown> = {
            sms_name:          `${stu.first} ${stu.last}`.trim(),
            sms_firstname:     stu.first,
            sms_lastname:      stu.last,
            sms_dateofbirth:   stu.dob,
            sms_gender:        stu.gender,
            sms_enrollmentdate: '2024-09-02',
            sms_studentnumber: stu.num,
            sms_studentstatus: 1,
            sms_guardianname:  stu.guardianName,
            sms_guardianphone: stu.guardianPhone,
        };
        const classId = classIdMap.get(stu.class.toLowerCase());
        if (classId) payload['sms_class@odata.bind'] = `/sms_classes(${classId})`;
        const glId = gradeLevelMap.get(stu.grade.toLowerCase());
        if (glId) payload['sms_gradelevel@odata.bind'] = `/sms_gradelevels(${glId})`;
        const parentId = parentIdMap.get(`${stu.parentFirst} ${stu.parentLast}`);
        if (parentId) payload['sms_parent@odata.bind'] = `/sms_parents(${parentId})`;

        try {
            const res = await axios.post(`${API}/sms_students`, payload, { headers: ph, timeout: 30000 });
            const id = res.data?.sms_studentid ?? res.headers['odata-entityid'] ?? '';
            const links = [classId ? stu.class : '—class', parentId ? `P:${stu.parentFirst}` : '—parent'].join(' ');
            console.log(`  ✓ ${stu.first} ${stu.last} (${stu.num}) — ${links} — ${String(id).slice(0, 8)}…`);
            stc++;
        } catch (err: any) {
            console.error(`  ✗ ${stu.first} ${stu.last}: ${err.response?.data?.error?.message?.slice(0, 120) ?? err.message}`);
            stf++;
        }
    }
    tally(stc, sts, stf);

    // ── Summary ────────────────────────────────────────────────────────────────
    section('Done');
    console.log(`  Teachers : ${tc} created, ${ts} skipped, ${tf} failed`);
    console.log(`  Subjects : ${sc} created, ${ss} skipped, ${sf} failed`);
    console.log(`  Classes  : ${cc} created, ${csk} skipped, ${cf} failed`);
    console.log(`  Parents  : ${pc} created, ${ps} skipped, ${pf} failed`);
    console.log(`  Students : ${stc} created, ${sts} skipped, ${stf} failed`);
    console.log(`\n  Total created: ${tc + sc + cc + pc + stc}`);
    console.log('══════════════════════════════════════════════════\n');
}

main().catch((err: any) => {
    console.error('\nFatal:', err.response?.data?.error?.message ?? err.message);
    process.exit(1);
});
