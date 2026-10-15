You are my senior full-stack developer and coding mentor.

I need to build a complete full-stack college project called:

# CampusConnect — Campus Event Discovery, Registration & Engagement Platform

I have LIMITED TIME, so prioritize a working, polished MVP over unnecessary complexity.

The application must use:

- React.js
- Vite
- Tailwind CSS
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- bcrypt
- Axios
- Cloudinary

This is specifically a **NoSQL/MongoDB college project**, so MongoDB concepts must be meaningfully demonstrated.

---

# ⚠️ MOST IMPORTANT DEVELOPMENT RULE

I DO NOT want mock data.

I want the final application to use REAL DATA from MongoDB Atlas.

Do not create fake event arrays, fake users, fake registrations, or fake dashboard statistics.

However, because the frontend is being developed before the backend, initially create the UI with proper empty/loading/error states and API service functions.

As soon as a backend endpoint exists, connect that frontend feature to the real endpoint.

Do NOT spend time building a separate mock-data system that will later be deleted.

---

# DEVELOPMENT ORDER

Follow this order:

## PHASE 0
Planning

## PHASE 1
Frontend UI and structure

## PHASE 2
Backend + MongoDB Atlas database

## PHASE 3
Authentication

## PHASE 4
Real API integration

## PHASE 5
Registration + QR attendance

## PHASE 6
Organizer/admin features

## PHASE 7
Notifications + feedback + discussions

## PHASE 8
Analytics + MongoDB features

## PHASE 9
Testing + security

## PHASE 10
Deployment + documentation

Because I have limited time, build the **MVP features first**, then add advanced features only if time remains.

---

# ============================================
# PHASE 0 — PROJECT PLANNING
# ============================================

Before coding, give me a concise but complete plan.

Define:

- Project architecture
- User roles
- Core features
- Frontend pages
- Backend modules
- API endpoints
- MongoDB collections
- Database relationships
- Authentication flow
- Registration flow
- QR attendance flow
- Organizer workflow
- Admin workflow

Also identify:

### MUST HAVE

Features required for the project to be considered complete.

### SHOULD HAVE

Features that improve the project.

### OPTIONAL

Features that can be added only if time remains.

Do NOT over-engineer the project.

Wait for my confirmation before coding.

---

# ============================================
# PHASE 1 — FRONTEND FIRST
# ============================================

Create the React + Vite frontend.

Use:

- React
- JavaScript
- Tailwind CSS
- React Router
- Axios

Folder structure:

```text
client/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── context/
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── public/
└── package.json
```

Create a professional, modern UI.

Do NOT create mock event data.

Use:

- Empty states
- Loading states
- Error states
- Proper API service functions

For example, instead of:

```javascript
const events = [...]
```

create an API service such as:

```javascript
getEvents()
```

which will later call the real backend.

---

# FRONTEND PAGES

## Public

### Landing Page

Include:

- Hero
- Event search
- Featured/upcoming event section
- Categories
- How it works
- CTA
- Footer

If there is no data yet, show a proper empty state rather than fake events.

---

### Login

Fields:

- Email
- Password

---

### Register

Fields:

- Name
- Email
- Password
- Department
- Year
- Interests

---

### Event Discovery

Features:

- Search
- Category filter
- Date filter
- Venue filter
- Sort
- Event cards
- Pagination

Data must eventually come from the backend.

---

### Event Details

Show:

- Poster
- Title
- Description
- Category
- Date
- Time
- Venue
- Organizer
- Speakers
- Agenda
- Capacity
- Available seats
- Registration deadline
- Register button

---

# STUDENT DASHBOARD

Include:

- Upcoming registered events
- Recommended events
- Notifications
- Registration history

---

# MY EVENTS

Tabs:

- Upcoming
- Attended
- Cancelled

---

# REGISTRATION DETAILS

Show:

- Event
- Registration status
- Registration date
- QR code
- Venue
- Date/time

---

# PROFILE

Allow users to manage:

- Name
- Profile image
- Department
- Year
- Interests
- Bio

---

# ORGANIZER DASHBOARD

Show real analytics once backend is connected:

- Total events
- Total registrations
- Attendance
- Average rating

---

# CREATE EVENT

Fields:

- Title
- Description
- Poster
- Category
- Tags
- Date
- Start time
- End time
- Venue
- Capacity
- Speakers
- Agenda
- Registration deadline

---

# MANAGE EVENTS

Organizer can:

- Create
- Edit
- Delete
- Cancel
- View registrations
- View attendance

---

# ADMIN DASHBOARD

Show:

- Total users
- Total events
- Total registrations
- Total attendance
- Popular categories

All values must eventually come from MongoDB.

---

# FRONTEND RULES

Use reusable components:

- Navbar
- EventCard
- SearchBar
- FilterPanel
- Modal
- Button
- FormInput
- LoadingSpinner
- EmptyState
- ErrorState

