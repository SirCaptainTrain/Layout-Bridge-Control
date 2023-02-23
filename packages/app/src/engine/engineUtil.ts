import { ControlType } from './enginetypes'

export const getControlTypeMaxSpeed = (controlType: ControlType) => {
    switch (controlType) {
        case 'LEGACY': {
            return 199
        }
        case 'ERR': {
            return 99
        }
        case 'TMCC': {
            return 31
        }
        default: {
            throw new Error(`Invalid control type: ${controlType}`)
        }
    }
}

export const getWhistleStepsMax = (controlType: ControlType) => {
    switch (controlType) {
        case 'LEGACY': {
            return 15
        }
        case 'MTH': {
            return 3
        }
        default: {
            return 1
        }
    }
}
