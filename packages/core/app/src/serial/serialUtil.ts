export const getEngineId = (engineId: string | number) => {
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

export const getInputDataField = (dataField: number | string) => {
    if (typeof dataField === 'number') {
        return dataField
    }

    const hexValue = parseInt(dataField, 2)
    if (isNaN(hexValue)) {
        throw new Error(`Invalid datafield: ${dataField}`)
    }
    return hexValue
}
