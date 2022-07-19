# Commands

# /draft

# /team

# /template

# /settings

# Setting up Firebase

https://firebase.google.com/docs/admin/setup#initialize-sdk

`export GOOGLE_APPLICATION_CREDENTIALS="<path>/gwdraft-firebase-key.json"`

copy this file to the Dokku instance with `scp`:

`scp <path>/gwdraft-firebase-key.json root@<droplet_ip>:/gwdraft-firebase-key.json`

enable the config for your app in dokku:

`dokku config:set <app_name> GOOGLE_APPLICATION_CREDENTIALS="/gwdraft-firebase-key.json"
