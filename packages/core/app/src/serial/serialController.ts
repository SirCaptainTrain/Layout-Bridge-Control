import { SerialPort } from 'serialport'
import { v4 } from 'uuid'
import dotenv from 'dotenv'
import { SerialControlInterface } from './serialTypes'
import { TMCCSerialInterface } from './tmcc/tmccSerialInterface'
import { LegacySerialInterface } from './legacy/legacySerialInterface'
import { PortInfo } from '@serialport/bindings-interface'
import { LBCDatabase } from '../database/database'

dotenv.config()
const SERIAL_DEBUG = process.env.SERIAL_DEBUG === 'true'

export type ControlType = 'TMCC' | 'LEGACY' | 'MTH' | 'ERR'

export type AvailablePort = {
    name: string
    serialNumber: string
    port: PortInfo
}

export type FriendlySerialPort = {
    name: string
    serialNumber: string
    port: SerialPort
}

export type ControlPort = {
    id: string
    serial: FriendlySerialPort
    interface: SerialControlInterface
    type: ControlType
}

export type SerialController = {
    setupPorts: () => Promise<void>
    getAvailablePorts: () => AvailablePort[]
    getActivePorts: () => ControlPort[]
    openPort: (
        port: AvailablePort,
        controlType: ControlType,
        baudRate?: number
    ) => Promise<void>
    closeSerialPort: (options: ClosePortOptions) => Promise<void>
    getSerialPortInterface: (
        type: 'MTH' | 'TMCC' | 'LEGACY',
        port: SerialPort
    ) => SerialControlInterface
}

type CommandChunk = {
    id: string
    portType: 'MTH' | 'TMCC' | 'LEGACY'
    processed: boolean
    command: number[]
}

type ClosePortOptions = {
    path?: string
    id?: string
    port?: ControlPort
}

