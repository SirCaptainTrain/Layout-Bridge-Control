import { API } from '../api'

export const DualsenseMenuHandler = (api: API) => {
    let menuSerialIndex = 0

    const handleLeftBumper = (active: boolean) => {}

    const handleRightBumper = async (active: boolean) => {
        if (!active) {
            return
        }

        const availablePorts = await api.getSerialAvailable()

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
        const port = await getCurrentMenuport()

        try {
            await api.toggleSerial(port.serialNumber, 'LEGACY')
        } catch (err) {
            console.log(err)
        }
    }

    const handleTriangle = async () => {
        const activePorts = await api.getSerialActive()
        if (activePorts.length === 0) {
            return
        }

        if (activePorts.length > menuSerialIndex - 1) {
            menuSerialIndex = 0
        }

        let port = activePorts[menuSerialIndex]
        if (port == null) {
            menuSerialIndex = 0
        }

        try {
            await api.toggleSerial(port.serialNumber)
        } catch (err) {
            console.log(err)
        }
    }

    const handleSquare = async () => {
        const availablePorts = await api.getSerialAvailable()
        if (availablePorts.length === 0) {
            return
        }

        console.log('availablePorts', availablePorts)
    }

    const handleCircle = async () => {
        const activePorts = await api.getSerialActive()
        if (activePorts.length === 0) {
            return
        }

        console.log('activePorts', activePorts)
    }

    const getCurrentMenuport = async () => {
        const availablePorts = await api.getSerialAvailable()

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
