# Data Model (Frontend View)

## Scope and evidence

This repository contains a browser client, not the backend implementation. There are no ORM entities, migrations, database definitions, or authoritative persisted schema here. The inventory below documents TypeScript API DTOs and the shapes the frontend parses or sends; nullable and optional fields reflect the client declarations, not database nullability.

## Main resource shapes

- **AuthUser** (`src/models/auth.ts`): `id`, `firstName`, `lastName`, `email`, optional nullable `phone`, `active`, `roles[]`, `permissions[]`, optional nullable `organizationId`.
- **Event** (`src/api/events.ts`): event identity and type/status; names, date/time/location; wedding/couple details and photos; dress colors/image; sessions and invitation settings. The concrete event/session fields are declared in that module.
- **Guest** (`src/api/guests.ts`): `id`, `eventId`, optional nullable `categoryId`, first/last name, optional phone/email/address, optional `allowedCompanions`, and `active`.
- **GuestCategory** (`src/api/guests.ts`): `id`, `eventId`, `name`, optional description, and `active`.
- **Invitation** (`src/api/invitations.ts`): invitation and guest identifiers, status, attendee count, RSVP data, token/code, and delivery/card metadata as represented by the client interface.
- **WeddingTable** (`src/api/tables.ts`): table identifier, event identifier, name, and capacity. **TableAssignment** (`src/api/assignments.ts`) links a guest/invitation to a table.
- **WeddingEventItem** (`src/api/weddingEvents.ts`): scheduled event/session data associated with an event.
- **RsvpRow** (`src/api/rsvp.ts`): guest/invitation response summary, including response status, party size, and drink selection.
- **Gallery** and **GalleryPhoto** (`src/api/gallery.ts`): gallery is associated with an event and contains photos; photos can carry a guest-category association, caption, order, content type, and image URL.
- **Drink**, **CatalogDrink**, and **AvailableDrink** (`src/api/drinks.ts`, `src/api/drinkCatalog.ts`, `src/api/availableDrinks.ts`): catalog items, event-level availability, and selected drinks.
- **OrgMember** (`src/api/organization.ts`): organization membership, user/role data, and optional event assignment.
- **AdminUser** and **AdminOrganization** (`src/api/admin.ts`): administration list/detail data for users and organizations.
- **PublicInvitation** (`src/api/publicInvitation.ts`): guest and event presentation, token, attendance limit, RSVP status/party size/drinks/note, event sessions, dress guidance, and venue/map data.
- **Check-in DTOs** (`src/api/checkin.ts`): scan/check-in results and present-guest/search rows containing guest name, expected/checked-in/remaining attendees, eligibility, event, table, and drink information.

## Relationships evidenced by the client

- An event has guests, categories, invitations, tables, drink availability, RSVP/check-in data, gallery photos, and schedule sessions, all requested through event-scoped endpoints.
- A guest may reference a category and can be associated with an invitation, check-in, table assignment, and RSVP.
- A table assignment associates a guest with a table within an event.
- An invitation is token-addressable for the public invitation and RSVP flow; public uploads store the generated invitation-card image through the API.
- An organization has members and settings; members can be assigned to an event.
- These are client/API relationships only; referential constraints, cascade rules, and database cardinalities are not visible here.

## Schema and transaction boundaries

- The API client uses JSON and multipart requests for uploads. DTO field names and endpoint paths are visible in `src/api/*.ts`.
- No table names, column annotations, database constraints, transaction declarations, or transaction boundaries are present in the frontend repository.
- The client-side API contracts do not establish database types, default values, indexes, or persistence guarantees.

## Key entities

1. **Event** — root resource for the event-management screens and most event-scoped API paths.
2. **Guest** — invitee record, optionally categorized and eligible for a configured number of companions.
3. **Invitation** — guest-facing invitation, status, RSVP and public token/card flow.
4. **GuestCategory** — event-associated grouping for guests and gallery categorization.
5. **WeddingTable / TableAssignment** — event seating and guest placement.
6. **WeddingEventItem** — schedule entry associated with an event.
7. **OrgMember** — user membership and event assignment within an organization.
8. **AuthUser** — current account identity, roles, permissions, and organization reference.
