# Institution configuration

The first installation uses one institution, but all academic, attendance, membership, and audit rows carry `institution_id`. Keep institution-specific names and academic terms in data/configuration rather than route names or components.

The database stores a timezone and constrained attendance policy values per institution. The initial QR defaults are a 10-second rotation and 10-second token lifetime, with a two-second verification tolerance; the maximum session duration defaults to two hours. These values can be changed within database-validated bounds. Labels, dates, and time display should use the institution timezone. The MVP models departments, terms, courses, sections, faculty assignments, and enrollments as the supported baseline. It deliberately does not ship a generic organization builder, gradebook, or plugin framework.

To adapt an institution, configure its name, slug, timezone, term records, department/course catalog, enrollment policy, and attendance policy. Prefer migrations and settings for behavior over editing shared source code. Attendance timestamps use the institution time zone; user-facing strings should remain centralized as translation work is introduced. The initial UI is English.
