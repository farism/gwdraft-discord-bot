# Setting up Firebase

https://firebase.google.com/docs/admin/setup#initialize-sdk

`export GOOGLE_APPLICATION_CREDENTIALS="<path>/gwdraft-firebase-key.json"`

copy this file to the Dokku instance with `scp`:

`scp <path>/gwdraft-firebase-key.json root@<droplet_ip>:/gwdraft-firebase-key.json`

enable the config for your app in dokku:

`dokku config:set <app_name> GOOGLE_APPLICATION_CREDENTIALS="/gwdraft-firebase-key.json"

# Functionality of draft bot

1. type /draft to start a draft
2. draft bot sends a message to chat
3. users add reaction to draft bot message to sign up for draft
   a. reaction will be automatically removed 30 minutes later to ensure activity
4. once users reach 18, autodraft users onto teams, with one ringer
5. autodraft team balance is based on
   a. player skill rating
   b. bans/flux
6. users can be rated via /rank <username>
7. this returns a list of professions and their current ratings, which can then be replaced by new ratings
8. view all users ranks by using /ranks
