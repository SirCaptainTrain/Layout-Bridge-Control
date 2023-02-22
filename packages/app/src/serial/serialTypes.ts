import { SerialPort } from 'serialport'

export type SerialInterfaceCommand = {
    id: string
    commandBuffers: Buffer[]
    port: SerialPort
    repeat?: number
    writeInterval?: number
}

export type SerialControlInterface = {
    setSerialPort: (serialPort: SerialPort) => void
    setSpeed?: (engineId: number | string, speed: number) => void
    incrementSpeed?: (engineId: number | string) => void
    decrementSpeed?: (engineId: number | string) => void
    setDirectionForward?: (engineId: number | string) => void
    setDirectionBackward?: (engineId: number | string) => void
    toggleDirection?: (engineId: number | string) => void
    setHorn?: (engineId: number | string, level?: number) => void
    setHorn2?: (engineId: number | string) => void
    ringBell?: (engineId: number | string) => void
    bellOn?: (engineId: number | string) => void
    bellOff?: (engineId: number | string) => void
    openCouplerForward?: (engineId: number | string) => void
    openCouplerRear?: (engineId: number | string) => void
    startUpFast?: (engineId: number | string) => void
    shutDownFast?: (engineId: number | string) => void
    startUpExt?: (engineId: number | string) => void
    shutDownExt?: (engineId: number | string) => void
}
