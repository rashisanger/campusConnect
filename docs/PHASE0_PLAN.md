# CampusConnect — Phase 0 Plan

## 1. Final feature list

CampusConnect lets students discover campus events, register, and check in with a QR code or manually entered token. Organizers manage their own events and attendance; administrators oversee users and shared event data. The app uses React/Vite/Tailwind, Express, MongoDB Atlas/Mongoose, JWT/bcrypt, Axios, and Cloudinary. All displayed application data comes from the API—never fabricated frontend data.

## 2. Feature priorities

### MUST HAVE
- Student registration/login, JWT authentication, and role-based access.
- Browse, search, filter, paginate, and view event details.
- Organizer event create/edit/cancel and attendee/attendance views.
- Student event registration, cancellation, registration history, and dashboard.
- Atomic capacity enforcement, duplicate-registration prevention, and registration QR token.
- Organizer check-in by scanning a QR code or entering its token manually; prevent duplicate check-ins.
- Basic admin user/event/category/venue management.
- MongoDB Atlas persistence, useful indexes, and basic aggregation-based dashboards.
- Responsive UI with real API loading, empty, and error states.

### SHOULD HAVE
- Cloudinary event poster and profile image uploads.
- Feedback after attendance and average event ratings.
- In-app registration/cancellation/event-change notifications.
- Organizer and admin dashboard summaries beyond the basic counts.

### OPTIONAL
- Interest-based event recommendations.
- Event-specific discussions.
- Geospatial nearby-event search.
- Reminders and advanced analytics (department/year/month trends).

## 3. Frontend page structure

Use React Router with a shared public layout and role-guarded student, organizer, and admin layouts. Authentication state lives in React Context.

| Route | Access |
|---|---|
| `/` | Public landing page; upcoming events from API |
| `/login`, `/register` | Public |
| `/events`, `/events/:eventId` | Public browse/details; registration requires student login |
| `/student` | Student dashboard |
| `/student/events` | Student's upcoming, attended, and cancelled registrations |
| `/student/registrations/:registrationId` | Owner student; registration details and QR/manual token |
| `/profile` | Any logged-in user; profile edit |
| `/organizer` | Organizer dashboard |
| `/organizer/events` | Organizer's events |
| `/organizer/events/new` | Organizer |
| `/organizer/events/:eventId/edit` | Owning organizer (admin may also manage) |
| `/organizer/events/:eventId/attendees` | Owning organizer; registrations and attendance |
| `/organizer/events/:eventId/check-in` | Owning organizer; QR scanner and manual token entry |
| `/admin` | Admin dashboard |
| `/admin/users`, `/admin/events` | Admin |
| `/admin/categories`, `/admin/venues` | Admin |

Unauthenticated users can browse events. Only student accounts can register; a registration's owner can view or cancel it. Organizers can manage only events they own. Admin can manage all users and event catalog data.

## 4. Backend architecture

JSON REST API under `/api`; controllers handle HTTP input/output, validators enforce request shapes, services hold business rules and MongoDB transactions, and Mongoose models define schemas/indexes.

```text
server/
  config/       database and environment setup
  controllers/  auth, users, events, registrations, attendance, admin, analytics
  middleware/   JWT authentication, role/ownership checks, validation, errors
  models/       User, Event, Registration, Attendance, Venue, Category,
                Notification, Feedback
  routes/       versioned-by-prefix Express route modules
  services/     auth, event, registration/capacity, check-in, analytics, uploads
  validators/   request schemas
  utils/        token, pagination, API/error helpers
  app.js        middleware and route composition
  server.js     startup and database connection
```

Keep MVP logic in these modules; do not add queues, microservices, or a separate analytics database.

## 5. MongoDB collections and relationships

