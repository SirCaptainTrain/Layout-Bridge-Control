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
            if (
                engineInfo.controlType === 'LEGACY' ||
                engineInfo.controlType === 'MTH'
            ) {
                engineInterface.setHorn(engineInfo.controlId, whistleLevel)
            } else {
                if (whistleLevel === 1) {
                    engineInterface.setHorn(engineInfo.controlId)
                }
            }
        }

        await sleep(50)
        await controlLoop()
    }

    const startProcessing = async () => {
        controlLoop()
    }
    const setWhistle = (level: number) => {
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

    return {
        startProcessing,
        setWhistle,
        bellOn,
        bellOff,
        setEngine,
        toggleDirection,
    }
}
