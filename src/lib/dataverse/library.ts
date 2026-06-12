import { dataverseClient, type DvList } from "./client";

const TABLE = 'sms_librarybooks';
// Verified Dataverse fields (sms_librarybooks) — discovered 2026-04-23
// sms_librarybookid, sms_name, sms_author, sms_isbn,
// sms_genre (String — free text, e.g. "Textbook", "Fiction"),
// sms_publisher, sms_publishyear (Integer),
// sms_shelfnumber, sms_subject,
// sms_totalcopies (Integer — rollup, patchable),
// sms_availablecopies (Integer — rollup, patchable),
// createdon, modifiedon
//
// NOTE: sms_libraries is a SEPARATE table that loans do NOT link to. Do not use it.

export interface LibraryBook {
    bookid:          string;
    name:            string;
    author:          string;
    isbn:            string;
    genre:           string;
    publisher:       string;
    publishyear:     number | null;
    shelfnumber:     string;
    subject:         string;
    totalcopies:     number | null;
    availablecopies: number | null;
    createdon:       string;
    modifiedon:      string;
}

export interface CreateLibraryBookRequest {
    name:            string;
    author?:         string;
    isbn?:           string;
    genre?:          string;
    publisher?:      string;
    publishyear?:    number;
    shelfnumber?:    string;
    subject?:        string;
    totalcopies?:    number;
    availablecopies?: number;
}

const SELECT = 'sms_librarybookid,sms_name,sms_author,sms_isbn,sms_genre,sms_publisher,sms_publishyear,sms_shelfnumber,sms_subject,sms_totalcopies,sms_availablecopies,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBook(item: any): LibraryBook {
    return {
        bookid:          item.sms_librarybookid,
        name:            item.sms_name            ?? '',
        author:          item.sms_author          ?? '',
        isbn:            item.sms_isbn            ?? '',
        genre:           item.sms_genre           ?? '',
        publisher:       item.sms_publisher       ?? '',
        publishyear:     item.sms_publishyear      ?? null,
        shelfnumber:     item.sms_shelfnumber     ?? '',
        subject:         item.sms_subject         ?? '',
        totalcopies:     item.sms_totalcopies      ?? null,
        availablecopies: item.sms_availablecopies  ?? null,
        createdon:       item.createdon            ?? '',
        modifiedon:      item.modifiedon           ?? '',
    };
}

export const getBooks = async (search?: string, genre?: string) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_name asc`];
    const conditions: string[] = [];
    if (search) conditions.push(`(contains(sms_name,'${search}') or contains(sms_author,'${search}') or contains(sms_isbn,'${search}'))`);
    if (genre)  conditions.push(`sms_genre eq '${genre}'`);
    if (conditions.length) parts.push(`$filter=${encodeURIComponent(conditions.join(' and '))}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapBook(item));
};

export const getBookById = async (id: string): Promise<LibraryBook> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapBook(r);
};

export const createBook = async (data: CreateLibraryBookRequest) => {
    const payload: Record<string, unknown> = { sms_name: data.name };
    if (data.author       !== undefined) payload.sms_author          = data.author;
    if (data.isbn         !== undefined) payload.sms_isbn            = data.isbn;
    if (data.genre        !== undefined) payload.sms_genre           = data.genre;
    if (data.publisher    !== undefined) payload.sms_publisher       = data.publisher;
    if (data.publishyear  !== undefined) payload.sms_publishyear     = data.publishyear;
    if (data.shelfnumber  !== undefined) payload.sms_shelfnumber     = data.shelfnumber;
    if (data.subject      !== undefined) payload.sms_subject         = data.subject;
    if (data.totalcopies  !== undefined) payload.sms_totalcopies     = data.totalcopies;
    if (data.availablecopies !== undefined) payload.sms_availablecopies = data.availablecopies;
    return dataverseClient.post(TABLE, payload);
};

export const updateBook = async (id: string, data: Partial<CreateLibraryBookRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.name            !== undefined) payload.sms_name             = data.name;
    if (data.author          !== undefined) payload.sms_author           = data.author;
    if (data.isbn            !== undefined) payload.sms_isbn             = data.isbn;
    if (data.genre           !== undefined) payload.sms_genre            = data.genre;
    if (data.publisher       !== undefined) payload.sms_publisher        = data.publisher;
    if (data.publishyear     !== undefined) payload.sms_publishyear      = data.publishyear;
    if (data.shelfnumber     !== undefined) payload.sms_shelfnumber      = data.shelfnumber;
    if (data.subject         !== undefined) payload.sms_subject          = data.subject;
    if (data.totalcopies     !== undefined) payload.sms_totalcopies      = data.totalcopies;
    if (data.availablecopies !== undefined) payload.sms_availablecopies  = data.availablecopies;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getBookById(id);
};

export const deleteBook = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
