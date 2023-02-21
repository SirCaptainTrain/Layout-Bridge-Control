import dotenv from 'dotenv'
import { DualsenseController } from './control/dualsenseController'
import { EngineController } from './engine/engineController'
import { Router } from './router/express'
import { SerialController } from './serial/serialController'
import { SocketController } from './socket/socketController'

dotenv.config()
const APP_DEBUG = process.env.APP_DEBUG === 'true'

export type App = {
    setupApp: () => Promise<void>
    getSerialController: () => SerialController
    getSocketController: () => SocketController
    getRouter: () => Router
    getDualsenseController: () => DualsenseController
    getEngineController: () => EngineController
}

const App = (): App => {
    let engineController: EngineController = EngineController()
    let dualsenseController: DualsenseController = null
    let router: Router = null
    let socketController: SocketController = SocketController()
    let serialController: SerialController = SerialController()

    const controllerErrorCallback = (
        type: 'error' | 'fatal',
        message: string
    ) => {
        if (type === 'fatal') {
            // safe shutdown
        } else {
            dualsenseController = null
            setupController()
        }
    }

    const setupController = async () => {
        dualsenseController = DualsenseController(
            engineController,
            serialController,
            controllerErrorCallback
        )
    }

    const setupRouter = async (
        serialController: SerialController,
        engineController: EngineController,
        dualsenseController: DualsenseController
    ) => {
        router = Router(serialController, engineController, dualsenseController)
    }

    const setupSocket = () => {
        socketController.setup()
    }

    const setupSerial = async () => {
        await serialController.setupPorts()
    }

    const setupApp = async () => {
        // Start socket communication
        console.log('Setting up socket')
        await setupSocket()
        // Start controller
        console.log('Setting up controller')
        await setupController()
        // Start engine listener
        console.log('Setting up serial')
        await setupSerial()
        // Start express route
        console.log('Setting up router')
        await setupRouter(
            serialController,
            engineController,
            dualsenseController
        )

        //console.log('Available ports', serialController.getAvailablePorts())
    }

    const getEngineController = () => {
        return engineController
    }

    const getSerialController = () => {
        return serialController
    }

    const getDualsenseController = () => {
        return dualsenseController
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
        getDualsenseController,
        getSocketController,
        getRouter,
        getEngineController,
    }
}

const app = App()

app.setupApp()
    .then(() => {
        console.log('Layout Bridge Control running')
    })
    .catch((err) => {
        console.error('Failed to start app', err)
        process.exit(1)
    })
