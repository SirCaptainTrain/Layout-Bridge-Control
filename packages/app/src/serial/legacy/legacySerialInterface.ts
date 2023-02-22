import { SerialPort } from 'serialport'
import { v4 } from 'uuid'
import { SerialInterface } from '../serialInterface'
import { SerialControlInterface, SerialInterfaceCommand } from '../serialTypes'
import {
    LEGACY_COMMAND,
    LEGACY_COMMAND_FIELD,
    LEGACY_FIRST_BYTE,
} from './legacySerialTypes'

export const LegacySerialInterface = (
    serialPort: SerialPort
): SerialControlInterface => {
    const serialInterface = SerialInterface()
    serialInterface.startInterface(10)

    const setSerialPort = (newSerialPort: SerialPort) => {
        serialPort = newSerialPort
    }

    const buildCommand = (
        buffers: Buffer[],
        options?: {
            repeat?: number
            writeInterval?: number
        }
    ): SerialInterfaceCommand => {
        console.log('Building LEGACY Command', buffers)
        return {
            id: v4(),
            commandBuffers: buffers,
            port: serialPort,
            repeat: options?.repeat,
            writeInterval: options?.writeInterval,
        }
    }

    const buildBuffers = (
        deviceId: number,
        commandField: number,
        dataField: number | string,
        dataFieldExtra?: number | string
    ): Buffer[] => {
        const command0 = LEGACY_FIRST_BYTE
        const command1 = (deviceId << 1) | commandField
        const command2 = getInputDataField(dataField)

        const commandBuffer0 = Buffer.from([command0])
        const commandBuffer1 = Buffer.from([command1])
        const commandBuffer2 = Buffer.from([command2])

        return [commandBuffer0, commandBuffer1, commandBuffer2]
    }

    const setSpeed = (engineId: number | string, speed: number) => {
        const engineIdParsed = getEngineId(engineId)
        const buffers = buildBuffers(
            engineIdParsed,
            LEGACY_COMMAND_FIELD.COMMAND_0,
            speed
        )
        const command = buildCommand(buffers)
        serialInterface.addCommand(command)
    }

    const incrementSpeed = (engineId: number | string) => {
        const engineIdParsed = getEngineId(engineId)
        const buffers = buildBuffers(
            engineIdParsed,
            LEGACY_COMMAND_FIELD.COMMAND_1,
            LEGACY_COMMAND.ENGINE_INCREMENT_SPEED_1
        )
        const command = buildCommand(buffers)
        serialInterface.addCommand(command)
    }

    const decrementSpeed = (engineId: number | string) => {
        const engineIdParsed = getEngineId(engineId)
        const buffers = buildBuffers(
            engineIdParsed,
            LEGACY_COMMAND_FIELD.COMMAND_1,
            LEGACY_COMMAND.ENGINE_DECREMENT_SPEED_1
        )
        const command = buildCommand(buffers)
        serialInterface.addCommand(command)
    }

    const toggleDirection = (engineId: number | string) => {
        const engineIdParsed = getEngineId(engineId)
        const buffers = buildBuffers(
            engineIdParsed,
            LEGACY_COMMAND_FIELD.COMMAND_1,
            LEGACY_COMMAND.ENGINE_TOGGLE_DIRECTION
        )
        const command = buildCommand(buffers)
        serialInterface.addCommand(command)
    }

    const openCouplerForward = (engineId: number | string) => {
        const engineIdParsed = getEngineId(engineId)
        const buffers = buildBuffers(
            engineIdParsed,
            LEGACY_COMMAND_FIELD.COMMAND_1,
            LEGACY_COMMAND.ENGINE_OPEN_COUPLER_FRONT
        )
        const command = buildCommand(buffers)
        serialInterface.addCommand(command)
    }

    const bellOn = (engineId: number | string) => {
        const engineIdParsed = getEngineId(engineId)
        const buffers = buildBuffers(
            engineIdParsed,
            LEGACY_COMMAND_FIELD.COMMAND_1,
            LEGACY_COMMAND.ENGINE_BELL_ON
        )
        const command = buildCommand(buffers)
        serialInterface.addCommand(command)
    }

    const bellOff = (engineId: number | string) => {
        const engineIdParsed = getEngineId(engineId)
        const buffers = buildBuffers(
            engineIdParsed,
            LEGACY_COMMAND_FIELD.COMMAND_1,
            LEGACY_COMMAND.ENGINE_BELL_OFF
        )
        const command = buildCommand(buffers)
        serialInterface.addCommand(command)
    }

    const setHorn = (engineId: string | number, level: number) => {
        if (level < 0) {
            level = 0
        } else if (level > 15) {
            level = 15
        }
        //console.log('initLevel', level, level.toString(2), level.toString(16))
        const initLevel = level
        const engineIdParsed = getEngineId(engineId)
        const LEGACYCommand = LEGACY_COMMAND.ENGINE_QUILL_HORN >> 4
        // console.log(LEGACYCommand.toString(2))
        // console.log(initLevel, LEGACYCommand.toString(2), level.toString(2))
        const combined = LEGACYCommand.toString(2).concat(
            level.toString(2).padStart(4, '0')
        )
        // console.log(
        //     initLevel,
        //     combined,
        //     parseInt(combined, 16),
        //     parseInt(combined, 2)
        // )
        const buffers = buildBuffers(
            engineIdParsed,
            LEGACY_COMMAND_FIELD.COMMAND_1,
            parseInt(combined, 2)
        )
        const command = buildCommand(buffers, { writeInterval: 0 })
        serialInterface.addCommand(command)
    }

    const startUpFast = (engineId: string | number) => {
        const engineIdParsed = getEngineId(engineId)
        const buffers = buildBuffers(
            engineIdParsed,
            LEGACY_COMMAND_FIELD.COMMAND_1,
            LEGACY_COMMAND.ENGINE_STARTUP_FAST
        )
        const command = buildCommand(buffers)
        serialInterface.addCommand(command)
    }

    const shutDownFast = (engineId: string | number) => {
        const engineIdParsed = getEngineId(engineId)
        const buffers = buildBuffers(
            engineIdParsed,
            LEGACY_COMMAND_FIELD.COMMAND_1,
            LEGACY_COMMAND.ENGINE_SHUTDOWN_FAST
        )
        const command = buildCommand(buffers)
        serialInterface.addCommand(command)
    }

    const getEngineId = (engineId: string | number) => {
        let engineIdParsed: number
        if (typeof engineId === 'string') {
            engineIdParsed = parseInt(engineId)
        } else {
            engineIdParsed = engineId
        }

        if (isNaN(engineIdParsed)) {
            throw new Error(`Invalid engine id: ${engineId}`)
        }
        return engineIdParsed
    }

    const getInputDataField = (dataField: number | string) => {
        if (typeof dataField === 'number') {
            return dataField
        }

        const hexValue = parseInt(dataField, 2)
        if (isNaN(hexValue)) {
            throw new Error(`Invalid datafield: ${dataField}`)
        }
        return hexValue
    }

    return {
        setSerialPort,
        setSpeed,
        toggleDirection,
        openCouplerForward,
        bellOn,
        bellOff,
        setHorn,
        incrementSpeed,
        decrementSpeed,
        startUpFast,
        shutDownFast,
    }
}
