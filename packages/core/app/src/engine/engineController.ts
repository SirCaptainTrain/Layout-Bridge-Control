import { Engine } from './engine'
import { EngineInfo } from './enginetypes'
import dotenv from 'dotenv'
import { ControlPort } from '../serial/serialController'
import { LBCDatabase } from '../database/database'

dotenv.config()
const APP_DEBUG = process.env.APP_DEBUG === 'true'

export type EngineController = {
    rapidStop: (engine: Engine) => void
    getEngine: (engineId: string) => Engine | null
    getEngines: () => Engine[]
    addEngine: (
        controlPort: ControlPort,
        engineInfo: EngineInfo,
        dbInsert?: boolean
    ) => Promise<Engine>
    updateEngine: (engineId: string, engineInfo: EngineInfo) => void
    removeEngine: (engineId: string) => Promise<void>
}

export const EngineController = (database: LBCDatabase): EngineController => {
    let engines: Engine[] = []

    const rapidStop = (engine: Engine) => {
        const engineId = engine.getId()
        const engineDeviceId = engine.getEngineInfo().controlId
        console.log('E-STOP', engineId, engineDeviceId)
        const engineSerialInterface = engine.getEngineSerial().interface
        const initialSpeed = engine.getSpeed()
        const timeoutRapidStop = () => {
            setTimeout(async () => {
                if (engine.getSpeed() === 0) {
                    // Send 1 final time
                    engineSerialInterface.setSpeed(engineDeviceId, 0)
                    engine.setRapidStop(false)
                    return
                }
                // Scaling slow downof engines depending on initial speed at halt call
                if (initialSpeed > 100) {
                    engine.setSpeed(engine.getSpeed() - 20)
                } else if (initialSpeed > 75) {
                    engine.setSpeed(engine.getSpeed() - 10)
                } else if (initialSpeed > 40) {
                    engine.setSpeed(engine.getSpeed() - 8)
                } else if (initialSpeed > 25) {
                    engine.setSpeed(engine.getSpeed() - 5)
                } else if (initialSpeed > 12) {
                    engine.setSpeed(engine.getSpeed() - 3)
                } else {
                    engine.decrementSpeed()
                }
                engineSerialInterface.setSpeed(
                    engineDeviceId,
                    engine.getSpeed()
                )
                timeoutRapidStop()
            }, 100)
        }
        timeoutRapidStop()
    }

    const getEngine = (engineId: string): Engine | null => {
        return engines.find((engine) => engine.getId() === engineId)
    }

    const getEngines = () => {
        return engines
    }

    const addEngine = async (
        controlPort: ControlPort,
        engineInfo: EngineInfo,
        dbInsert: boolean = true
    ) => {
        const engine = Engine(controlPort, engineInfo)
        engines.push(engine)
        if (dbInsert) {
            const engines = await database.getEngineList()
            if (!engines.find((dbEngine) => dbEngine.id === engine.getId())) {
                console.log(`Adding ${engine.getId()} to database`)
                await database.addEngine(engine)
            }
        }
        return engine
    }

    const removeEngine = async (engineId: string) => {
        const engineIndex = engines.findIndex(
            (engine) => engine.getId() === engineId
        )
        if (engineIndex === -1) {
            return
        }
        engines = engines.filter((engine) => engine.getId() !== engineId)
        const dbEngines = await database.getEngineList()
        if (dbEngines.find((dbEngine) => dbEngine.id === engineId)) {
            await database.removeEngine(engineId)
        }
    }

    const updateEngine = (engineId: string, engineInfo: EngineInfo) => {
        const engineIndex = engines.findIndex(
            (engine) => engine.getId() === engineId
        )
        if (engineIndex === -1) {
            throw new Error('Invalid Engine to update')
        }
        engines[engineIndex].setEngineInfo(engineInfo)
    }

    return {
        rapidStop,
        getEngine,
        getEngines,
        addEngine,
        updateEngine,
        removeEngine,
    }
}