export const SerialController = (
    serialCallback: (controlPort: ControlPort) => Promise<void>,
    database: LBCDatabase
): SerialController => {
    // SerialPort doesn't correctly export PortInfo[]
    let availablePorts: AvailablePort[] = []
    let activePorts: ControlPort[] = []

    let commandLoopInterval = null
    let commandChunks: CommandChunk[] = []
    let commandChunk = []

    const setupPorts = async () => {
        // Filter out default COM1
        const ports = await SerialPort.list()
        availablePorts = ports
            .filter((port) => port.path !== 'COM1')
            .map((port: any) => {
                return {
                    name: port.friendlyName,
                    serialNumber: port.serialNumber,
                    port,
                }
            })
    }

    const getAvailablePorts = () => {
        return availablePorts
    }
    const getActivePorts = () => {
        return activePorts
    }

    const commandLoop = () => {
        if (commandChunks.length > 100) {
            commandChunks = commandChunks.slice(0, 99)
        }
        const unprocessed = commandChunks.filter(
            (command) => command.processed === false
        )

        for (const command of unprocessed) {
            if (SERIAL_DEBUG) {
                console.log('command', {
                    id: command.id,
                    command: command.command,
                })
            }
            unprocessed[unprocessed.indexOf(command)].processed = true
        }
    }

    const openPort = async (
        availablePort: AvailablePort,
        type: ControlType,
        baudRate: number = 9600
    ) => {
        const errorCallback = async (err?: Error) => {
            if (err == null) {
                return
            }
            console.error(err)
        }

        const newPort = new SerialPort(
            {
                path: availablePort.port.path,
                baudRate,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
            },
            (err) => errorCallback(err)
        )

        const portInterface = getSerialPortInterface(type, newPort)
        const friendlyPort: FriendlySerialPort = {
            port: newPort,
            serialNumber: availablePort.serialNumber,
            name: availablePort.name,
        }

        //newPort.setMaxListeners(Infinity)
        newPort.on('open', async () => {
            const id = v4()
            const newActivePort = {
                id,
                serial: friendlyPort,
                type: type,
                interface: portInterface,
            }
            activePorts.push(newActivePort)
            const dbSerials = await database.getSerialList()
            if (
                !dbSerials.find(
                    (dbSerial) =>
                        dbSerial.serialNumber === availablePort.serialNumber
                )
            ) {
                await database.addSerial(availablePort.serialNumber, type)
            }
            await serialCallback(newActivePort)

            commandLoopInterval = setInterval(commandLoop, 100)
            console.log('ControlPort opened to', newPort.path)
        })

        newPort.on('data', (chunk: Buffer) => {
            if (SERIAL_DEBUG) console.log('DATA CHUNK', chunk)
            processChunk(type, chunk)
        })

        newPort.on('close', async () => {
            await database.removeSerial(availablePort.serialNumber)
            console.log('PORT CLOSED', newPort.path)
        })

        newPort.on('error', async (err) => {
            console.log(newPort.path, 'error', err)
        })
    }

    const closeSerialPort = async (options: ClosePortOptions) => {
        const errorCallback = (err?: Error) => {
            if (err == null) {
                return
            }
            console.error(err)
        }

        if (options.id) {
            console.log('port close by id')
            if (!activePorts.find((port) => port.id === options.id)) {
                return
            }

            const activeSerial = activePorts.findIndex(
                (port) => port.id === options.id
            )
            closePort(activePorts[activeSerial], errorCallback)
            activePorts = activePorts.slice(activeSerial)
            // console.log(
            //     'Open ports',
            //     activePorts.map((port) => {
            //         return { id: port.id, path: port.serial.port.path }
            //     })
            // )
        } else if (options.path) {
            console.log('port close by path')
            if (
                !activePorts.find(
                    (port) => port.serial.port.path === options.path
                )
            ) {
                return
            }

            const activeSerial = activePorts.findIndex(
                (port) => port.serial.port.path === options.path
            )
            closePort(activePorts[activeSerial], errorCallback)
            activePorts = activePorts.slice(activeSerial)
            console.log(
                'Open ports',
                activePorts.map((port) => {
                    return { id: port.id, path: port.serial.port.path }
                })
            )
        } else if (options.port) {
            console.log('port close by elm', options.port.id)
            closePort(options.port, errorCallback)
            activePorts = activePorts.filter(
                (port) => port.id !== options.port.id
            )
            console.log(
                'Open ports',
                activePorts.map((port) => {
                    return { id: port.id, path: port.serial.port.path }
                })
            )
        } else {
            throw new Error('Invalid path of removal')
        }
    }

    const closePort = (
        port: ControlPort,
        errorCallback: (err: Error) => void
    ) => {
        port.serial.port.destroy
        port.serial.port.close((err) => errorCallback(err))
    }

    const getActivePort = (id: string) => {
        return activePorts.find((port) => port.id === id)
    }

    const processChunk = (portType: ControlType, chunk: Buffer) => {
        const chunkValues = chunk.values()
        for (const value of chunkValues) {
            //console.log(value)
            if (portType === 'TMCC' && commandChunk.length === 3) {
                commandChunks.push({
                    id: v4(),
                    portType,
                    processed: false,
                    command: commandChunk,
                })
                commandChunk = []
            } else if (portType === 'LEGACY' && commandChunk.length === 3) {
                commandChunks.push({
                    id: v4(),
                    portType,
                    processed: false,
                    command: commandChunk,
                })
                commandChunk = []
            }
            commandChunk.push({ value, hex: chunk.toString('hex') })
        }
    }

    const getSerialPortInterface = (
        type: ControlType,
        port: SerialPort
    ): SerialControlInterface => {
        switch (type) {
            case 'MTH': {
                return TMCCSerialInterface(port)
            }
            case 'TMCC': {
                return TMCCSerialInterface(port)
            }
            case 'LEGACY': {
                return LegacySerialInterface(port)
            }
            default:
                throw new Error(`Invalid type: ${type}`)
        }
    }

    return {
        setupPorts,
        getAvailablePorts,
        getActivePorts,
        openPort,
        closeSerialPort,
        getSerialPortInterface,
    }
}
