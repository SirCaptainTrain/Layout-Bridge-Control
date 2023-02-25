import { Dualsense } from 'dualsense-ts'
import dotenv from 'dotenv'
import { DualsenseMenuHandler } from './handlers/dualsenseMenuHandler'
import { DualsenseEngineHandler } from './handlers/dualsenseEngineHandler'
import { API } from './api'

dotenv.config()
const APP_DEBUG = process.env.APP_DEBUG === 'true'

enum ControlMode {
    'ENGINE',
    'MENU',
    'MENU_ENGINES',
}

export const DualsenseController = (
    api: API,
    errorCallback: (type: 'error' | 'fatal', message: string) => void
) => {
    const dualsenseEngineHandler = DualsenseEngineHandler(api)
    const dualsenseMenuHandler = DualsenseMenuHandler(api)
    let controller: Dualsense | null = null
    let engineLoopRunning = false
    let connected = false

    let DEBUG_TRIGGER_L_ACTIVE = false
    let DEBUG_TRIGGER_R_ACTIVE = false

    let activeControlMode = ControlMode.ENGINE

    const connect = async () => {
        controller = new Dualsense()
        addControllerCallback()
        engineLoopRunning = true
        while (engineLoopRunning) {
            await dualsenseEngineHandler.engineControlLoop()
            await sleep(100)
        }
    }

    const addControllerCallback = () => {
        controller.connection.on('change', async ({ active }) => {
            console.log(`Controller ${active ? 'connected' : 'disconnected'}`)
            connected = active
        })

        controller.left.trigger.on('release', async () => {
            if (APP_DEBUG && DEBUG_TRIGGER_L_ACTIVE !== false) {
                DEBUG_TRIGGER_L_ACTIVE = false
                console.log('L_TRIGGER_R', false)
            }

            if (activeControlMode === ControlMode.ENGINE)
                dualsenseEngineHandler.handleLeftTrigger(false)
        })

        controller.left.trigger.on('change', async ({ active }) => {
            if (APP_DEBUG && DEBUG_TRIGGER_L_ACTIVE !== active) {
                console.log('L_TRIGGER', active)
            }
            DEBUG_TRIGGER_L_ACTIVE = active

            if (activeControlMode === ControlMode.ENGINE)
                dualsenseEngineHandler.handleLeftTrigger(active)
        })

        controller.right.trigger.on('release', async () => {
            if (APP_DEBUG && DEBUG_TRIGGER_R_ACTIVE !== false) {
                DEBUG_TRIGGER_R_ACTIVE = false
                console.log('R_TRIGGER_R', false)
            }

            if (activeControlMode === ControlMode.ENGINE)
                dualsenseEngineHandler.handleRightTrigger(false)
        })

        controller.right.trigger.on('change', async ({ active }) => {
            if (APP_DEBUG && DEBUG_TRIGGER_R_ACTIVE !== active) {
                console.log('R_TRIGGER', active)
            }
            DEBUG_TRIGGER_R_ACTIVE = active

            if (activeControlMode === ControlMode.ENGINE)
                dualsenseEngineHandler.handleRightTrigger(active)
        })

        controller.left.bumper.on('change', async ({ active }) => {
            if (APP_DEBUG) {
                console.log('L_BUMPER', active)
            }

            if (activeControlMode === ControlMode.ENGINE) {
                await dualsenseEngineHandler.handleLeftBumper(active)
            } else {
                dualsenseMenuHandler.handleLeftBumper(active)
            }
        })

        controller.right.bumper.on('change', async ({ active }) => {
            if (APP_DEBUG) {
                console.log('R_BUMPER', active)
            }

            if (activeControlMode === ControlMode.ENGINE) {
                await dualsenseEngineHandler.handleRightBumper(active)
            } else if (activeControlMode === ControlMode.MENU) {
                await dualsenseMenuHandler.handleRightBumper(active)
            }
        })

        controller.dpad.left.on('press', async () => {
            if (APP_DEBUG) {
                console.log('DPAD_L')
            }

            if (activeControlMode === ControlMode.ENGINE)
                await dualsenseEngineHandler.handleDpadLeft()
        })

        controller.dpad.right.on('press', async () => {
            if (APP_DEBUG) {
                console.log('DPAD_R')
            }

            if (activeControlMode === ControlMode.ENGINE)
                await dualsenseEngineHandler.handleDpadRight()
        })

        controller.dpad.up.on('press', () => {
            if (APP_DEBUG) {
                console.log('DPAD_U')
            }

            if (activeControlMode === ControlMode.ENGINE) {
                activeControlMode = ControlMode.MENU_ENGINES
            } else if (activeControlMode === ControlMode.MENU_ENGINES) {
                activeControlMode = ControlMode.MENU
            } else if (activeControlMode === ControlMode.MENU) {
                activeControlMode = ControlMode.ENGINE
            }

            console.log('Control Mode Switched:', activeControlMode)
        })

        controller.dpad.down.on('press', () => {
            if (APP_DEBUG) {
                console.log('DPAD_D')
            }

            if (activeControlMode === ControlMode.MENU_ENGINES) {
                activeControlMode = ControlMode.ENGINE
            } else if (activeControlMode === ControlMode.ENGINE) {
                activeControlMode = ControlMode.MENU
            } else if (activeControlMode === ControlMode.MENU) {
                activeControlMode = ControlMode.MENU_ENGINES
            }

            console.log('Control Mode Switched:', activeControlMode)
        })

        controller.cross.on('press', async ({ active }) => {
            if (APP_DEBUG) {
                console.log('BTN_CROSS')
            }

            if (activeControlMode === ControlMode.ENGINE) {
                await dualsenseEngineHandler.handleCross(active)
            } else if (activeControlMode === ControlMode.MENU) {
                await dualsenseMenuHandler.handleCross()
            }
        })

        controller.triangle.on('press', async ({ active }) => {
            if (APP_DEBUG) {
                console.log('BTN_TRIANGLE')
            }

            if (activeControlMode === ControlMode.ENGINE) {
                await dualsenseEngineHandler.handleTriangle(active)
            } else if (activeControlMode === ControlMode.MENU) {
                await dualsenseMenuHandler.handleTriangle()
            }
        })

        controller.square.on('press', async ({ active }) => {
            if (APP_DEBUG) {
                console.log('BTN_SQUARE')
            }

            if (activeControlMode === ControlMode.ENGINE) {
                await dualsenseEngineHandler.handleSquare(active)
            } else if (activeControlMode === ControlMode.MENU) {
                await dualsenseMenuHandler.handleSquare()
            }
        })

        controller.circle.on('press', async ({ active }) => {
            if (APP_DEBUG) {
                console.log('BTN_CIRCLE')
            }

            if (activeControlMode === ControlMode.ENGINE) {
                await dualsenseEngineHandler.handleCircle(active)
            } else if (activeControlMode === ControlMode.MENU) {
                await dualsenseMenuHandler.handleCircle()
            }
        })

        controller.right.analog.y.on('press', async ({ active }) => {
            if (active) {
                if (activeControlMode === ControlMode.ENGINE) {
                    await dualsenseEngineHandler.handleAnalogRightPositive(0)
                }
            }
        })

        controller.right.analog.y.on('change', async (axis) => {
            // Ensure whistle resets to off on any change
            if (activeControlMode === ControlMode.ENGINE) {
                await dualsenseEngineHandler.handleAnalogRightNegative(
                    axis.state
                )
            }
        })

        controller.hid.on('error', (error) => {
            if (error.message.includes('No controllers')) {
                // nom nom
            } else if (error.message === 'could not read from HID device') {
                errorCallback('error', 'Lost connection to controller')
            } else {
                console.error(error.message)
            }
        })
    }

    const getActive = () => {
        return connected
    }

    const getActiveMenu = () => {
        return activeControlMode
    }

    const sleep = async (ms) => {
        return new Promise((r) => setTimeout(r, ms))
    }

    return {
        connect,
        getActive,
        getActiveMenu,
    }
}