Use React Context for authentication.

Do not add Redux unless absolutely necessary.

---

# ============================================
# PHASE 2 — BACKEND + MONGODB ATLAS
# ============================================

Now create the backend.

Use:

- Node.js
- Express
- Mongoose
- JWT
- bcrypt
- dotenv
- CORS

Structure:

```text
server/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── validators/
├── utils/
├── app.js
├── server.js
└── package.json
```

---

# MONGODB ATLAS

Create the MongoDB Atlas database.

Do NOT use local MongoDB unless necessary.

Use environment variables:

```text
MONGODB_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Never commit `.env`.

Create `.env.example`.

---

# DATABASE COLLECTIONS

Use these core collections:

```text
users
events
registrations
attendance
venues
categories
notifications
feedback
```

Add discussions only after the core system works.

---

# USER MODEL

Include:

```text
name
email
password
role
department
year
profileImage
interests
bio
createdAt
updatedAt
```

Roles:

```text
student
organizer
admin
```

---

# EVENT MODEL

Use a flexible MongoDB document.

Include:

```text
title
description
poster
category
tags
organizer
venue
schedule
capacity
speakers
agenda
registrationDeadline
status
createdAt
updatedAt
```

Use embedded documents for suitable data such as:

```text
venue
speakers
agenda
schedule
```

Use references where relationships make more sense.

Explain every design decision.

---

# REGISTRATION MODEL

Include:

```text
user
event
registrationDate
status
qrToken
attendanceStatus
```

Create a unique constraint so one user cannot register twice for the same event.

---

# ATTENDANCE MODEL

Include:

```text
registration
user
event
checkInTime
status
```

Prevent duplicate check-ins.

---

# FEEDBACK MODEL

Include:

```text
event
user
rating
comment
createdAt
```

Only users who attended an event can submit feedback.

---

# NOTIFICATION MODEL

Include:

```text
user
type
message
event
read
createdAt
```

---

# ============================================
# PHASE 3 — AUTHENTICATION
# ============================================

Implement real authentication.

Features:

- Register
- Login
- JWT
- bcrypt
- Authentication middleware
- Role-based authorization

Protected routes:

```text
/student
/organizer
/admin
```

Never store plain-text passwords.

Test authentication with Postman.

---

# ============================================
# PHASE 4 — EVENT APIs
# ============================================

Create real REST APIs.

### Events

```text
POST   /api/events
GET    /api/events
GET    /api/events/:id
PUT    /api/events/:id
DELETE /api/events/:id
```

Also implement:

- Search
- Category filtering
- Date filtering
- Venue filtering
- Pagination
- Sorting

The frontend must now consume these real APIs.

Remove any temporary placeholders.

---

# ============================================
# PHASE 5 — REGISTRATION
# ============================================

Implement real registration.

Flow:

```text
Student
↓
Event details
↓
Register
↓
Backend validates:
- authenticated?
- event exists?
- registration deadline passed?
- capacity available?
- already registered?
↓
Create MongoDB registration
↓
Generate QR code
↓
Show registration confirmation
```

---

# ============================================
# PHASE 6 — QR ATTENDANCE
# ============================================

Generate a unique QR code for every registration.

Organizer can scan the QR code.

Backend verifies:

- QR is valid
- Registration exists
- Registration belongs to event
- Registration is not cancelled
- Student has not already checked in

Then create attendance record.

---

# ============================================
# PHASE 7 — CLOUDINARY
# ============================================

Implement real image uploads.

Use Cloudinary for:

- Event posters
- Profile pictures

Store only the resulting URLs in MongoDB.

Validate file type and size.

---

# ============================================
# PHASE 8 — ORGANIZER + ADMIN
# ============================================

Implement organizer permissions.

Organizer can only manage their own events.

Implement:

- Create event
- Edit event
- Cancel event
- View registrations
- View attendance

Admin can:

- Manage users
- Manage events
- Manage categories
- Manage venues

---

# ============================================
# PHASE 9 — MONGODB FEATURES
# ============================================

This is especially important for my NoSQL subject.

Implement meaningful MongoDB features.

## Indexing

Add indexes for commonly queried fields.

## Text Search

Allow searching:

- title
- description
- tags

## Compound Indexes

Use appropriate compound indexes.

## Aggregation

Create analytics for:

- registrations per event
- attendance rate
- popular categories
- department participation
- year-wise participation
- monthly event trends
- average event rating

## Geospatial

If practical, add venue coordinates and support nearby-event queries.

Explain each MongoDB feature in simple viva-friendly language.

---

# ============================================
# PHASE 10 — RECOMMENDATIONS
# ============================================

Implement a simple rule-based recommendation system.

Use:

- Student interests
- Event category
- Event tags
- Previous registrations

Do NOT use machine learning.

Example:

If user interests are:

```text
AI
Web Development
Hackathons
```

prioritize matching events.

---

# ============================================
# PHASE 11 — NOTIFICATIONS
# ============================================

Implement:

- Registration confirmation
- Event cancellation
- Venue change
- Event reminder
- New announcement

Store notifications in MongoDB.

---

# ============================================
# PHASE 12 — FEEDBACK
# ============================================

After attendance:

Allow users to submit:

- Rating
- Comment

Prevent users from submitting feedback unless they attended.

Display average event rating.

---

# ============================================
# PHASE 13 — EVENT DISCUSSION
# ============================================

Only if enough time remains.

Add an event-specific discussion section.

Students can ask questions about that event.

Organizers can reply.

Keep it event-specific.

Do NOT build a general social network.

---

# ============================================
# PHASE 14 — CONNECT EVERYTHING
# ============================================

Make sure every frontend feature uses the real backend.

There must be NO mock data.

Final data flow:

```text
React
 ↓
