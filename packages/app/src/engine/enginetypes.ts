export type ControlType = 'MTH' | 'TMCC' | 'LEGACY' | 'ERR'

export type EngineInfo = {
    id: string
    brand: string
    model?: string
    name?: string
    controlType: ControlType
    controlId?: string | number
}

export enum EngineSpeedControlType {
    ABS,
    REL,
}
