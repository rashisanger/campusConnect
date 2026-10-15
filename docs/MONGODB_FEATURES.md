# MongoDB Features in CampusConnect

This guide describes the MongoDB features used by the current MVP in viva-friendly terms. API paths below are prefixed with `/api`.

## Embedded and referenced documents

- **What it is:** Embedded data lives inside its parent document; referenced data stores another document's ID.
- **Where used:** Event schedule, speakers, and agenda are embedded in [Event.js](../server/models/Event.js). Event organizer, category, and venue; registration user and event; and attendance registration, user, and event are references in [Event.js](../server/models/Event.js), [Registration.js](../server/models/Registration.js), and [Attendance.js](../server/models/Attendance.js).
- **Why chosen:** A schedule and its speakers/agenda are only meaningful as part of one event and are usually read with it. Users, venues, and categories are shared records that need independent updates and queries.
- **Examiner may ask:** “Why are speakers embedded but the organizer referenced?” Speakers belong to one event, while one organizer can manage many events.

## Unique indexes

- **What it is:** A unique index prevents two documents from having the same indexed value.
- **Where used:** User email, category name, the venue name/building/room combination, registration QR token, one registration per user/event, and one attendance record per registration. See [User.js](../server/models/User.js), [Category.js](../server/models/Category.js), [Venue.js](../server/models/Venue.js), [Registration.js](../server/models/Registration.js), and [Attendance.js](../server/models/Attendance.js).
- **Why chosen:** These are database-level guarantees, so concurrent requests cannot bypass duplicate checks in application code.
- **Examiner may ask:** “Why is the registration index compound?” It guarantees that a student can have only one registration record for a particular event, including after cancellation and re-registration.

## Compound indexes

- **What it is:** A compound index stores several fields in order and can support queries using the leading fields and sort order.
- **Where used:** Event discovery/listing indexes support status/date, category/date, venue/date, organizer/date, and creation-date queries in [Event.js](../server/models/Event.js). Registration indexes support event/status rosters and a student's registration history in [Registration.js](../server/models/Registration.js). Attendance event/time and user indexes support organizer check-in history in [Attendance.js](../server/models/Attendance.js). User role/active/creation-time, department, and year indexes support admin lists and participation breakdowns in [User.js](../server/models/User.js).
- **Why chosen:** These indexes match filters and sorts that the application actually performs; they avoid scanning every document for common list requests.
- **Examiner may ask:** “Why does field order matter?” MongoDB can efficiently use a compound index starting from its leftmost indexed field.

## Text index

- **What it is:** A text index tokenizes text fields and supports keyword search.
- **Where used:** The title, description, and tags text index in [Event.js](../server/models/Event.js) serves `GET /api/events?search=...` and admin search in `GET /api/admin/events?search=...`, implemented in [eventService.js](../server/services/eventService.js).
- **Why chosen:** It provides a native MongoDB way to search event content without downloading events to search in the browser.
- **Examiner may ask:** “Why use `$text` rather than filtering all event titles in React?” MongoDB searches the indexed collection and returns only matching results.

## TTL indexes (not used)

- **What it is:** A TTL index automatically deletes documents after a configured time.
- **Where used:** Not used in this project.
- **Why chosen:** Events, registrations, attendance, and accounts are persistent academic records; automatically removing them after a timer would be unsafe. Temporary records requiring expiry are not part of this MVP.
- **Examiner may ask:** “Why not add TTL to registrations?” Registration history and attendance must remain available instead of expiring automatically.

## Transactions

- **What it is:** A transaction groups multiple database writes so they all commit together or all roll back.
- **Where used:** [registrationService.js](../server/services/registrationService.js) registers/cancels students while adjusting event capacity. [checkInService.js](../server/services/checkInService.js) changes a registration's attendance state and creates its attendance record.
- **Why chosen:** A registration must not consume a seat if its document cannot be saved; check-in must not mark a registration attended without the corresponding attendance record.
- **Examiner may ask:** “What happens if one operation in the transaction fails?” MongoDB aborts the transaction, so none of its changes are committed.

## Atomic operators: `$inc` and `findOneAndUpdate`

- **What it is:** `$inc` changes a number atomically; `findOneAndUpdate` applies a conditional update to one matching document.
- **Where used:** Registration reserve/release uses `$inc` and a capacity condition in [registrationService.js](../server/services/registrationService.js). Check-in uses a conditional `findOneAndUpdate` in [checkInService.js](../server/services/checkInService.js).
- **Why chosen:** MongoDB tests and changes capacity in one operation, preventing two simultaneous students from taking the last seat. A conditional attendance update lets only one concurrent check-in transition a registration from not attended to attended.
- **Examiner may ask:** “How does the app prevent overbooking?” It only increments `registeredCount` when MongoDB confirms it is still below `capacity`, within the registration transaction.

## Aggregation pipelines

- **What it is:** A pipeline transforms and summarizes documents inside MongoDB in ordered stages.
- **Where used:** [analyticsService.js](../server/services/analyticsService.js) powers `GET /api/dashboards/admin`. [organizerService.js](../server/services/organizerService.js) powers `GET /api/dashboards/organizer`. Student dashboard counts are also aggregated in [registrationService.js](../server/services/registrationService.js).
- **Why chosen:** MongoDB can group and join the needed records without sending full collections to the Node.js process. Monthly charts use the same pipeline and fill missing month labels with zero counts on the server.
- **Examiner may ask:** “Why calculate analytics in MongoDB?” The database processes the data near where it is stored and returns compact summaries instead of loading every record into application memory.

### Pipeline stages demonstrated

| Stage | Simple meaning | CampusConnect use |
|---|---|---|
| `$match` | Keep only documents satisfying a filter. | Limit registration analytics to active registrations and month trends to a UTC date range. |
| `$group` | Combine documents by a key and calculate totals. | Count users by role, event statuses, department/year participation, and events per month. |
| `$lookup` | Join documents from another collection. | Connect registrations to events, users, and categories for analytics. |
| `$unwind` | Turn each joined array item into a separate pipeline document. | Process the event, user, and category records returned by a lookup. |
| `$facet` | Run multiple sub-pipelines over the same input. | The organizer dashboard returns summary totals and per-event rows from one event pipeline in [organizerService.js](../server/services/organizerService.js). |
| `$dateToString` | Format a date into a string in a chosen timezone. | Group event starts into `YYYY-MM` trend buckets in UTC in [analyticsService.js](../server/services/analyticsService.js). |

## `explain()` and query-plan verification

- **What it is:** `explain('executionStats')` reports how MongoDB planned and executed a query, including index scans and documents examined.
- **Where used:** Run `npm run explain` from `server/`. The read-only script is [explainDemo.js](../server/scripts/explainDemo.js) and prints query stages, index names, keys/documents examined, and returned counts.
- **Why chosen:** It helps verify whether a query uses an index (`IXSCAN`) or scans the collection (`COLLSCAN`) and informs future index tuning.
- **Examiner may ask:** “What does `COLLSCAN` mean?” MongoDB examined collection records rather than using an index for that query plan.

## Geospatial indexes

Geospatial search is an optional feature and is not implemented in this slice. Venue coordinates remain ordinary latitude/longitude values; no `2dsphere` index or nearby-venue endpoint is present.
