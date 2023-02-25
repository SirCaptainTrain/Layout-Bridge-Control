import dotenv from 'dotenv'
import { serialize } from 'v8'
import { LBCDatabase } from './database/database'
import { EngineController } from './engine/engineController'
import { Router } from './router/router'
import { ControlPort, SerialController } from './serial/serialController'
import { SocketController } from './socket/socketController'

console.clear()
console.log('LBC App Starting')

dotenv.config()
const APP_DEBUG = process.env.APP_DEBUG === 'true'

export type App = {
    setupApp: () => Promise<void>
    getSerialController: () => SerialController
    getSocketController: () => SocketController
    getRouter: () => Router
    getEngineController: () => EngineController
}

const App = async (): Promise<App> => {
    let database: LBCDatabase = await LBCDatabase()
    let engineController: EngineController = EngineController(database)
    let router: Router = null
    let socketController: SocketController = SocketController()
    let serialController: SerialController

    const setupRouter = async (
        serialController: SerialController,
        engineController: EngineController
    ) => {
        router = Router(database, serialController, engineController)
    }

    const setupSocket = () => {
        socketController.setup()
    }

    const setupSerial = async () => {
        serialController = SerialController(serialCallback, database)
        await serialController.setupPorts()
    }

    const serialCallback = async (controlPort: ControlPort) => {
        console.log('Updating engine interfaces...')
        const enginesOnOldPort = engineController
            .getEngines()
            .filter(
                (engine) =>
                    engine.getEngineSerial().serial.serialNumber ===
                    controlPort.serial.serialNumber
            )
        enginesOnOldPort.forEach((engine) => {
            engine
                .getEngineSerial()
                .interface.setSerialPort(controlPort.serial.port)
        })
    }

    const setupApp = async () => {
        await database.initializeDb()
        const engines = await database.getEngineList()
        const serials = await database.getSerialList()
        // console.log('engines', engines, 'serials', serials)
        // Start socket communication
        console.log('Setting up socket')
        await setupSocket()
        // Start engine listener
        console.log('Setting up serial')
        await setupSerial()

        const serialList = serialController.getAvailablePorts()
        for (const serial of serials) {
            const port = serialList.find(
                (serialListItem) =>
                    serialListItem.serialNumber === serial.serialNumber
            )
            if (port) {
                console.log(
                    'Initiating serial port',
                    serial.serialNumber,
                    serial.controlType
                )
                await serialController.openPort(port, serial.controlType)
            }
        }
        await sleep(1000)
        const activePorts = serialController.getActivePorts()
        for (const engine of engines) {
            const port = activePorts.find(
                (port) =>
                    port.serial.serialNumber ===
                    engine.serialInterfaceSerialNumber
            )
            if (port) {
                console.log(
                    'Initiating engine',
                    engine.id,
                    engine.controlId,
                    engine.controlType
                )
                engineController.addEngine(
                    port,
                    {
                        id: engine.id,
                        name: engine.name,
                        brand: engine.brand,
                        controlId: engine.controlId,
                        controlType: engine.controlType,
                    },
                    false
                )
            }
        }
        // Start express route
        console.log('Setting up router')
        await setupRouter(serialController, engineController)

        //console.log('Available ports', serialController.getAvailablePorts())
    }

    const getEngineController = () => {
        return engineController
    }

    const getSerialController = () => {
        return serialController
    }

    const getSocketController = () => {
        return socketController
    }

    const getRouter = () => {
        return router
    }

    return {
        setupApp,
        getSerialController,
        getSocketController,
        getRouter,
        getEngineController,
    }
}

const app = App()

app.then(async (app) => {
    try {
        await app.setupApp()
        console.log('Layout Bridge Control running')
    } catch (err) {
        console.error('Failed to start app', err)
        process.exit(1)
    }
})

const sleep = async (ms) => {
    return new Promise((r) => setTimeout(r, ms))
}
