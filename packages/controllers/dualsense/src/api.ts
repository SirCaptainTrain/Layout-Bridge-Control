import axios from 'axios'
import { ControlType, Engine, Serial } from './types'

export type API = {
    getEngines: () => Promise<Engine[]>
    getEngine: (engineId: string) => Promise<Engine>
    getSerialAvailable: () => Promise<Serial[]>
    getSerialActive: () => Promise<Serial[]>
    toggleSerial: (
        serialNumber: string,
        controlType?: ControlType
    ) => Promise<void>
    controlEngine: (engineId: string, data: any) => Promise<void>
}

export const Api = (apiUrl?: string): API => {
    if (apiUrl == null) {
        apiUrl = 'http://localhost:3000'
    }

    const axiosPost = async (path: string, data: any) => {
        return await axios.post(`${apiUrl}${path}`, data)
    }

    const axiosGet = async (path: string) => {
        return await axios.get(`${apiUrl}${path}`)
    }

    const getEngines = async () => {
        const res = await axiosGet('/engine')
        if (res.status === 204) {
            return []
        }
        if (typeof res.data !== 'object') {
            throw new Error('Invalid engines response type')
        }

        // Maybe make a mapper?
        return res.data
    }

    const getEngine = async (engineId: string) => {
        const res = await axiosGet(`/engine/${engineId}`)
        if (typeof res.data !== 'object') {
            throw new Error('Invalid engine response type')
        }
        return res.data
    }

    const getSerialAvailable = async () => {
        const res = await axiosGet('/serial/available')
        if (res.status === 204) {
            return []
        }
        if (typeof res.data !== 'object') {
            throw new Error('Invalid serial response type')
        }

        // Maybe make a mapper?
        return res.data
    }

    const getSerialActive = async () => {
        const res = await axiosGet('/serial/active')
        if (res.status === 204) {
            return []
        }
        if (typeof res.data !== 'object') {
            throw new Error('Invalid serial response type')
        }

        // Maybe make a mapper?
        return res.data
    }

    const toggleSerial = async (
        serialNumber: string,
        controlType?: ControlType
    ) => {
        if (controlType == null) {
            await axiosPost('/serial/toggle', { serialNumber })
        } else {
            await axiosPost('/serial/toggle', { serialNumber, controlType })
        }
    }

    // TBD: Split into correctly typed control paths rather than accepting "anything"
    const controlEngine = async (engineId: string, data: any) => {
        console.log('Sending command:', { engineId, ...data })
        await axiosPost('/engine/control', { engineId, ...data })
    }

    return {
        getEngines,
        getEngine,
        getSerialAvailable,
        getSerialActive,
        toggleSerial,
        controlEngine,
    }
}
