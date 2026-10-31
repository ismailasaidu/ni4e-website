# NI4E Member upgrade and in-app notification update

## Upgrade request experience
- Members submit the upgrade request first and wait for the Secretariat decision.
- No supporting-document upload is shown while the request is pending or under review.
- If the Secretariat approves the upgrade, the upload area appears inside that same application record.
- If the Secretariat requests more information, the same application record displays the Secretariat note and upload area.
- Uploaded files are linked to the same `membership_applications.id`; members do not use a separate document page.
- Rejected requests do not show a document upload action.

## Application evidence
- Removed the standalone Application evidence navigation destination.
- Supporting files are listed within their associated application card.
- The dashboard shortcut now opens Applications.

## In-app notifications
- Bell opens a notification centre with unread count, unread styling and mark-all-read.
- Clicking a notification marks it read and takes the member to the relevant member area.
- Supabase Realtime adds newly inserted notifications to the bell without requiring a page refresh.
- Existing notification triggers cover application decisions, membership profile changes, membership payments and event registrations.
- New migration `20261030_member_event_announcement_notifications.sql` creates notifications for all portal profiles when an event is first published and when key published event details change.

## Supabase migration order
1. Ensure `20261020_member_notifications.sql` has already been applied.
2. Apply `20261030_member_event_announcement_notifications.sql`.

The migration does not send notifications for unpublished events or demo events that remain unpublished. It uses the existing `site_content` event records and does not create a second event store.
