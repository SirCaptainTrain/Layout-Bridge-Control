import { v4 } from 'uuid'
import { SerialController } from '../serial/serialController'

export const DualsenseMenuHandler = (serialController: SerialController) => {
    let menuSerialIndex = 0

    const handleLeftBumper = (active: boolean) => {}

    const handleRightBumper = (active: boolean) => {
        if (!active) {
            return
        }

        const availablePorts = serialController.getAvailablePorts()

        //console.log(availablePorts)
        if (availablePorts.length === 0) {
            return
        }

        if (availablePorts.length === 1) {
            console.log(availablePorts[0])
            return
        }

        let nextPort = availablePorts[menuSerialIndex + 1]
        if (nextPort == null) {
            nextPort = availablePorts[0]
            menuSerialIndex = 0
        } else {
            menuSerialIndex++
        }
    }

    const handleCross = async () => {
        const port = getCurrentMenuport()

        try {
            await serialController.openPort(port, 'LEGACY')
        } catch (err) {
            console.log(err)
        }
    }

    const handleTriangle = async () => {
        if (serialController.getActivePorts().length === 0) {
            return
        }

        if (serialController.getActivePorts().length > menuSerialIndex - 1) {
            menuSerialIndex = 0
        }

        let port = serialController.getActivePorts()[menuSerialIndex]
        if (port == null) {
            menuSerialIndex = 0
        }

        try {
            await serialController.closeSerialPort({ port })
        } catch (err) {
            console.log(err)
        }
    }

    const handleSquare = async () => {
        if (serialController.getAvailablePorts().length === 0) {
            return
        }

        console.log(
            serialController.getAvailablePorts().map((availablePort) => {
                return {
                    id: availablePort.port.manufacturer,
                    path: availablePort.port.path,
                }
            })
        )
    }

    const handleCircle = async () => {
        if (serialController.getActivePorts().length === 0) {
            return
        }

        console.log(
            serialController.getActivePorts().map((port) => {
                return { id: port.id, path: port.serial.port.path }
            })
        )
    }

    const getCurrentMenuport = () => {
        const availablePorts = serialController.getAvailablePorts()

        //console.log(availablePorts)
        if (availablePorts.length === 0) {
            return
        }

        if (availablePorts.length === 1) {
            return availablePorts[0]
        }

        const menuPort = availablePorts[menuSerialIndex]
        if (menuPort == null) {
            menuSerialIndex = 0
            return availablePorts[0]
        }
        return menuPort
    }

    return {
        handleLeftBumper,
        handleRightBumper,
        handleCross,
        handleTriangle,
        handleSquare,
        handleCircle,
    }
}
