import { dataverseClient } from "./client";

const TABLE = 'sms_libraryloans';
// Verified Dataverse fields (sms_libraryloans) — discovered 2026-04-23
// sms_libraryloanid, sms_name, sms_issuedate, sms_duedate, sms_returndate,
// sms_loanstatus (Picklist: 1=Issued 2=Returned 3=Overdue),
// sms_borrowertypecode (Picklist: 1=Student 2=Teacher),
// sms_fineamount (Money), sms_note (Memo),
// _sms_librarybook_value (Lookup → sms_libraries),
// _sms_student_value (Lookup → sms_students),
// _sms_teacher_value (Lookup → sms_teachers)

export interface LibraryLoan {
    loanid:          string;
    name:            string;
    bookid:          string;
    bookname:        string;
    studentid:       string;
    studentname:     string;
    teacherid:       string;
    teachername:     string;
    issuedate:       string;
    duedate:         string;
    returndate:      string;
    loanstatus:      number;
    loanstatusname:  string;
    borrowertype:    number;
    borrowertypename: string;
    fineamount:      number | null;
    note:            string;
    createdon:       string;
    modifiedon:      string;
}

export interface CreateLoanRequest {
    name:         string;
    bookid:       string;
    studentid?:   string;
    teacherid?:   string;
    issuedate:    string;
    duedate:      string;
    returndate?:  string;
    loanstatus?:  number;
    borrowertype?: number;
    fineamount?:  number;
    note?:        string;
}

export const LOAN_STATUS: Record<number, string> = { 1: 'Issued', 2: 'Returned', 3: 'Overdue' };
export const BORROWER_TYPE: Record<number, string> = { 1: 'Student', 2: 'Teacher' };

const SELECT = 'sms_libraryloanid,sms_name,_sms_librarybook_value,_sms_student_value,_sms_teacher_value,sms_issuedate,sms_duedate,sms_returndate,sms_loanstatus,sms_borrowertypecode,sms_fineamount,sms_note,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLoan(item: any): LibraryLoan {
    return {
        loanid:          item.sms_libraryloanid,
        name:            item.sms_name             ?? '',
        bookid:          item._sms_librarybook_value ?? '',
        bookname:        item['_sms_librarybook_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        studentid:       item._sms_student_value    ?? '',
        studentname:     item['_sms_student_value@OData.Community.Display.V1.FormattedValue']    ?? '',
        teacherid:       item._sms_teacher_value    ?? '',
        teachername:     item['_sms_teacher_value@OData.Community.Display.V1.FormattedValue']    ?? '',
        issuedate:       item.sms_issuedate         ? item.sms_issuedate.slice(0, 10)   : '',
        duedate:         item.sms_duedate           ? item.sms_duedate.slice(0, 10)     : '',
        returndate:      item.sms_returndate        ? item.sms_returndate.slice(0, 10)  : '',
        loanstatus:      item.sms_loanstatus        ?? 1,
        loanstatusname:  item['sms_loanstatus@OData.Community.Display.V1.FormattedValue']       ?? LOAN_STATUS[item.sms_loanstatus ?? 1] ?? '',
        borrowertype:    item.sms_borrowertypecode  ?? 1,
        borrowertypename: item['sms_borrowertypecode@OData.Community.Display.V1.FormattedValue'] ?? BORROWER_TYPE[item.sms_borrowertypecode ?? 1] ?? '',
        fineamount:      item.sms_fineamount        ?? null,
        note:            item.sms_note              ?? '',
        createdon:       item.createdon             ?? '',
        modifiedon:      item.modifiedon            ?? '',
    };
}

export const getLoans = async (search?: string, loanstatus?: number, bookid?: string) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_issuedate desc`];
    const conditions: string[] = [];
    if (search)     conditions.push(`contains(sms_name,'${search}')`);
    if (loanstatus) conditions.push(`sms_loanstatus eq ${loanstatus}`);
    if (bookid)     conditions.push(`_sms_librarybook_value eq ${bookid}`);
    if (conditions.length) parts.push(`$filter=${encodeURIComponent(conditions.join(' and '))}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapLoan(item));
};

export const getLoanById = async (id: string): Promise<LibraryLoan> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapLoan(r);
};

export const createLoan = async (data: CreateLoanRequest) => {
    const payload: Record<string, unknown> = {
        sms_name:      data.name,
        sms_issuedate: data.issuedate,
        sms_duedate:   data.duedate,
    };
    if (data.returndate  !== undefined) payload.sms_returndate      = data.returndate;
    if (data.loanstatus  !== undefined) payload.sms_loanstatus      = data.loanstatus;
    if (data.borrowertype !== undefined) payload.sms_borrowertypecode = data.borrowertype;
    if (data.fineamount  !== undefined) payload.sms_fineamount      = data.fineamount;
    if (data.note        !== undefined) payload.sms_note            = data.note;
    if (data.bookid)    payload['sms_librarybook@odata.bind']       = `/sms_librarybooks(${data.bookid})`;
    if (data.studentid) payload['sms_student@odata.bind']           = `/sms_students(${data.studentid})`;
    if (data.teacherid) payload['sms_teacher@odata.bind']           = `/sms_teachers(${data.teacherid})`;
    return dataverseClient.post(TABLE, payload);
};

export const updateLoan = async (id: string, data: Partial<CreateLoanRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.name        !== undefined) payload.sms_name            = data.name;
    if (data.issuedate   !== undefined) payload.sms_issuedate       = data.issuedate;
    if (data.duedate     !== undefined) payload.sms_duedate         = data.duedate;
    if (data.returndate  !== undefined) payload.sms_returndate      = data.returndate;
    if (data.loanstatus  !== undefined) payload.sms_loanstatus      = data.loanstatus;
    if (data.borrowertype !== undefined) payload.sms_borrowertypecode = data.borrowertype;
    if (data.fineamount  !== undefined) payload.sms_fineamount      = data.fineamount;
    if (data.note        !== undefined) payload.sms_note            = data.note;
    if (data.bookid)    payload['sms_librarybook@odata.bind']       = `/sms_librarybooks(${data.bookid})`;
    if (data.studentid) payload['sms_student@odata.bind']           = `/sms_students(${data.studentid})`;
    if (data.teacherid) payload['sms_teacher@odata.bind']           = `/sms_teachers(${data.teacherid})`;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getLoanById(id);
};

export const deleteLoan = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
