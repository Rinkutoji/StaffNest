# StaffNest — Employee Management System

A full-stack Employee Management System built for a portfolio / university
final-project demo.

- **Frontend:** React 19 + Vite + Tailwind CSS v4 + React Router + Axios + Recharts
- **Backend:** Native PHP (no framework) REST API + PDO
- **Database:** MySQL / MariaDB

Every endpoint in this project — across all 8 modules — was written **and
tested end-to-end** against a real Apache + MySQL-compatible database before
delivery (not just written and assumed to work). The React app was also
built with `npm run build` and linted with zero errors after every round of
changes.

---

## 1. Modules

| Module | What it does |
|---|---|
| **Dashboard** | Admin/HR: 6 stat cards, 4 charts, quick actions, notifications, recent employees, upcoming birthdays/leave, activity timeline. Employee: a different page with clock in/out, own attendance/leave/payslip summary. Dark/light mode, search, and profile menu live in the header on every page. |
| **Employees** | Full CRUD, photo upload, search/filter/sort/pagination. |
| **Departments** | Full CRUD with live employee counts. |
| **Attendance** | Admin/HR mark present/absent/late/half-day in bulk. Employees clock in/clock out and see only their own history. |
| **Leave Management** | Employees submit requests and see their own status; Admin/HR review, approve or reject. |
| **Payroll** | Admin/HR generate monthly payroll, adjust bonus/deductions, mark as paid, export CSV. Employees see a read-only "My Payslips" view of their own salary history. |
| **Recruitment** | Job postings + a candidate pipeline (Applied → Interview → Offered → Hired/Rejected). |
| **Reports** | Cross-module analytics: headcount trend, department mix, payroll paid by month, 30-day attendance rate, leave usage by type, recruitment funnel. CSV export. |
| **Profile / Settings** | Update name, email, phone, password and profile photo (upload/remove, shown in the header, sidebar and profile page). Dark/light mode and a notifications on/off toggle; role/permission reference table. |

All 5 of Attendance, Leave, Payroll, Recruitment and Reports are **real
features** with their own database tables and REST endpoints — not
placeholder pages or mocked-up dummy screens.

---

## 2. Project structure

```
ems/
├── backend/                    # Native PHP REST API
│   ├── api/
│   │   ├── auth/                login, register, logout, me, update_profile
│   │   ├── employees/           get, get_one, create, update, delete
│   │   ├── departments/         get, create, update, delete
│   │   ├── attendance/          get, mark, delete, summary
│   │   ├── leaves/              get, create, review, delete
│   │   ├── payroll/             get, generate, update, mark_paid, delete
│   │   ├── recruitment/         jobs_get/create/update/delete,
│   │   │                        candidates_get/create/update_stage/delete
│   │   ├── reports/             summary
│   │   └── dashboard/           stats
│   ├── config/                  database.php, cors.php
│   ├── helpers/                  response.php, auth_helper.php, employee_helper.php
│   └── uploads/profiles/        employee profile photos are stored here
├── database/
│   └── employee_management.sql     # schema + seed data — import this first
└── frontend/                    # React + Vite + Tailwind app
    └── src/
        ├── api/axios.js         axios instance + auth token interceptor
        ├── context/              AuthContext, ThemeContext (dark mode)
        ├── components/           layout (Sidebar/Header), common UI,
        │                         employees, departments, attendance,
        │                         leaves, payroll, recruitment
        ├── pages/                 Login (Staff), EmployeeLogin, Register,
        │                          Dashboard, Employees, Departments,
        │                          Attendance, LeaveManagement, Payroll,
        │                          Recruitment, Reports, Profile, Settings
        └── utils/                 formatters, department color mapping
```

---

## 3. Backend setup (XAMPP / MySQL)

1. Copy the **`backend`** folder into your XAMPP `htdocs` directory. You can
   rename it, e.g. `htdocs/ems-backend`.
2. Open **phpMyAdmin** → Import → choose `database/employee_management.sql`.
   This creates the `employee_management` database with 9 tables and
   realistic seed data (50 employees, 5 departments, ~460 attendance rows,
   18 leave requests, ~90 payroll rows, 4 job postings, 11 candidates).

   **Already imported this before and don't want to lose your data?** Run
   these two migration files in phpMyAdmin's SQL tab instead — they add the
   `phone`/`profile_image` columns and the `employee_id` link column:
   `database/migration_user_profile.sql` then `database/migration_employee_link.sql`.
