# Setting up LBC

## Pre-Requisities

#### Hardware

- TMCC Only: TMCC Command Base, USB-RS232 Cable
- Legacy / Legacy + TMCC: Legacy Command Base / Base-3, LCS SER2 + PDI Power, USB-RS232 Cable
- DCS: TBA

### Software

- NodeJS v16: https://nodejs.org/en/download/releases/ 
  - Can also install using https://github.com/nvm-sh/nvm
- Git
  - Windows: Git / Git Bash (For running): https://git-scm.com/downloads
  - Linux / Raspi: git package

### Setup

Clone the repository

This repo uses yarn v1 for package management. Install it globally with `npm install -g yarn`

Run `yarn install` in the root of the repo after cloning to install required packages


## Running

This repo uses yarn workspaces for targeting scripts + packages.
To run the app, run the following in `2` seperate terminals in the root of the repo

- yarn workspace lbc-app dev
- yarn workspace lbc-web dev

After starting both apps, open a browser at http://localhost:3002 to start configuring

## Configuration

After opening the browser link above, 3 sidebar options are presented
- Engines
- Serial
- Controller

If you are planning on using a Dualsense controller, click on the `Controllers` menu option
- If your controller is not listed, plug it in, then click the refresh icon at the top left. Once it is listed. Click the connect icon. In the app console - you should now see "Controller Connected". The controller has no feedback screen, all feedback is in the app menu console for now. Set up your serial / engines first, then press the DPAD_LEFT or DPAD_RIGHT options to select your new engine. You should see a console printout that your active engine has changed.

The following mappings are currently completed for engine control:
- BUMPER_LEFT: Slow Down
- TRIGGER_LEFT: Slow Down (Decrement 1)
- TRIGGER_LEFT Rapid Click Twice: Emergency Stop
- BUMPER_RIGHT: Speed Up
- TRIGGER_RIGHT: Speed Up (Increment 1)
- ANALOG_RIGHT (negative): Horn quilling control
- BTN_SQUARE: Bell Toggle
- BTN_TRIANGLE: Direction Toggle

Click on the `Serial` menu option to configure your serial devices. If you don't see a device listed, plug it in, and press the refresh icon. Once it appears in the list, click it, then click the connect button at the top. A menu will appear asking you to select the Control type. Select it, then click `Toggle`. It will then open the connection and return you to the serial menu screen. The `Status` Column to the right should show green now.

Click on the `Engines` menu option to configure your engines. Click on the `+` Icon to add a new engine. Enter in the engine details, and click "Add". Your engine can now be addressed! To address your engine, click on it in the list, then click the gamepad icon. This will open the engine controller for you to use.

## Debugging

The app supports 2 environment variables for debugging
- APP_DEBUG=true for debugging app related code
- SERIAL_DEBUG=true for debugging serial chatter
