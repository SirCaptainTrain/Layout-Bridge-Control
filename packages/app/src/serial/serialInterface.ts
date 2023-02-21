import { SerialPort } from 'serialport'
import { SerialInterfaceCommand } from './serialTypes'

export const SerialInterface = () => {
    const DEFAULT_WRITE_INTERVAL = 50
    let commandsBuffer: SerialInterfaceCommand[] = []
    let running = true
    let runInterval = 150

    const processCommandLoop = async () => {
        if (commandsBuffer == null || commandsBuffer.length === 0) {
            return
        }

        const nextItem = commandsBuffer[0]
        const { id, commandBuffers, port } = nextItem

        //console.log('Processing', Date.now(), { id, commandBuffers })
        let i = nextItem.repeat ?? 1
        while (i > 0) {
            let k = commandBuffers.length - 1
            for (const commandBuffer of commandBuffers) {
                sendChunk(commandBuffer, port)
                if (k > 0) {
                    await sleep(
                        nextItem.writeInterval ?? DEFAULT_WRITE_INTERVAL
                    )
                }
                //console.log('Chunk', Date.now(), commandBuffer)
                k--
            }
            i--
        }
        // Safe check above 0
        if (commandsBuffer.length > 0) {
            commandsBuffer.shift()
        } else {
            throw new Error('Command Queue is empty in loop')
        }
    }

    const startInterface = (loopMs: number = 150) => {
        if ((running = false)) {
            return
        }
        runInterval = loopMs
        runInterface()
    }

    const runInterface = () => {
        setTimeout(async () => {
            //console.log('running')
            await processCommandLoop()
            runInterface()
        }, runInterval)
    }

    const sendChunk = (chunk: Buffer, serialPort: SerialPort) => {
        serialPort.write(chunk)
    }

    const sleep = async (ms: number) => {
        await new Promise((r) => setTimeout(r, ms))
    }

    const stopInterface = () => {
        running = false
    }

    const addCommand = (command: SerialInterfaceCommand) => {
        commandsBuffer.push({ ...command })
    }

    return {
        startInterface,
        stopInterface,
        addCommand,
    }
}