| Collection | Main fields | Indexes | Relationships and storage choice |
|---|---|---|---|
| `users` | `name`, normalized `email`, `passwordHash`, `role`, `isActive` (boolean, default `true`), `department`, `year`, `profileImage`, `interests[]`, `bio`, timestamps | Unique `email`; optional `role` index for admin queries | Interests are embedded strings because they are a small per-user list; no password is ever stored in plain text. |
| `events` | `title`, `description`, `poster`, `category` (category ID), `tags[]`, `organizer` (user ID), `venue` (venue ID), embedded `schedule {startAt,endAt}`, `capacity`, `registeredCount`, `speakers[]`, `agenda[]`, `registrationDeadline`, `status` (`draft`, `published`, `cancelled`, `completed`), timestamps | Text index on `title`, `description`, `tags`; compound `{status, schedule.startAt}`; `{organizer, schedule.startAt}` | Organizer, category, and venue are references so their records are reusable and independently managed. Schedule, speakers, and agenda are embedded because they belong only to one event and are read with it. |
| `registrations` | `user`, `event`, `registrationDate`, `status`, `qrToken` (generated with `crypto.randomBytes(24).toString('hex')`), `attendanceStatus` | Unique compound `{user,event}`; unique `qrToken`; `{event,status}`; `{user,registrationDate}` | User and event are references because both are shared entities and registrations need to be queried per user/event. The token is read only by its owning student and the check-in endpoint; never include it in organizer registration lists. |
| `attendance` | `registration`, `user`, `event`, `checkInTime`, `status` | Unique `{registration}`; `{event,status}` | References the registration, user, and event to avoid copying profile/event data and to support attendance queries. One record per registration prevents duplicate check-in. |
| `venues` | `name`, `building`, `room`, `address`, optional `coordinates`, `createdAt` | Unique or compound location/name index as needed | Separate reusable venue records avoid repeating venue details across events. |
| `categories` | `name`, `description`, `createdAt` | Unique normalized `name` | Separate records let admins manage shared categories consistently. |
| `notifications` | `user`, `type`, `message`, optional `event`, `read`, `createdAt` | `{user,read,createdAt}` | User and optional event are references; notifications are independently read/retained and should not inflate user/event documents. |
| `feedback` | `event`, `user`, `rating`, `comment`, `createdAt` | Unique compound `{event,user}`; `{event,createdAt}` | Event and user are references; feedback is independently queryable, and attended status is verified before insert. |

Use MongoDB Atlas transactions for registration/cancellation: atomically reserve or release a seat with a conditional event update (`registeredCount < capacity`), then write the registration change in the same transaction. A unique `{user,event}` index closes duplicate-registration races; a failed transaction rolls back the seat update. Require Atlas transaction support. Generate each token with `crypto.randomBytes(24).toString('hex')` and enforce its unique index. All dates are stored in UTC; the frontend displays them in local time.

## 6. User roles and permissions

- **Public:** browse/search event catalog and view event details; register or log in.
- **Student:** manage own profile; register/cancel own registration; view own registrations and QR/manual token; check own notifications; leave one feedback item only after attendance.
- **Organizer:** create and manage only owned events; view their registrants and attendance; check in participants for their own events.
- **Admin:** manage users and any event; manage categories and venues; view platform-level dashboard/aggregations.

Public registration always creates an active `student`; never accept a role from the registration form. Admins create organizer/admin accounts, and `server/scripts/seed.js` creates the first admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables plus a few default categories. The seed creates no fake users, events, or registrations.

## 7. Main user flows

- **Authentication:** student submits name/email/password and profile basics; server validates, hashes with bcrypt, saves a student, and returns a JWT. Login verifies the hash and returns a JWT plus safe user data. Protected APIs authenticate the token and authorize role/ownership.
- **Registration:** student opens an event and registers. Server validates event status/deadline, checks duplicate and capacity, atomically reserves one seat and creates the registration, then returns confirmation and a QR code/token. Student may cancel before the event; cancellation releases capacity transactionally.
- **QR attendance:** organizer opens event check-in, scans the QR or enters the same token manually. Server looks up the unique token, checks the event/registration and non-cancelled status, authorizes the event's organizer (or admin), and creates one attendance record. Repeated check-ins fail safely. Only the owning student and this check-in operation can read the token; it is excluded from organizer registration lists.
- **Organizer workflow:** create/edit event with schedule, capacity, venue, and deadline; publish/cancel; inspect registrations and attendance; check students in; review event-level counts and rating when available.
- **Admin workflow:** review dashboard counts; manage users and all events; maintain categories and venues; view basic platform aggregations.

