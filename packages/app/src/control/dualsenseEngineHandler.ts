import { Engine } from '../engine/engine'
import { EngineController } from '../engine/engineController'

export const DualsenseEngineHandler = (engineController: EngineController) => {
    let activeEngine: Engine | undefined = null
    let leftTriggerActive = false
    let rightTriggerActive = false

    let rapidStopLastPress = null

    let analogRightPositiveActive = false
    let analogRightNegativeActive = true
    let handledAnalogRightNegative = true
    let analogRightLastUpdate = Date.now()
    let analogRightNegativeValue = null

    const handleRapidStop = () => {
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
            activeEngine.setRapidStop(true)
            engineController.rapidStop(activeEngine)
        }

        rapidStopLastPress = now
    }

    const engineControlLoop = async () => {
        if (activeEngine == null) {
            return
        }

        // Don't process further commands until rapid stop complete
        if (activeEngine.getRapidStop()) {
            return
        }

        const activeEngineInfo = activeEngine.getEngineInfo()
        const serial = activeEngine.getEngineSerial()
        const serialInterface = serial.interface

        let currentSpeed = activeEngine.getSpeed()

        // Handle bumper active throttle changes
        if (leftTriggerActive) {
            if (activeEngine.getSpeed() > 0) {
                activeEngine.decrementSpeed()
            }
            activeEngine.decrementSpeed()
        } else if (rightTriggerActive) {
            if (activeEngine.getSpeed() < activeEngine.getMaxSpeed()) {
                activeEngine.incrementSpeed()
            }
        }

        if (
            handledAnalogRightNegative === false &&
            analogRightNegativeActive === false
        ) {
            if (serial.type === 'LEGACY') {
                serialInterface.setHorn(activeEngineInfo.controlId, 0)
            }
            handledAnalogRightNegative = true
        }

        if (analogRightNegativeActive && analogRightNegativeValue < -0.3) {
            if (serial.type === 'TMCC') {
                serialInterface.setHorn(activeEngineInfo.controlId)
            } else if (serial.type === 'LEGACY') {
                const absValue = Math.abs(analogRightNegativeValue)
                const valueOfHundred = absValue * 100
                const dividend25 = valueOfHundred / 25
                const roundedValue = Math.ceil(dividend25)
                console.log(absValue, valueOfHundred, dividend25, roundedValue)
                const quillingHornLevel =
                    valueOfHundred === 100 ? 15 : roundedValue * 4
                serialInterface.setHorn(
                    activeEngineInfo.controlId,
                    quillingHornLevel
                )
            }
        }

        const newCurrentSpeed = activeEngine.getSpeed()

        if (currentSpeed !== newCurrentSpeed) {
            serialInterface.setSpeed(
                activeEngineInfo.controlId,
                activeEngine.getSpeed()
            )
        }
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

            activeEngine.decrementSpeed()
            const serialInterface = activeEngine.getEngineSerial().interface
            serialInterface.setSpeed(
                activeEngine.getEngineInfo().controlId,
                activeEngine.getSpeed()
            )
        }
    }

    const handleRightBumper = async (active: boolean) => {
        if (activeEngine == null) {
            return
        }
        if (active) {
            activeEngine.incrementSpeed()
            const serialInterface = activeEngine.getEngineSerial().interface
            serialInterface.setSpeed(
                activeEngine.getEngineInfo().controlId,
                activeEngine.getSpeed()
            )
        }
    }

    const handleDpadLeft = () => {
        const engines = engineController.getEngines()

        if (engines.length === 0) {
            activeEngine = null
            return
        }

        if (!validateActiveEngine()) {
            return
        }

        const activeIndex = getActiveIndex()
        if (engines[activeIndex - 1] == null) {
            activeEngine = engines[engines.length - 1]
            return
        }
        activeEngine = engines[activeIndex - 1]
    }

    const handleDpadRight = () => {
        const engines = engineController.getEngines()

        if (engines.length === 0) {
            activeEngine = null
            return
        }

        if (!validateActiveEngine()) {
            return
        }

        const activeIndex = getActiveIndex()
        if (engines[activeIndex + 1] == null) {
            activeEngine = engines[0]
            return
        }
        activeEngine = engines[activeIndex + 1]
    }

    const handleTriangle = () => {
        if (activeEngine == null) {
            return
        }

        const serialInterface = activeEngine.getEngineSerial().interface
        serialInterface.toggleDirection(activeEngine.getEngineInfo().controlId)
        activeEngine.setSpeed(0)
    }

    const handleSquare = () => {
        if (activeEngine == null) {
            return
        }

        const engineSerial = activeEngine.getEngineSerial()
        console.log(engineSerial.type)
        if (engineSerial.type === 'TMCC') {
            engineSerial.interface.ringBell(
                activeEngine.getEngineInfo().controlId
            )
        } else if (engineSerial.type === 'LEGACY') {
            const bellStatus = activeEngine.getBell()
            if (bellStatus) {
                engineSerial.interface.bellOff(
                    activeEngine.getEngineInfo().controlId
                )
                activeEngine.setBell(false)
            } else {
                engineSerial.interface.bellOn(
                    activeEngine.getEngineInfo().controlId
                )
                activeEngine.setBell(true)
            }
        }
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

    const handleCircle = (active: boolean) => {
        if (activeEngine == null) {
            return
        }

        if (active === false) {
            return
        }

        const serialInterface = activeEngine.getEngineSerial().interface
        serialInterface.openCouplerForward(
            activeEngine.getEngineInfo().controlId
        )
    }

    const handleCross = (active: boolean) => {}

    const validateActiveEngine = () => {
        console.log('active', activeEngine?.getId())
        if (activeEngine === null) {
            if (engineController.getEngines().length === 0) {
                return false
            }
            activeEngine = engineController.getEngines()[0]
            return false
        }
        if (engineController.getEngines().length === 1) {
            if (
                activeEngine.getId() !==
                engineController.getEngines()[0].getId()
            ) {
                activeEngine = engineController.getEngines()[0]
                return false
            }
        }
        return true
    }

    const setActiveEngine = (engine: Engine) => {
        activeEngine = engine
    }

    const getActiveIndex = () => {
        if (activeEngine == null) {
            activeEngine = engineController.getEngines()[0]
            getActiveIndex()
        }

        const activeIndex = engineController
            .getEngines()
            .findIndex((engine) => engine.getId() === activeEngine.getId())

        if (activeIndex === -1) {
            throw new Error('Valid index is invalid - fatal error')
        }

        return activeIndex
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