3. Check `backend/config/database.php` — the defaults (`localhost`, `root`,
   empty password) match a stock XAMPP install. Adjust if yours differs.
4. Make sure `backend/uploads/profiles/` is writable (on macOS, if uploads
   fail, run `chmod -R 777` on that folder — see troubleshooting note below).
5. Your API should now be reachable at, e.g.
   `http://localhost/ems-backend/api/departments/get.php`.

**Demo accounts (seeded):**
| Email | Password | Role | Login page |
|---|---|---|---|
| admin@ems.com | admin123 | Admin | Staff Login (`/login`) |
| hr@ems.com | admin123 | HR | Staff Login (`/login`) |
| employee@ems.com | admin123 | Employee | Employee Login (`/employee-login`) |

---

## 4. Frontend setup (React + Vite)

```bash
cd frontend
npm install
```

Open `frontend/.env` and set the API URL to match wherever you placed the
backend folder in step 2 (**restart `npm run dev` after editing `.env`** —
Vite only reads it at startup):

```
VITE_API_BASE_URL=http://localhost/ems-backend
```

Then run:

```bash
npm run dev
```

Visit the printed local URL (usually `http://localhost:5173`) and log in with
one of the demo accounts above.

To build a production bundle: `npm run build` (outputs to `frontend/dist`).

---

## 5. Two separate login portals (not one mixed form)

There are **two distinct login pages** instead of a single form for every role:

- **`/login` — Staff Login**, for Admin & HR accounts only.
- **`/employee-login` — Employee Login**, for Employee accounts only.

Both call the same `login.php` endpoint under the hood (one `users` table,
no duplicated backend logic), but the frontend checks the returned role and
rejects a sign-in that doesn't match the portal it was submitted on, and the
token that was just issued is immediately invalidated via `logout.php`
rather than left active.

**Public self-registration (`/register`) only ever creates Employee
accounts.** There is no role picker on that form, and this is enforced on
the **backend** too — `register.php` always forces `role = 'employee'`
server-side and ignores any `role` value a client sends, even via a direct
API call. Admin and HR accounts are provisioned separately (seeded in the
database, as with the demo accounts above).

## 6. Employee role permissions (real data scoping, not just hidden buttons)

Every Employee-role login is linked to one HR record via `users.employee_id`
(a real foreign key, seeded for the demo account). This lets Attendance,
Leave and Payroll show **that person's own data only** — enforced on the
**backend**, not just hidden in the UI:

