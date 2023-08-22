v0.9.0

- add `/draft ban <user>` command - prevents user from joining drafts
- add `/draft unban <user>` command
- add `/draft banlist` command

v0.8.0

- remove save timer

v0.7.0

- bump discord.js lib to latest v13

v0.6.0

- signup full ping now mentions all users in the count

v0.5.0

- Count field now shows #players in draft / 16
- Added a field to the embed displaying "Draft Type", which shows either "Open Pool" or "Closed Pool"
- Added `open_pool` flag to `/draft create` and `/draft edit`.
- A one time ping goes out after player count has been full for at least 3 minutes
- Cleaned up embed and the user log table a bit

v0.4.0

- drafts are now archived instead of being overwritten
- userlog is now stored with order users joined and how long they were in the draft/in the count
- `/draft add_player` is now `/draft add_players` and can accept up to 5 users
- `/draft remove_player` is now `/draft remove_players` and can accept up to 5 users
- new `admin_role` option under `/settings`, usable by server owner
- fix template attributes

v0.3.0

- remove ready check
- rework the way messages are sent and tracked
- debounce messages to mitigate rate limiting and ping spam

v0.2.0

- persist drafts to db and load them up when bot restarts
- add `skip_signup_ping` option to `/draft create`
- added `/template` command
- added `/player stats` command
- nicknames are now used on the signup sheet

v0.1.0

- initial release
