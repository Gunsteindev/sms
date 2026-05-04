# Ghana School Management System — Overview

## What It Is

A full-stack web application for managing day-to-day operations of Ghanaian schools from nursery through secondary level. Built around the requirements of the Ghana Education Service (GES), it handles student records, academic assessments using the GES grading scale, term-end report cards, fee collection, library operations, and staff management.

## Who It Is For

School administrators and academic staff who need a single system to:
- Enrol and manage students across grade levels
- Record continuous assessment and exam scores
- Generate GES-compliant termly report cards
- Track attendance, fees, and library activity
- Promote or retain students at end of academic year

## Feature Summary

| Module | What It Does |
|--------|-------------|
| **Dashboard** | Live statistics: total students, teachers, employees, classes, today's attendance, monthly revenue |
| **Students** | Full student profiles, parent links, medical records, disciplinary history, enrolment status |
| **Teachers** | Staff records with qualifications, subject assignments, hire date |
| **Employees** | Non-teaching staff by department |
| **Classes & Subjects** | Class setup with grade level, room, capacity, timetable |
| **Attendance** | Daily mark-attendance per class with trend charts |
| **Gradebook** | Enter class scores (Classwork, Homework, Quiz, MidTerm) and compute GES grades |
| **Exams** | Schedule exams, enter results, auto-calculate pass/fail and grade letters |
| **Report Cards** | Per-student per-term report with GES formula, remarks, and print-to-PDF |
| **Fees & Finance** | Fee structures, invoicing, payment tracking, monthly revenue |
| **Scholarships** | Full, partial, and bursary scholarships linked to students |
| **Library** | Book catalogue with loan tracking (issue, due date, return) |
| **Promotions** | End-of-year bulk promote, retain, transfer, or graduate students |
| **Academic Setup** | Academic years, terms, grade levels |
| **Departments** | Department management with head-of-department |
| **Enrollments** | Link students to classes with roll number and status |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Database | Microsoft Dataverse (OData REST API) |
| Identity | Azure AD client credentials (server-side Dataverse access) |
| Session Auth | Custom JWT via `jose` library |
| UI | Tailwind CSS, shadcn/ui, Lucide icons |
| Forms | react-hook-form + Zod (frontend and server-side) |
| AI | Anthropic Claude API (AI-generated summaries) |
| Language | TypeScript throughout |

## GES Grading Scale

The system implements the official Ghana Education Service grade scale:

| Score Range | Grade | Description |
|-------------|-------|-------------|
| 80 – 100 | A1 | Excellent |
| 70 – 79 | B2 | Very Good |
| 60 – 69 | B3 | Good |
| 55 – 59 | C4 | Credit |
| 50 – 54 | C5 | Credit |
| 45 – 49 | C6 | Credit |
| 40 – 44 | D7 | Pass |
| 35 – 39 | E8 | Pass |
| 0 – 34 | F9 | Fail |

**Final score formula:**
```
Class Score  = average of (Classwork + Homework + MidTerm scores) × 30%
Exam Score   = End-of-Term exam result × 70%
Final Score  = Class Score + Exam Score
```
