import { ControlType, EngineInfo } from './enginetypes'
import dotenv from 'dotenv'
import { ControlPort } from '../serial/serialController'
import { getControlTypeMaxSpeed, getWhistleStepsMax } from './engineUtil'

dotenv.config()
const APP_DEBUG = process.env.APP_DEBUG === 'true'

export type Engine = {
    getEngineSerial: () => ControlPort
    getEngineInfo: () => EngineInfo
    setEngineInfo: (engine: EngineInfo) => void
    getRapidStop: () => boolean
    setRapidStop: (active: boolean) => void
    setSpeed: (newSpeed: number) => void
    incrementSpeed: () => void
    decrementSpeed: () => void
    resetSpeed: () => void
    setBell: (active: boolean) => void
    getId: () => string
    getName: () => string
    getSpeed: () => number
    getMaxSpeed: () => number
    getBell: () => boolean
    getWhistleSteps: () => number
}

export const Engine = (
    controlPort: ControlPort,
    initialEngineInfo: EngineInfo
): Engine => {
    let currentSpeed = 0
    let engineInfo = initialEngineInfo

    let engineRapidStopActive = false

    // Legacy Bell on/off toggle
    let bellStatus = false

    // Whistle Steps
    let whistleSteps = getWhistleStepsMax(engineInfo.controlType)

    const getEngineSerial = () => {
        return controlPort
    }

    const getEngineInfo = () => {
        return engineInfo
    }

    const setEngineInfo = (newengineInfo: EngineInfo) => {
        engineInfo = newengineInfo
        //console.log('engineInfo', engineInfo)
        switch (engineInfo.controlType) {
            case 'LEGACY': {
                whistleSteps = 16
                break
            }
            case 'MTH': {
                whistleSteps = 4
            }
        }
    }

    const getRapidStop = () => {
        return engineRapidStopActive
    }

    const setRapidStop = (active: boolean) => {
        engineRapidStopActive = active
    }

    const setSpeed = (newSpeed: number) => {
        if (newSpeed < 0) {
            newSpeed = 0
        }
        currentSpeed = newSpeed
        if (APP_DEBUG)
            console.log({
                id: engineInfo.id,
                deviceId: engineInfo.controlId,
                currentSpeed,
                maxSpeed: getControlTypeMaxSpeed(engineInfo.controlType),
            })
    }

    const incrementSpeed = () => {
        if (currentSpeed < getControlTypeMaxSpeed(engineInfo.controlType)) {
            currentSpeed += 1
        }

        if (APP_DEBUG)
            console.log({
                id: engineInfo.id,
                deviceId: engineInfo.controlId,
                currentSpeed,
                maxSpeed: getControlTypeMaxSpeed(engineInfo.controlType),
            })
    }

    const decrementSpeed = () => {
        if (currentSpeed > 0) {
            currentSpeed -= 1
        }

        if (APP_DEBUG)
            console.log({
                id: engineInfo.id,
                deviceId: engineInfo.controlId,
                currentSpeed,
                maxSpeed: getControlTypeMaxSpeed(engineInfo.controlType),
            })
    }

    const resetSpeed = () => {
        currentSpeed = 0
    }

    const setBell = (active: boolean) => {
        bellStatus = active
    }

    const getId = () => {
        return engineInfo.id
    }

    const getName = () => {
        return engineInfo.name ?? engineInfo.model
    }

    const getSpeed = () => {
        return currentSpeed
    }

    const getBell = () => {
        return bellStatus
    }

    const getWhistleSteps = () => {
        return whistleSteps
    }

    const getMaxSpeed = () => {
        if (engineInfo == null) {
            throw new Error('Invalid engine!')
        }
        return getControlTypeMaxSpeed(engineInfo.controlType)
    }

    return {
        getEngineSerial,
        getEngineInfo,
        setEngineInfo,
        getRapidStop,
        setRapidStop,
        setSpeed,
        incrementSpeed,
        decrementSpeed,
        resetSpeed,
        setBell,
        getId,
        getName,
        getSpeed,
        getMaxSpeed,
        getBell,
        getWhistleSteps,
    }
}
