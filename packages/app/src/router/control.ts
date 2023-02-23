import { Engine } from '../engine/engine'
import { EngineController } from '../engine/engineController'
import { EngineSpeedControlType } from '../engine/enginetypes'
import { SerialController } from '../serial/serialController'

export const Control = (
    engineController: EngineController,
    serialController: SerialController
) => {
    let currentEngine: Engine
    let lastWhistleProcessLevel = 0
    let whistleLevel = 0
    let whistleTMCC = false

    const sleep = async (ms) => {
        return new Promise((r) => setTimeout(r, ms))
    }

    const controlLoop = async () => {
        if (lastWhistleProcessLevel !== whistleLevel || whistleLevel > 0) {
            lastWhistleProcessLevel = whistleLevel

            if (currentEngine == null) {
                return
            }

            const engineInfo = currentEngine.getEngineInfo()
            const engineInterface = currentEngine.getEngineSerial().interface

            if (engineInterface.setHorn == null) {
                return
            }

            if (
                engineInfo.controlType === 'LEGACY' ||
                engineInfo.controlType === 'MTH'
            ) {
                engineInterface.setHorn(engineInfo.controlId, whistleLevel)
            }

            if (
                (engineInfo.controlType === 'TMCC' ||
                    engineInfo.controlType === 'ERR') &&
                whistleTMCC
            ) {
                engineInterface.setHorn(engineInfo.controlId)
            }
        }

        await sleep(50)
        await controlLoop()
    }

    const startProcessing = async () => {
        controlLoop()
    }

    const setEngine = (engineId: string) => {
        const engine = engineController.getEngine(engineId)
        if (engine == null) {
            throw new Error('Invalid Engine')
        }
        currentEngine = engine
    }

    const setSpeed = (speed: string | number) => {
        if (currentEngine == null) {
            return
        }

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.setSpeed == null) {
            return
        }

        if (typeof speed === 'string') {
            speed = parseInt(speed)
        }

        if (isNaN(speed)) {
            throw new Error('Invalid speed')
        }
        engineController.getEngine(engineInfo.id).setSpeed(speed)
        engineInterface.setSpeed(engineInfo.controlId, speed)
    }

    const haltEngine = () => {
        if (currentEngine == null) {
            return
        }
        engineController.rapidStop(currentEngine)
    }

    const setTMCCWhistle = (active: boolean) => {
        whistleTMCC = active
    }

    const setWhistle = (level: number | string) => {
        if (typeof level === 'string') {
            level = parseInt(level)
        }
        if (isNaN(level)) {
            throw new Error(`Invalid level: ${level}`)
        }
        //console.log('whistle level', level)

        if (level < 0) {
            level = 0
        } else if (level > currentEngine.getWhistleSteps()) {
            level = currentEngine.getWhistleSteps()
        }
        whistleLevel = level
    }

    const bellOn = () => {
        if (currentEngine == null) {
            return
        }

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.bellOn == null) {
            return
        }

        engineInterface.bellOn(engineInfo.controlId)
    }

    const bellOff = () => {
        if (currentEngine == null) {
            return
        }

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.bellOff == null) {
            return
        }

        engineInterface.bellOff(engineInfo.controlId)
    }

    const forwardDirection = () => {
        if (currentEngine == null) {
            return
        }

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.setDirectionForward == null) {
            return
        }

        engineInterface.setDirectionForward(engineInfo.controlId)
    }

    const backwardDirection = () => {
        if (currentEngine == null) {
            return
        }

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.setDirectionBackward == null) {
            return
        }

        engineInterface.setDirectionBackward(engineInfo.controlId)
    }

    const toggleDirection = () => {
        if (currentEngine == null) {
            return
        }

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.toggleDirection == null) {
            return
        }

        engineInterface.toggleDirection(engineInfo.controlId)
    }

    const incrementSpeed = () => {
        if (currentEngine == null) {
            return
        }

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.incrementSpeed == null) {
            return
        }

        engineInterface.incrementSpeed(engineInfo.controlId)
    }

    const decrementSpeed = () => {
        if (currentEngine == null) {
            return
        }

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.decrementSpeed == null) {
            return
        }

        engineInterface.decrementSpeed(engineInfo.controlId)
    }

    const startUpFast = () => {
        if (currentEngine == null) {
            return
        }

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.startUpFast == null) {
            return
        }

        engineInterface.startUpFast(engineInfo.controlId)
    }

    const shutDownFast = () => {
        if (currentEngine == null) {
            return
        }

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.shutDownFast == null) {
            return
        }

        engineInterface.shutDownFast(engineInfo.controlId)
    }

    const startUpExt = () => {}

    const shutDownExt = () => {}

    const setSpeedType = (speedType: number) => {
        if (currentEngine == null) {
            return
        }

        if (speedType === EngineSpeedControlType.ABS) {
            currentEngine.setSpeedControlType(EngineSpeedControlType.ABS)
        } else if (speedType === EngineSpeedControlType.REL) {
            currentEngine.setSpeedControlType(EngineSpeedControlType.REL)
        } else {
            throw new Error('Invalid speed type')
        }
    }

    return {
        startProcessing,
        setEngine,
        setSpeed,
        haltEngine,
        setWhistle,
        setTMCCWhistle,
        bellOn,
        bellOff,
        forwardDirection,
        backwardDirection,
        toggleDirection,
        incrementSpeed,
        decrementSpeed,
        startUpFast,
        shutDownFast,
        startUpExt,
        shutDownExt,
        setSpeedType,
    }
}