| Area | Employee can | Employee cannot |
|---|---|---|
| Dashboard | See their own attendance/leave/payslip summary (a different page, `EmployeeDashboard.jsx`) | See company-wide stats — `dashboard/stats.php` returns 403 for this role |
| Attendance | Clock in / clock out, view own history | Mark/edit/delete anyone's attendance; `attendance/get.php` silently ignores any `employee_id` filter and forces it to their own |
| Leave | Submit a request, view own requests/status | Approve, reject, edit or delete any request (own or others') — `leaves/create.php` forces `employee_id` to their own regardless of what's submitted |
| Payroll | View & export their own payslips/salary history | Generate, edit or mark payroll as paid |
| Recruitment / Reports / Settings | — | No access — hidden from the sidebar **and** blocked by both a frontend route guard (`RoleRoute`) and `requireRole()` on the backend |
| Employees / Departments | View | Create, edit or delete |

**Workflow:** Employee submits a leave request → it shows as `pending` →
Admin/HR reviews it on the Leave Management page → Approve/Reject → the
employee sees the updated status next time they check (tested end-to-end:
an employee cannot approve/reject/delete their own request, only Admin/HR
can, and the status change is immediately visible to the employee).

## 7. How authentication works

There's no external JWT library. On login, the backend generates a random
64-character token, stores it in the `auth_tokens` table with a 7-day
expiry, and returns it. The React app saves it in `localStorage` and sends
it back as `Authorization: Bearer <token>` on every request. Roles
(`admin`, `hr`, `employee`) are enforced **server-side** with
`requireRole()` in every write endpoint — hiding a button client-side is
just UX polish, not the real security boundary.

Payroll, Recruitment and Reports are restricted to Admin/HR in the sidebar;
Attendance and Leave Management are visible to all roles (an Employee
account can view attendance and submit/track their own leave requests).

---

## 8. Timezone: everything runs on Cambodia time (Asia/Phnom_Penh, UTC+7)

Clock in/out times, attendance dates, the "late after 08:30" cutoff, and
"today"/"this month" defaults everywhere in the app are meant to reflect
Cambodia time — regardless of what timezone the underlying server (or a
developer's laptop) happens to be set to. Two easy-to-miss traps this
project deliberately avoids:

- **Backend**: PHP's `date()` and MySQL's `NOW()`/`CURDATE()` each use
  their *own* timezone setting (PHP's `date.timezone`, MySQL's server
  `time_zone`) — fixing one does not fix the other, and a server left on
  its default (often UTC) will silently record the wrong day/time. This
  project sets both explicitly, once, in `config/database.php` (which
  every single endpoint already requires): `date_default_timezone_set('Asia/Phnom_Penh')`
  for PHP, and `SET time_zone = '+07:00'` on every new PDO connection for
  MySQL. Because Cambodia has no daylight saving time, a fixed `+07:00`
  offset is always correct and needs no MySQL timezone-table setup.
- **Frontend**: `new Date().toISOString()` always converts to **UTC**
  before formatting — so `.slice(0, 10)` for "today" is wrong for roughly
  7 hours every day (Cambodia midnight–6:59am), even on a correctly-set
  local clock, since UTC is still on the previous calendar day during that
  window. `src/utils/formatters.js` provides `todayLocalISO()` /
  `currentMonthLocalISO()`, which build the date string from
  `getFullYear()`/`getMonth()`/`getDate()` instead — the actual local
  calendar date, not a UTC-shifted one. Every page that needs "today" or
  "this month" (Attendance, Payroll, Reports, the dashboard's payroll
  export) uses these instead of `toISOString()`.

Once-per-day clock in/out is enforced by the combination of a `UNIQUE
(employee_id, date)` constraint on the `attendance` table plus an explicit
check in `api/attendance/clock.php` — a second "in" or "out" call for the
same (already-Cambodia-correct) date returns a `409` with a clear message
rather than silently overwriting the first entry.

---

## 9. Notable design decisions (so you can explain them confidently)

- **`employees/update.php` uses POST, not PUT.** Native PHP does not
  populate `$_FILES` for multipart form-data sent with PUT — a real PHP
  limitation, not a framework gap. Departments/leaves/payroll (no file
  upload) correctly use PUT/DELETE where appropriate.
- **Payroll is intentionally simple**: net = base salary + bonus −
  deductions. No tax brackets or statutory deductions — this mirrors what
  the original spec asked for ("do not over-engineer") while still being a
  fully working generate → adjust → mark-paid → export workflow.
- **Recruitment stage changes are manual** (a dropdown per candidate), not
  drag-and-drop — same data model, simpler and more reliable UI for a demo.
- **Dashboard's "Attendance Overview" chart shows the most recently marked
  day**, not strictly "today" — so it always has real data to display even
  if today hasn't been marked yet.
- **"On Leave Today" / "Upcoming Leave" are computed live** from the
  `leave_requests` table (`status = 'approved'` and today's date falls in
  the range) — not a stored flag that could go stale.

---

## 10. Troubleshooting quick reference

- **CORS error in the browser console**: almost always means the PHP file
  wasn't actually found (404) at the path in `.env`, so Apache never ran
  PHP / never sent the CORS headers. Visit the API URL directly in your
  browser first — a JSON response (even an error one) means the path is
  right; an "Object not found!" page means `.env`'s path doesn't match
  where you placed the `backend` folder in `htdocs`.
- **"Could not save the uploaded image"**: `backend/uploads/profiles`
  isn't writable by Apache. Run `chmod -R 777` on that folder (fine for
  local dev, not for production).
- **Login says invalid password**: demo accounts use `admin123`, not `admin`.

---

## 11. Design notes

The UI uses a small "ID badge" motif (the logo mark, colored avatar badges,
and department color-coding across charts, tables, and filters) to keep the
HR/organizational theme consistent, paired with Sora (headings) + Inter
(body) + IBM Plex Mono (salary/data figures). Dark mode is a genuine toggle
(not cosmetic) — every color in the app is a CSS variable that swaps
cleanly between themes.
