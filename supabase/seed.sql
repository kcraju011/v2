-- Seed data aligned with the current Apps Script/Nerve setup

insert into public.tenants (
  id,
  slug,
  guid,
  alias,
  name,
  org_type,
  city,
  logo_url,
  website,
  address,
  spreadsheet_url,
  api_url,
  application_id,
  application_name,
  application_description,
  geofence_center,
  geofence_radius_m,
  status
)
values
(
  '22222222-2222-2222-2222-222222222222',
  'sit',
  '2',
  'SIT',
  'SIT',
  'college',
  'Tumakuru',
  'https://web.sit.ac.in/wp-content/uploads/2025/03/SIT-Logo-1.png',
  'https://web.sit.ac.in/',
  'Siddaganga Institute of Technology',
  'https://docs.google.com/spreadsheets/d/1c5ZGKxr-ZNxbao6L6D87N8JNSvPNf2Il9Xnl8ha04f8/edit?gid=0#gid=0',
  'https://script.google.com/macros/s/AKfycby7Sz7KutpgfdbqCY9AvYfUmBs9QKOWiydT0eKj4TDFhVSC6cOKzk5YU3yHcrGYzdcbNg/exec',
  102,
  'Attendance monitoring',
  'Biometric attendance for students, teachers and employees',
  st_setsrid(st_makepoint(77.12623, 13.32609), 4326)::geography,
  2000,
  'active'
),
(
  '33333333-3333-3333-3333-333333333333',
  'ssit',
  '3',
  'SSIT',
  'SSIT',
  'college',
  'Tumakuru',
  'https://ssit.edu.in/img/ssit-logo.png',
  'https://ssit.edu.in/',
  'Sri Siddhartha Institute of Technology',
  'https://docs.google.com/spreadsheets/d/1yGS6eyC6NTqwu6dllTYALe_Sc_0hn4_furgU-Wq6bH4/edit?gid=0#gid=0',
  'https://script.google.com/macros/s/AKfycbxVNcVsed50bZixWuAaC_CFRusRzbIvG5DyPa3ZEf2O0X4IFQoNRDYf-BWutrKYYTa7/exec',
  103,
  'Attendance monitoring',
  'Biometric attendance for students, teachers and employees',
  st_setsrid(st_makepoint(77.09173, 13.32048), 4326)::geography,
  2000,
  'active'
)
on conflict (id) do nothing;

insert into public.roles (tenant_id, key, name, description)
values
('22222222-2222-2222-2222-222222222222', 'admin', 'Admin', 'Tenant administrator'),
('22222222-2222-2222-2222-222222222222', 'teacher', 'Teacher', 'Faculty and teachers'),
('22222222-2222-2222-2222-222222222222', 'student', 'Student', 'Students'),
('22222222-2222-2222-2222-222222222222', 'employee', 'Employee', 'Staff and employees'),
('33333333-3333-3333-3333-333333333333', 'admin', 'Admin', 'Tenant administrator'),
('33333333-3333-3333-3333-333333333333', 'teacher', 'Teacher', 'Faculty and teachers'),
('33333333-3333-3333-3333-333333333333', 'student', 'Student', 'Students'),
('33333333-3333-3333-3333-333333333333', 'employee', 'Employee', 'Staff and employees')
on conflict (tenant_id, key) do nothing;

insert into public.attendance_types (tenant_id, key, label)
values
('22222222-2222-2222-2222-222222222222', 'entry', 'Entry'),
('22222222-2222-2222-2222-222222222222', 'exit', 'Exit'),
('33333333-3333-3333-3333-333333333333', 'entry', 'Entry'),
('33333333-3333-3333-3333-333333333333', 'exit', 'Exit')
on conflict (tenant_id, key) do nothing;
