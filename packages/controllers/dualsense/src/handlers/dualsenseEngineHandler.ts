import { API } from '../api'
import { Engine } from '../types'

export const DualsenseEngineHandler = (api: API) => {
    let activeEngine: Engine = null
    let leftTriggerActive = false
    let rightTriggerActive = false

    let rapidStopLastPress = null

    let analogRightPositiveActive = false
    let analogRightNegativeActive = true
    let handledAnalogRightNegative = true
    let analogRightLastUpdate = Date.now()
    let analogRightNegativeValue = null

    const handleRapidStop = async () => {
        if (activeEngine == null) {
            return
        }
        if (rapidStopLastPress == null) {
            rapidStopLastPress = Date.now()
            return
        }

        const now = Date.now()
        //console.log(now - rapidStopLastPress)
        if (now - rapidStopLastPress < 200) {
            await api.controlEngine(activeEngine.id, { type: 'halt' })
        }

        rapidStopLastPress = now
    }

    const engineControlLoop = async () => {
        if (activeEngine == null) {
            return
        }

        const oldSpeed = activeEngine.currentSpeed
        let newSpeed = activeEngine.currentSpeed
        // Handle bumper active throttle changes
        if (leftTriggerActive) {
            newSpeed--
        } else if (rightTriggerActive) {
            if (activeEngine.currentSpeed < activeEngine.maxSpeed) {
                newSpeed++
            }
        }

        if (oldSpeed !== newSpeed) {
            await api.controlEngine(activeEngine.id, {
                type: 'setSpeed',
                speed: newSpeed,
            })
        }

        if (
            handledAnalogRightNegative === false &&
            analogRightNegativeActive === false
        ) {
            if (activeEngine.controlType === 'LEGACY') {
                await api.controlEngine(activeEngine.id, {
                    type: 'whistle',
                    whistleLevel: 0,
                })
            }
            handledAnalogRightNegative = true
        }

        if (analogRightNegativeActive && analogRightNegativeValue < -0.3) {
            if (activeEngine.controlType === 'TMCC') {
                await api.controlEngine(activeEngine.id, {
                    type: 'tmccWhistle',
                    whistlelevel: 1,
                })
            } else if (activeEngine.controlType === 'LEGACY') {
                const absValue = Math.abs(analogRightNegativeValue)
                const valueOfHundred = absValue * 100
                const dividend25 = valueOfHundred / 25
                const roundedValue = Math.ceil(dividend25)
                //console.log(absValue, valueOfHundred, dividend25, roundedValue)
                const quillingHornLevel =
                    valueOfHundred === 100 ? 15 : roundedValue * 4
                await api.controlEngine(activeEngine.id, {
                    type: 'whistle',
                    whistleLevel: quillingHornLevel,
                })
            }
        }

        activeEngine = await api.getEngine(activeEngine.id)
    }

    const handleLeftTrigger = (active: boolean) => {
        leftTriggerActive = active
    }

    const handleRightTrigger = (active: boolean) => {
        rightTriggerActive = active
    }

    const handleLeftBumper = async (active: boolean) => {
        if (activeEngine == null) {
            return
        }
        if (active) {
            handleRapidStop()

            const currentSpeed = activeEngine.currentSpeed
            await api.controlEngine(activeEngine.id, {
                type: 'setSpeed',
                speed: currentSpeed - 1,
            })
            activeEngine = await api.getEngine(activeEngine.id)
        }
    }

    const handleRightBumper = async (active: boolean) => {
        if (activeEngine == null) {
            return
        }
        if (active) {
            const currentSpeed = activeEngine.currentSpeed
            await api.controlEngine(activeEngine.id, {
                type: 'setSpeed',
                speed: currentSpeed + 1,
            })
            activeEngine = await api.getEngine(activeEngine.id)
        }
    }

    const handleDpadLeft = async () => {
        const engines = await api.getEngines()

        if (engines.length === 0) {
            activeEngine = null
            return
        }

        if (activeEngine == null && engines.length > 0) {
            activeEngine = engines[0]
        }

        const activeIndex = engines.findIndex(
            (engine) => engine.id === activeEngine.id
        )

        if (activeIndex === -1) {
            throw new Error('Mismatch between controller and active engine')
        }

        if (engines[activeIndex - 1] == null) {
            activeEngine = engines[engines.length - 1]
        } else {
            activeEngine = engines[activeIndex - 1]
        }
        activeEngine = await api.getEngine(activeEngine.id)
        console.log('Engine Switch:', activeEngine.id)
    }

    const handleDpadRight = async () => {
        const engines = await api.getEngines()
        //console.log(engines)

        if (engines.length === 0) {
            activeEngine = null
            return
        }

        if (activeEngine == null && engines.length > 0) {
            activeEngine = engines[0]
        }

        const activeIndex = engines.findIndex(
            (engine) => engine.id === activeEngine.id
        )

        if (activeIndex === -1) {
            throw new Error('Mismatch between controller and active engine')
        }

        if (engines[activeIndex + 1] == null) {
            activeEngine = engines[0]
        } else {
            activeEngine = engines[activeIndex + 1]
        }
        activeEngine = await api.getEngine(activeEngine.id)
        console.log('Engine Switch:', activeEngine.id)
    }

    const handleAnalogRightPositive = async (axisValue: number) => {
        if (activeEngine == null) {
            return
        }
        if (analogRightPositiveActive) {
            analogRightPositiveActive = false
        } else {
            analogRightPositiveActive = true
        }
    }

    const handleAnalogRightNegative = async (axisValue: number) => {
        if (activeEngine == null) {
            return
        }
        if (analogRightNegativeActive && axisValue > -0.15) {
            analogRightNegativeValue = 0
            analogRightNegativeActive = false
        } else if (analogRightNegativeActive === false && axisValue < -0.15) {
            analogRightNegativeValue = axisValue
            analogRightNegativeActive = true
            handledAnalogRightNegative = false
        } else if (analogRightNegativeActive && axisValue < -0.15) {
            const lastUpdate = analogRightLastUpdate
            handledAnalogRightNegative = false
            analogRightLastUpdate = Date.now()
            const now = Date.now()
            if (
                axisValue > analogRightNegativeValue &&
                now - lastUpdate < 400
            ) {
                return
            }
            analogRightNegativeValue = axisValue
        }
    }

    const handleTriangle = async (active: boolean) => {
        if (activeEngine == null) {
            return
        }

        if (active === false) {
            return
        }

        await api.controlEngine(activeEngine.id, { type: 'toggleDirection' })
    }

    const handleSquare = async (active: boolean) => {
        if (activeEngine == null) {
            return
        }

        if (active === false) {
            return
        }

        await api.controlEngine(activeEngine.id, { type: 'couplerFront' })
    }

    const handleCircle = async (active: boolean) => {
        if (activeEngine == null) {
            return
        }

        if (active === false) {
            return
        }

        await api.controlEngine(activeEngine.id, { type: 'couplerRear' })
    }

    const handleCross = async (active: boolean) => {
        if (activeEngine == null) {
            return
        }

        if (active === false) {
            return
        }

        if (activeEngine.controlType === 'TMCC') {
            // Fix
        } else if (activeEngine.controlType === 'LEGACY') {
            await api.controlEngine(activeEngine.id, { type: 'bellToggle' })
        }
    }

    const setActiveEngine = (engine: Engine) => {
        activeEngine = engine
    }

    return {
        handleLeftTrigger,
        handleRightTrigger,
        handleLeftBumper,
        handleRightBumper,
        handleDpadLeft,
        handleDpadRight,
        engineControlLoop,
        handleTriangle,
        handleSquare,
        handleCircle,
        handleCross,
        handleAnalogRightPositive,
        handleAnalogRightNegative,
        setActiveEngine,
    }
}
//