Axios
 ↓
Express REST API
 ↓
Controller
 ↓
Service/Model
 ↓
MongoDB Atlas
 ↓
Response
 ↓
React UI
```

Verify every major flow.

---

# ============================================
# PHASE 15 — SECURITY
# ============================================

Check:

- JWT authentication
- Password hashing
- Authorization
- Input validation
- MongoDB injection prevention
- CORS
- File upload validation
- Environment variables
- Duplicate registration
- Capacity handling
- Unauthorized event modification

---

# ============================================
# PHASE 16 — TESTING
# ============================================

Test with Postman.

Test:

- Register
- Login
- Invalid login
- Create event
- Edit event
- Delete event
- Search event
- Register
- Duplicate registration
- Cancel registration
- QR check-in
- Duplicate check-in
- Feedback
- Organizer authorization
- Admin authorization

Also test frontend error/loading/empty states.

---

# ============================================
# PHASE 17 — FINAL POLISH
# ============================================

Once functionality works:

- Improve UI
- Fix responsiveness
- Add loading skeletons
- Add toast notifications
- Add confirmation dialogs
- Improve forms
- Improve navigation
- Fix errors
- Remove unused code
- Remove console logs
- Check mobile layout

Do NOT add new major features at this stage.

---

# ============================================
# PHASE 18 — DEPLOYMENT
# ============================================

Deploy:

Frontend → Vercel

Backend → Render

Database → MongoDB Atlas

Images → Cloudinary

Configure production environment variables.

Test the complete deployed application.

---

# ============================================
# PHASE 19 — DOCUMENTATION
# ============================================

Create:

## README

Include:

- Project overview
- Features
- Tech stack
- Architecture
- Folder structure
- MongoDB database design
- API endpoints
- Setup instructions
- Environment variables
- Screenshots
- Deployment

## College report

Prepare:

- Abstract
- Problem statement
- Objectives
- Existing system
- Proposed system
- Requirements
- Architecture
- Database design
- MongoDB concepts
- Implementation
- Testing
- Results
- Future scope
- Conclusion

## Viva

Prepare:

- 20 MongoDB questions
- 15 MERN questions
- 15 backend questions
- 10 authentication/security questions
- 20 project-specific questions

Focus especially on:

- Why MongoDB?
- SQL vs NoSQL
- Embedded vs referenced documents
- Mongoose
- MongoDB Atlas
- Indexing
- Aggregation
- Text search
- JWT
- REST APIs
- QR attendance
- Registration capacity
- Duplicate registration prevention
- MongoDB schema design

---

# ⚡ TIME MANAGEMENT RULE

I have limited time.

Therefore prioritize this MVP:

### MUST FINISH

1. Authentication
2. Event creation
3. Event browsing
4. Search/filter
5. Event details
6. Registration
7. Student dashboard
8. Organizer dashboard
9. MongoDB Atlas
10. MongoDB aggregation
11. QR attendance
12. Admin basics
13. Responsive UI

### ADD ONLY IF TIME REMAINS

- Recommendations
- Notifications
- Event discussions
- Advanced analytics
- Geospatial search

Do not spend hours on features that aren't essential to the core project.

---

# 🚨 WORKFLOW FOR EVERY PHASE

For each phase:

1. Tell me what we're building.
2. Give me the files to create/change.
3. Provide the code.
4. Explain important parts.
5. Tell me the exact terminal commands.
6. Tell me how to test it.
7. Stop and wait for my confirmation.

If you need to modify a previous file, show me exactly what changed.

If an error occurs, debug it before continuing.

Never assume a feature works without testing it.

---

# START NOW

Start with:

## PHASE 0 — PROJECT PLANNING

Do NOT write implementation code yet.

Give me:

1. Final feature list
2. MUST HAVE / SHOULD HAVE / OPTIONAL features
3. Complete frontend page structure
4. Backend architecture
5. MongoDB collection design
6. User roles
7. Main user flows
8. API endpoint list
9. Development order

Keep the plan practical for a student with limited time.

Then STOP and wait for my confirmation.