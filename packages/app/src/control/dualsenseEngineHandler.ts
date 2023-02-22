import { Engine } from '../engine/engine'
import { EngineController } from '../engine/engineController'
import { SerialController } from '../serial/serialController'

export const DualsenseEngineHandler = (
    engineController: EngineController,
    serialController: SerialController
) => {
    let leftTriggerActive = false
    let rightTriggerActive = false

    let rapidStopLastPress = null

    let analogRightPositiveActive = false
    let analogRightNegativeActive = true
    let handledAnalogRightNegative = true
    let analogRightLastUpdate = Date.now()
    let analogRightNegativeValue = null

    const handleRapidStop = () => {
        const activeEngine = engineController.getActiveEngine()
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
        const activeEngine = engineController.getActiveEngine()
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
        const activeEngine = engineController.getActiveEngine()
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
        const activeEngine = engineController.getActiveEngine()
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
            engineController.unsetActiveEngine()
            return
        }

        if (!validateActiveEngine()) {
            return
        }

        const activeIndex = getActiveIndex()
        if (engines[activeIndex - 1] == null) {
            engineController.setActiveEngine(
                engines[engines.length - 1].getId()
            )
            return
        }
        engineController.setActiveEngine(engines[activeIndex - 1].getId())
    }

    const handleDpadRight = () => {
        const engines = engineController.getEngines()

        if (engines.length === 0) {
            engineController.unsetActiveEngine()
            return
        }

        if (!validateActiveEngine()) {
            return
        }

        const activeIndex = getActiveIndex()
        if (engines[activeIndex + 1] == null) {
            engineController.setActiveEngine(engines[0].getId())
            return
        }
        engineController.setActiveEngine(engines[activeIndex + 1].getId())
    }

    const handleTriangle = () => {
        const activeEngine = engineController.getActiveEngine()
        if (engineController.getActiveEngine() == null) {
            return
        }

        const serialInterface = activeEngine.getEngineSerial().interface
        serialInterface.toggleDirection(activeEngine.getEngineInfo().controlId)
        activeEngine.setSpeed(0)
    }

    const handleSquare = () => {
        const activeEngine = engineController.getActiveEngine()
        if (engineController.getActiveEngine() == null) {
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
        if (engineController.getActiveEngine() == null) {
            return
        }
        if (analogRightPositiveActive) {
            analogRightPositiveActive = false
        } else {
            analogRightPositiveActive = true
        }
    }

    const handleAnalogRightNegative = async (axisValue: number) => {
        if (engineController.getActiveEngine() == null) {
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
        const activeEngine = engineController.getActiveEngine()
        if (engineController.getActiveEngine() == null) {
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
        console.log('active', engineController.getActiveEngine()?.getId())
        if (engineController.getActiveEngine() === null) {
            if (engineController.getEngines().length === 0) {
                return false
            }
            engineController.setActiveEngine(
                engineController.getEngines()[0].getId()
            )
            return false
        }
        if (engineController.getEngines().length === 1) {
            if (
                engineController.getActiveEngine().getId() !==
                engineController.getEngines()[0].getId()
            ) {
                engineController.setActiveEngine(
                    engineController.getEngines()[0].getId()
                )
                return false
            }
        }
        return true
    }

    const getActiveIndex = () => {
        const activeEngine = engineController.getActiveEngine()
        if (activeEngine == null) {
            engineController.setActiveEngine(
                engineController.getEngines()[0].getId()
            )
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
    }
}
