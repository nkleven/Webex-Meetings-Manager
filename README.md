# Webex-Meetings-Manager

## Installation
1. Install [Node.js](https://nodejs.org/en/)
2. Clone this repository to your desired working directory
3. [Create new integration](https://developer.webex.com/my-apps/new/integration) on developer.webex.com
  - Will this integration use a mobile SDK?: No
  - Integration Name: Something meaningful to your organization
  - Icon: Use one of the defaults or upload a custom
  - App Hub Description: Something meaningful to your organization
  - Redirect URI(s): URL for your implementation of the app 
  - Required Scopes:
    - meeting:admin_preferences_write
    - meeting:admin_schedule_write 
    - meeting:admin_preferences_read 
    - meeting:admin_schedule_read 
    - spark:kms 
    - spark-admin:people_read 
    - meeting:admin_participants_read 
    - meeting:controls_read meeting:controls_write
  - Document the following:
    - Client ID
    - Client Secret
    - Integration ID
4. Copy the envsample file to .env and insert your Client ID and Client Secret from step 3.
5. In your app working directory, type NPM Install
6. In your app working directory, type NPM Install Nodemon
7. 
