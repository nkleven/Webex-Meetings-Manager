# Webex-Meetings-Manager

## Installation
1. Install [Node.js](https://nodejs.org/en/)
2. Clone this repository to your desired working directory
3. [Create new integration](https://developer.webex.com/my-apps/new/integration) on developer.webex.com
  - Required Scopes:
    - meeting:admin_preferences_write
    - meeting:admin_schedule_write 
    - meeting:admin_preferences_read 
    - meeting:admin_schedule_read 
    - spark:kms 
    - spark-admin:people_read 
    - meeting:admin_participants_read 
    - meeting:controls_read meeting:controls_write
  -Document the following:
    - Client ID
    - Client Secret
    - Integration ID
