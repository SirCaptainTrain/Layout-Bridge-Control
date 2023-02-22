import { Engine } from '../engine/engine'
import { EngineController } from '../engine/engineController'
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
            //console.log('level', whistleLevel)
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

        engineInterface.bellOn(engineInfo.controlId)
    }

    const bellOff = () => {
        if (currentEngine == null) {
            return
        }

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        engineInterface.bellOff(engineInfo.controlId)
    }

    const setEngine = (engineId: string) => {
        const engine = engineController.getEngine(engineId)
        if (engine == null) {
            throw new Error('Invalid Engine')
        }
        currentEngine = engine
    }

    const toggleDirection = () => {
        if (currentEngine == null) {
            return
        }

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        engineInterface.toggleDirection(engineInfo.controlId)
    }

    const incrementSpeed = () => {
        if (currentEngine == null) {
            return
        }

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        engineInterface.incrementSpeed(engineInfo.controlId)
    }

    const decrementSpeed = () => {
        if (currentEngine == null) {
            return
        }

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        engineInterface.decrementSpeed(engineInfo.controlId)
    }

    const startUpFast = () => {
        if (currentEngine == null) {
            return
        }

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        engineInterface.startUpFast(engineInfo.controlId)
    }

    const shutDownFast = () => {
        if (currentEngine == null) {
            return
        }

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        engineInterface.shutDownFast(engineInfo.controlId)
    }

    const startUpExt = () => {}

    const shutDownExt = () => {}

    return {
        startProcessing,
        setWhistle,
        setTMCCWhistle,
        bellOn,
        bellOff,
        setEngine,
        toggleDirection,
        incrementSpeed,
        decrementSpeed,
        startUpFast,
        shutDownFast,
    }
}
