-- =========================================================
-- Migration: links login accounts (users) to their HR record
-- (employees) so Employee-role self-service pages (Attendance,
-- Leave, Payroll) can show "my own data" instead of everyone's.
--
-- Run this in phpMyAdmin's SQL tab on your EXISTING database.
-- =========================================================

ALTER TABLE users
  ADD COLUMN employee_id INT DEFAULT NULL AFTER role,
  ADD CONSTRAINT fk_users_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Create (or reuse) an HR record for the demo employee@ems.com login and link it.
-- If you already have your own employee record you'd rather link instead,
-- skip this INSERT and just run:
--   UPDATE users SET employee_id = <your employee id> WHERE email = 'employee@ems.com';
INSERT INTO employees (full_name, email, phone, gender, date_of_birth, position, salary, department_id, address, status)
SELECT 'Employee Demo', 'employee.demo@ems.com', '012000000', 'other', '1996-02-14', 'Support Specialist', 520.00, 1, 'Phnom Penh', 'active'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'employee.demo@ems.com');

UPDATE users SET employee_id = (SELECT id FROM employees WHERE email = 'employee.demo@ems.com')
WHERE email = 'employee@ems.com';
