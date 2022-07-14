# Setting up Firebase

https://firebase.google.com/docs/admin/setup#initialize-sdk

`export GOOGLE_APPLICATION_CREDENTIALS="<path>/gwdraft-firebase-key.json"`

copy this file to the Dokku instance with `scp`:

`scp <path>/gwdraft-firebase-key.json root@<droplet_ip>:/gwdraft-firebase-key.json`

enable the config for your app in dokku:

`dokku config:set <app_name> GOOGLE_APPLICATION_CREDENTIALS="/gwdraft-firebase-key.json"

# Functionality of draft bot

- type /draft to start a draft
- draft bot sends a message to chat
- users add reaction to draft bot message to sign up for draft
  a. reaction will be automatically removed 30 minutes later to ensure activity
- once users reach 18, autodraft users onto teams, with one ringer
- autodraft team balance is based on
  a. player skill rating
  b. bans/flux
- users can be rated via /rank <username> <profession> <rank>
- /rank <username> will return a list of all rankings for the user
- /rank <username> <profession> will return the rank for only the profession specified
- /rank <username> <profession> <rank> will set the rank for the specified profession
