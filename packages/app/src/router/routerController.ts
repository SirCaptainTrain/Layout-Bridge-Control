import { Engine } from '../engine/engine'
import { EngineController } from '../engine/engineController'
import { EngineSpeedControlType } from '../engine/enginetypes'

export const Control = (engineController: EngineController) => {
    let engineQueueList: {
        engine: Engine
        whistleLastlevel?: number
        whistleLevel: number
    }[] = []

    const sleep = async (ms: number) => {
        return new Promise((r) => setTimeout(r, ms))
    }

    const controlLoop = async () => {
        let i = 0
        const engineItemList = engineQueueList
        for (const engineItem of engineItemList) {
            if (engineController.getEngine(engineItem.engine.getId()) == null) {
                return
            }
            if (
                engineItem.whistleLastlevel !== engineItem.whistleLevel ||
                engineItem.whistleLevel > 0
            ) {
                engineQueueList[i].whistleLastlevel = engineItem.whistleLevel

                const engineInfo = engineItem.engine.getEngineInfo()
                const engineInterface =
                    engineItem.engine.getEngineSerial().interface

                if (engineInterface.setHorn == null) {
                    return
                }

                if (
                    engineInfo.controlType === 'LEGACY' ||
                    engineInfo.controlType === 'MTH'
                ) {
                    engineInterface.setHorn(
                        engineInfo.controlId,
                        engineItem.whistleLevel
                    )
                }

                if (
                    (engineInfo.controlType === 'TMCC' ||
                        engineInfo.controlType === 'ERR') &&
                    engineItem.whistleLevel > 0
                ) {
                    engineInterface.setHorn(engineInfo.controlId)
                }
            } else {
                engineQueueList.shift()
            }
            i++
        }

        await sleep(50)
        await controlLoop()
    }

    const startProcessing = async () => {
        controlLoop()
    }

    const setSpeed = (engineId: string, speed: string | number) => {
        const currentEngine = getReqEngine(engineId)

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

    const haltEngine = (engineId: string) => {
        const currentEngine = getReqEngine(engineId)

        engineController.rapidStop(currentEngine)
    }

    const setTMCCWhistle = (engineId: string, active: boolean) => {
        const currentEngine = getReqEngine(engineId)
        const index = engineQueueList.findIndex(
            (engine) => engine.engine.getId() === engineId
        )
        if (index > -1) {
            engineQueueList[index].whistleLevel = active ? 1 : 0
        } else {
            engineQueueList.push({
                engine: currentEngine,
                whistleLastlevel: 1,
                whistleLevel: active ? 1 : 0,
            })
        }
    }

    const setWhistle = (engineId: string, level: number | string) => {
        const currentEngine = getReqEngine(engineId)
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
        const index = engineQueueList.findIndex(
            (engine) => engine.engine.getId() === engineId
        )
        if (index > -1) {
            engineQueueList[index].whistleLevel = level
        } else {
            engineQueueList.push({
                engine: currentEngine,
                whistleLevel: level,
            })
        }
    }

    const bellOn = (engineId: string) => {
        const currentEngine = getReqEngine(engineId)

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.bellOn == null) {
            return
        }

        engineInterface.bellOn(engineInfo.controlId)
    }

    const bellOff = (engineId: string) => {
        const currentEngine = getReqEngine(engineId)

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.bellOff == null) {
            return
        }

        engineInterface.bellOff(engineInfo.controlId)
    }

    const forwardDirection = (engineId: string) => {
        const currentEngine = getReqEngine(engineId)

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.setDirectionForward == null) {
            return
        }

        engineInterface.setDirectionForward(engineInfo.controlId)
    }

    const backwardDirection = (engineId: string) => {
        const currentEngine = getReqEngine(engineId)

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.setDirectionBackward == null) {
            return
        }

        engineInterface.setDirectionBackward(engineInfo.controlId)
    }

    const toggleDirection = (engineId: string) => {
        const currentEngine = getReqEngine(engineId)

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.toggleDirection == null) {
            return
        }

        engineInterface.toggleDirection(engineInfo.controlId)
    }

    const incrementSpeed = (engineId: string) => {
        const currentEngine = getReqEngine(engineId)

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.incrementSpeed == null) {
            return
        }

        engineInterface.incrementSpeed(engineInfo.controlId)
    }

    const decrementSpeed = (engineId: string) => {
        const currentEngine = getReqEngine(engineId)

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.decrementSpeed == null) {
            return
        }

        engineInterface.decrementSpeed(engineInfo.controlId)
    }

    const startUpFast = (engineId: string) => {
        const currentEngine = getReqEngine(engineId)

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.startUpFast == null) {
            return
        }

        engineInterface.startUpFast(engineInfo.controlId)
    }

    const shutDownFast = (engineId: string) => {
        const currentEngine = getReqEngine(engineId)

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.shutDownFast == null) {
            return
        }

        engineInterface.shutDownFast(engineInfo.controlId)
    }

    const startUpExt = () => {}

    const shutDownExt = () => {}

    const setSpeedType = (engineId: string, speedType: number) => {
        const currentEngine = getReqEngine(engineId)

        if (speedType === EngineSpeedControlType.ABS) {
            currentEngine.setSpeedControlType(EngineSpeedControlType.ABS)
        } else if (speedType === EngineSpeedControlType.REL) {
            currentEngine.setSpeedControlType(EngineSpeedControlType.REL)
        } else {
            throw new Error('Invalid speed type')
        }
    }

    const openCouplerForward = (engineId: string) => {
        const currentEngine = getReqEngine(engineId)

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.shutDownFast == null) {
            return
        }

        engineInterface.openCouplerForward(engineInfo.controlId)
    }

    const openCouplerRear = (engineId: string) => {
        const currentEngine = getReqEngine(engineId)

        const engineInfo = currentEngine.getEngineInfo()
        const engineInterface = currentEngine.getEngineSerial().interface

        if (engineInterface.shutDownFast == null) {
            return
        }

        engineInterface.openCouplerRear(engineInfo.controlId)
    }

    const getReqEngine = (engineId: string) => {
        const engine = engineController
            .getEngines()
            .find((engine) => engine.getId() === engineId)

        if (engine == null) {
            throw new Error('Invalid engineId')
        }

        return engine
    }

    return {
        startProcessing,
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
        openCouplerForward,
        openCouplerRear,
    }
}
