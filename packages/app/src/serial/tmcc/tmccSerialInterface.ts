import { SerialPort } from 'serialport'
import { v4 } from 'uuid'
import { SerialInterface } from '../serialInterface'
import { SerialControlInterface, SerialInterfaceCommand } from '../serialTypes'
import {
    TMCC_COMMAND,
    TMCC_COMMAND_FIELD,
    TMCC_DEVICE_TYPE,
    TMCC_FIRST_BYTE,
} from './tmccSerialTypes'

export const TMCCSerialInterface = (
    serialPort: SerialPort
): SerialControlInterface => {
    const serialInterface = SerialInterface()
    serialInterface.startInterface(50)

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
        console.log('Building TMCC Command', buffers)
        return {
            id: v4(),
            commandBuffers: buffers,
            port: serialPort,
            repeat: options?.repeat,
            writeInterval: options?.writeInterval,
        }
    }

    const buildBuffers = (
        deviceType: number,
        deviceId: number,
        commandField: number,
        dataField: number | string,
        commandName?: string
    ): Buffer[] => {
        const command0 = TMCC_FIRST_BYTE
        const command1 = deviceType | (deviceId >> 1)
        const command2 =
            ((deviceId << 7) >>> 0) |
            (commandField << 5) |
            getInputDataField(dataField)

        const commandBuffer0 = Buffer.from([command0])
        const commandBuffer1 = Buffer.from([command1])
        const commandBuffer2 = Buffer.from([command2])

        // console.log(
        //     'command',
        //     commandName,
        //     { deviceType, deviceId, commandField, dataField },
        //     [commandBuffer0, commandBuffer1, commandBuffer2]
        // )
        return [commandBuffer0, commandBuffer1, commandBuffer2]
    }

    const setSpeed = (engineId: number | string, speed: number) => {
        const engineIdParsed = getEngineId(engineId)
        const buffers = buildBuffers(
            TMCC_DEVICE_TYPE.ENGINE,
            engineIdParsed,
            TMCC_COMMAND_FIELD.COMMAND_11,
            speed,
            'speed'
        )
        const command = buildCommand(buffers)
        serialInterface.addCommand(command)
    }

    const incrementSpeed = (engineId: number | string) => {
        const engineIdParsed = getEngineId(engineId)
        const buffers = buildBuffers(
            TMCC_DEVICE_TYPE.ENGINE,
            engineIdParsed,
            TMCC_COMMAND_FIELD.COMMAND_11,
            TMCC_COMMAND.ENGINE_INCREMENT_SPEED_1.toString(2).padStart(4, '0')
        )
        const command = buildCommand(buffers)
        serialInterface.addCommand(command)
    }

    const decrementSpeed = (engineId: number | string) => {
        const engineIdParsed = getEngineId(engineId)
        const buffers = buildBuffers(
            TMCC_DEVICE_TYPE.ENGINE,
            engineIdParsed,
            TMCC_COMMAND_FIELD.COMMAND_11,
            TMCC_COMMAND.ENGINE_DECREMENT_SPEED_1.toString(2).padStart(4, '0')
        )
        const command = buildCommand(buffers)
        serialInterface.addCommand(command)
    }

    const toggleDirection = (engineId: number) => {
        const engineIdParsed = getEngineId(engineId)
        const buffers = buildBuffers(
            TMCC_DEVICE_TYPE.ENGINE,
            engineIdParsed,
            TMCC_COMMAND_FIELD.COMMAND_00,
            TMCC_COMMAND.ENGINE_TOGGLE_DIRECTION
        )
        const command = buildCommand(buffers)
        serialInterface.addCommand(command)
    }

    const blowHorn = (engineId: string | number) => {
        const engineIdParsed = getEngineId(engineId)
        const buffers = buildBuffers(
            TMCC_DEVICE_TYPE.ENGINE,
            engineIdParsed,
            TMCC_COMMAND_FIELD.COMMAND_00,
            TMCC_COMMAND.ENGINE_BLOW_HORN
        )
        const command = buildCommand(buffers, {
            writeInterval: 0,
        })
        serialInterface.addCommand(command)
    }

    const toggleBell = (engineId: string | number) => {
        const engineIdParsed = getEngineId(engineId)
        const buffers = buildBuffers(
            TMCC_DEVICE_TYPE.ENGINE,
            engineIdParsed,
            TMCC_COMMAND_FIELD.COMMAND_00,
            TMCC_COMMAND.ENGINE_RING_BELL
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
        setHorn: blowHorn,
        ringBell: toggleBell,
        incrementSpeed,
        decrementSpeed,
    }
}
