import axios from 'axios'
import cors from 'cors'
import express from 'express'
import { v4 } from 'uuid'
import { LBCDatabase } from '../database/database'
import { Engine } from '../engine/engine'
import { EngineController } from '../engine/engineController'
import { AvailablePort, SerialController } from '../serial/serialController'
import { Control } from './routerController'
import { routerMiddleware } from './routerMiddleware'

export type Router = {}

export const Router = (
    database: LBCDatabase,
    serialController: SerialController,
    engineController: EngineController
): Router => {
    const app = express()

    const control = Control(engineController)
    control.startProcessing().then(() => {
        console.log('Router middleware controller started')
    })

    app.use(cors({ origin: true }))

    app.use(express.json())

    app.get('/engine/', async (_req, res) => {
        const dbEngines = await database.getEngineList()
        const engines = engineController.getEngines()
        const ports = serialController.getActivePorts()
        for (const dbEngine of dbEngines) {
            let found = false
            for (const engine of engines) {
                if (engine.getId() === dbEngine.id) {
                    found = true
                }
            }
            if (!found) {
                const port = ports.find(
                    (port) =>
                        port.serial.serialNumber ===
                        dbEngine.serialInterfaceSerialNumber
                )
                if (port == null) {
                    continue
                }
                engineController.addEngine(port, { ...dbEngine }, false)
            }
        }
        res.send(engineController.getEngines().map(mapEngine))
    })

    app.post('/engine/add', async (req, res) => {
        if (
            req.body.engineId == null ||
            req.body.com == null ||
            req.body.controlType == null ||
            req.body.brand == null
        ) {
            return res.sendStatus(400)
        }

        const controlPort = serialController
            .getActivePorts()
            .find((activePort) => activePort.serial.port.path === req.body.com)
        if (controlPort == null) {
            return res.sendStatus(400)
        }

        const newEngine = await engineController.addEngine(controlPort, {
            id: v4(),
            name: req.body.name,
            brand: req.body.brand,
            controlType: req.body.controlType,
            controlId: req.body.engineId,
        })

        if (newEngine == null) {
            return res.sendStatus(500)
        }

        res.send({ ...newEngine.getEngineInfo(), path: req.body.com })
    })

    app.delete('/engine/:id', async (req, res) => {
        const engine = engineController.getEngine(req.params.id)
        if (engine == null) {
            return res.sendStatus(400)
        }
        await engineController.removeEngine(engine.getId())
        res.sendStatus(200)
    })

    app.get('/engine/:id', (req, res) => {
        const engine = engineController.getEngine(req.params.id)
        if (engine == null) {
            return res.sendStatus(400)
        }
        res.send(mapEngine(engine))
    })

    app.post(
        '/engine/control',
        (req, res, next) => {
            res.locals.control = control
            next()
        },
        routerMiddleware
    )

    app.get('/api/lionel/:engineModel', async (req, res) => {
        const engineModel = req.params.engineModel
        const axiosResponse = await axios.get(
            `https://www.lionel.com/search?auto=${engineModel}&format=json`
        )

        if (
            axiosResponse.data == null ||
            axiosResponse.data[0] == null ||
            axiosResponse.data[0].length === 0 ||
            axiosResponse.data[0].products == null ||
            axiosResponse.data[0].products.length === 0
        ) {
            return res.sendStatus(204)
        }

        res.send(axiosResponse.data[0].products)
    })

    app.get('/serial/available', (_req, res) => {
        res.send(
            serialController.getAvailablePorts().map((port: AvailablePort) => {
                return {
                    name: port.name,
                    path: port.port.path,
                    serialNumber: port.serialNumber,
                }
            })
        )
    })

    app.post('/serial/available', async (_req, res) => {
        await serialController.setupPorts()
        res.sendStatus(200)
    })

    app.get('/serial/active', (_req, res) => {
        const active = serialController.getActivePorts()
        res.send(
            active.map((activePort) => {
                return {
                    name: activePort.serial.serialNumber,
                    serialNumber: activePort.serial.serialNumber,
                    path: activePort.serial.port.path,
                    type: activePort.type,
                }
            })
        )
    })

    app.post('/serial/toggle', (req, res) => {
        console.log('body', req.body)
        if (req.body?.serialNumber == null) {
            console.log('MSN')
            return res.sendStatus(400)
        }

        const port = serialController
            .getAvailablePorts()
            .find((port) => port.serialNumber === req.body.serialNumber)

        if (port == null) {
            console.log('NUP')
            return res.sendStatus(400)
        }

        const activePort = serialController
            .getActivePorts()
            .find(
                (activePort) =>
                    activePort.serial.serialNumber === req.body.serialNumber
            )

        if (activePort) {
            serialController.closeSerialPort({ port: activePort })
        } else {
            if (req.body?.controlType == null) {
                console.log('MSC')
                return res.sendStatus(400)
            }
            serialController.openPort(port, req.body.controlType)
        }
        res.sendStatus(200)
    })

    app.listen('3000', () => {
        console.log('Router listening on 3000')
    })

    return {}
}

const mapEngine = (engine: Engine) => {
    const engineInfo: any = engine.getEngineInfo()
    engineInfo.name = engine.getName()
    engineInfo.currentSpeed = engine.getSpeed()
    engineInfo.maxSpeed = engine.getMaxSpeed()
    engineInfo.speedControlType = engine.getSpeedControlType()
    engineInfo.path = engine.getEngineSerial().serial.port.path
    return engineInfo
}