## 8. API endpoint list

All paths are prefixed `/api`. `Public` means no JWT; other roles require authentication. Ownership checks apply to organizer event operations. Use consistent validation and error responses.

| Method | Path | Required role |
|---|---|---|
| `POST` | `/auth/register` | Public (creates student only) |
| `POST` | `/auth/login` | Public |
| `GET` | `/auth/me` | Any authenticated user |
| `GET` | `/events` | Public |
| `GET` | `/events/:eventId` | Public |
| `POST` | `/events` | Organizer |
| `PUT` | `/events/:eventId` | Owning organizer or admin |
| `DELETE` | `/events/:eventId` | Owning organizer or admin |
| `PATCH` | `/events/:eventId/cancel` | Owning organizer or admin |
| `GET` | `/users/me` | Any authenticated user |
| `PATCH` | `/users/me` | Any authenticated user |
| `POST` | `/registrations` | Student |
| `GET` | `/registrations/me` | Student |
| `GET` | `/registrations/:registrationId` | Owning student |
| `PATCH` | `/registrations/:registrationId/cancel` | Owning student |
| `GET` | `/organizer/events` | Organizer |
| `GET` | `/organizer/events/:eventId/registrations` | Owning organizer or admin |
| `GET` | `/organizer/events/:eventId/attendance` | Owning organizer or admin |
| `POST` | `/organizer/events/:eventId/check-ins` | Owning organizer or admin (body has QR/manual token) |
| `GET` | `/dashboards/student` | Student |
| `GET` | `/dashboards/organizer` | Organizer |
| `GET` | `/dashboards/admin` | Admin |
| `POST` | `/events/:eventId/feedback` | Student who attended |
| `GET` | `/events/:eventId/feedback` | Public |
| `GET` | `/notifications` | Any authenticated user (own only) |
| `PATCH` | `/notifications/:notificationId/read` | Owning user |
| `GET` | `/admin/users` | Admin |
| `POST` | `/admin/users` | Admin |
| `PATCH` | `/admin/users/:userId` | Admin |
| `DELETE` | `/admin/users/:userId` | Admin |
| `GET` | `/categories` | Public |
| `GET`, `POST` | `/admin/categories` | Admin |
| `PUT`, `DELETE` | `/admin/categories/:categoryId` | Admin |
| `GET` | `/venues` | Public |
| `GET`, `POST` | `/admin/venues` | Admin |
| `PUT`, `DELETE` | `/admin/venues/:venueId` | Admin |
| `POST` | `/uploads/image` | Any authenticated user (Cloudinary; validate file type and size) |

`GET /events` supports query parameters for text search, category, date range, venue, sort, page, and page size. It returns published and cancelled events only, never drafts; draft event details are not publicly accessible. Limit page size server-side. `DELETE /events/:eventId` is allowed only when the event has zero registrations; otherwise it must be cancelled. Public category/venue reads support filters and the create-event form. Basic dashboard endpoints use MongoDB aggregations for counts and registrations/attendance by event; advanced breakdowns are deferred.

## 9. Development order (vertical slices)

1. **Auth:** app/server foundations, user model, student signup/login, JWT and role guards.
2. **Events:** event/venue/category models, public browse/search/details, organizer-owned create/edit/cancel.
3. **Registration + QR:** registration UI/API, unique constraint, transactional capacity, student event history and QR/manual token display.
4. **Check-in + organizer:** QR and manual-token check-in, duplicate protection, organizer attendee/attendance views and dashboard.
5. **Admin + aggregations:** admin basics, dashboard counts, useful indexes and basic analytics pipelines.
6. **Extras:** Cloudinary uploads, feedback, notifications; then recommendations/discussions only if time permits.
7. **Security/testing/deploy/docs:** validate permissions, input and uploads; test race/duplicate/error cases and frontend loading/empty/error states; configure Atlas/Cloudinary and environment examples; deploy and finish setup/API/MongoDB/viva documentation.

Stop after Phase 0 for confirmation before creating implementation files or project folders.
