# Architecture Index

## Implementation Guide

This index is not the full contract. Do not implement from this file alone; follow the artifact paths below.

### Global artifacts

- `unit_graph.yaml` — all workers: locate their unit, trigger, and source anchors; source anchors are evidence, not rewrite instructions.
- `project-structure.md` — all workers: understand frontend layers, route boundaries, source counts, and runtime entrypoints.
- `tech-stack.md` — all workers: use the existing framework/runtime and dependency facts; it does not select a target stack.
- `data-model.md` — workers touching API/domain data: use only as a frontend DTO inventory; no server schema or transaction facts are available.
- `wire_contracts.yaml` — workers making API calls: filter `contracts` by the assigned unit; preserve current endpoint paths and field names.
- `shared_modules.yaml` — workers touching common code: filter modules by `used_by_units`; `fields` is the whitelist for the public members listed here.
- `cross_unit_state.yaml` — workers reading/writing app-wide state: filter flows where `writer.unit` or `reader.unit` matches the assigned unit; preserve the `mp_active_event` session state.

No `migration_boundary.yaml` is produced because this request did not specify a rewrite or migration. No `seams.yaml` is produced because no partial-migration cut was declared or analyzed.

### Unit artifacts

For each assignment, read all three exact paths listed below:

- `behavior.yaml` — observable effects, branches, error handling, and async execution that the target must preserve.
- `bindings.yaml` — route/framework declarations and runtime configuration.
- `unit_decomposition.yaml` — advisory split candidates only; `commit: false` means no target structure has been chosen.

For global rows, filter `wire_contracts.yaml` by exact `unit`; `shared_modules.yaml` by `used_by_units`; and `cross_unit_state.yaml` by matching writer/reader unit. Each worker's completion report must name artifacts read, implemented `must_preserve`/`must_appear_in_target` items, unresolved or deferred contracts, and relevant test/build/runtime evidence.

| Unit | External trigger | Required artifacts |
|---|---|---|
| `landing` | `GET /` | `units/landing/behavior.yaml`; `units/landing/bindings.yaml`; `units/landing/unit_decomposition.yaml` |
| `login` | `GET /login` | `units/login/behavior.yaml`; `units/login/bindings.yaml`; `units/login/unit_decomposition.yaml` |
| `dashboard` | `GET /dashboard` | `units/dashboard/behavior.yaml`; `units/dashboard/bindings.yaml`; `units/dashboard/unit_decomposition.yaml` |
| `event-list` | `GET /dashboard/events` | `units/event-list/behavior.yaml`; `units/event-list/bindings.yaml`; `units/event-list/unit_decomposition.yaml` |
| `event-create` | `GET /dashboard/events/new` | `units/event-create/behavior.yaml`; `units/event-create/bindings.yaml`; `units/event-create/unit_decomposition.yaml` |
| `event-overview` | `GET /dashboard/events/:id` (default child) | `units/event-overview/behavior.yaml`; `units/event-overview/bindings.yaml`; `units/event-overview/unit_decomposition.yaml` |
| `event-edit` | `GET /dashboard/events/:id/edit` | `units/event-edit/behavior.yaml`; `units/event-edit/bindings.yaml`; `units/event-edit/unit_decomposition.yaml` |
| `guest-management` | `GET /dashboard/events/:id/guests[/*]` | `units/guest-management/behavior.yaml`; `units/guest-management/bindings.yaml`; `units/guest-management/unit_decomposition.yaml` |
| `category-management` | `GET /dashboard/events/:id/categories[/*]` | `units/category-management/behavior.yaml`; `units/category-management/bindings.yaml`; `units/category-management/unit_decomposition.yaml` |
| `invitation-management` | `GET /dashboard/events/:id/invitations[ and /new]` | `units/invitation-management/behavior.yaml`; `units/invitation-management/bindings.yaml`; `units/invitation-management/unit_decomposition.yaml` |
| `invitation-send` | `GET /dashboard/events/:id/invitations/send` | `units/invitation-send/behavior.yaml`; `units/invitation-send/bindings.yaml`; `units/invitation-send/unit_decomposition.yaml` |
| `rsvp` | `GET /dashboard/events/:id/rsvp` | `units/rsvp/behavior.yaml`; `units/rsvp/bindings.yaml`; `units/rsvp/unit_decomposition.yaml` |
| `checkin` | `GET /dashboard/events/:id/checkin` | `units/checkin/behavior.yaml`; `units/checkin/bindings.yaml`; `units/checkin/unit_decomposition.yaml` |
| `table-management` | `GET /dashboard/events/:id/tables[/*]` | `units/table-management/behavior.yaml`; `units/table-management/bindings.yaml`; `units/table-management/unit_decomposition.yaml` |
| `drink-management` | `GET /dashboard/events/:id/drinks` | `units/drink-management/behavior.yaml`; `units/drink-management/bindings.yaml`; `units/drink-management/unit_decomposition.yaml` |
| `gallery` | `GET /dashboard/events/:id/gallery` | `units/gallery/behavior.yaml`; `units/gallery/bindings.yaml`; `units/gallery/unit_decomposition.yaml` |
| `internal-events` | `GET /dashboard/events/:id/internal-events[ and /new]` | `units/internal-events/behavior.yaml`; `units/internal-events/bindings.yaml`; `units/internal-events/unit_decomposition.yaml` |
| `statistics` | `GET /dashboard/events/:id/statistics` | `units/statistics/behavior.yaml`; `units/statistics/bindings.yaml`; `units/statistics/unit_decomposition.yaml` |
| `profile` | `GET /dashboard/profile` | `units/profile/behavior.yaml`; `units/profile/bindings.yaml`; `units/profile/unit_decomposition.yaml` |
| `organization-members` | `GET /dashboard/members[ and /new]` | `units/organization-members/behavior.yaml`; `units/organization-members/bindings.yaml`; `units/organization-members/unit_decomposition.yaml` |
| `platform-settings` | `GET /dashboard/settings` | `units/platform-settings/behavior.yaml`; `units/platform-settings/bindings.yaml`; `units/platform-settings/unit_decomposition.yaml` |
| `admin-overview` | `GET /dashboard/admin` | `units/admin-overview/behavior.yaml`; `units/admin-overview/bindings.yaml`; `units/admin-overview/unit_decomposition.yaml` |
| `admin-users` | `GET /dashboard/admin/users` | `units/admin-users/behavior.yaml`; `units/admin-users/bindings.yaml`; `units/admin-users/unit_decomposition.yaml` |
| `admin-organizations` | `GET /dashboard/admin/organizations` | `units/admin-organizations/behavior.yaml`; `units/admin-organizations/bindings.yaml`; `units/admin-organizations/unit_decomposition.yaml` |
| `admin-events` | `GET /dashboard/admin/events` | `units/admin-events/behavior.yaml`; `units/admin-events/bindings.yaml`; `units/admin-events/unit_decomposition.yaml` |
| `admin-drink-catalog` | `GET /dashboard/admin/drink-catalog` | `units/admin-drink-catalog/behavior.yaml`; `units/admin-drink-catalog/bindings.yaml`; `units/admin-drink-catalog/unit_decomposition.yaml` |
| `public-invitation` | `GET /invitations/:token` | `units/public-invitation/behavior.yaml`; `units/public-invitation/bindings.yaml`; `units/public-invitation/unit_decomposition.yaml` |
| `agent-checkin` | `GET /agent/checkin/:id` | `units/agent-checkin/behavior.yaml`; `units/agent-checkin/bindings.yaml`; `units/agent-checkin/unit_decomposition.yaml` |
