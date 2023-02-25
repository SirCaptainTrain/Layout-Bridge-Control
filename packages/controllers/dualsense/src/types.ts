export type ControlType = 'TMCC' | 'ERR' | 'LEGACY' | 'DCS'

export type Engine = {
    id: string
    name?: string
    brand: string
    currentSpeed: number
    maxSpeed: number
    controlId: number | string
    controlType: ControlType
    path: string
    bellStatus?: boolean
}

export type Serial = {
    name: string
    serialNumber: string
    com: string
    controlType?: string
    status?: boolean
}
