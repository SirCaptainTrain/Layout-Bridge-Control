import { Database } from 'sqlite3'
import { open } from 'sqlite'
import { EngineInfo } from '../engine/enginetypes'
import { ControlType } from '../serial/serialController'
import { Engine } from '../engine/engine'

export type DatabaseSerialResult = {
    serialNumber: string
    controlType: ControlType
}

export type DatabaseEngineResult = {
    id: string
    name?: string
    brand: string
    serialInterfaceSerialNumber: string
    controlId: number
    controlType: ControlType
}

export type LBCDatabase = {
    initializeDb: () => Promise<void>
    getSerialList: () => Promise<DatabaseSerialResult[]>
    getEngineList: () => Promise<DatabaseEngineResult[]>
    addSerial: (serialNumber: string, controlType: ControlType) => Promise<void>
    addEngine: (engine: Engine) => Promise<void>
    removeSerial: (serialNumber: string) => Promise<void>
    removeEngine: (engineId: string) => Promise<void>
}

export const LBCDatabase = async (): Promise<LBCDatabase> => {
    let db = await open({ filename: './lbc.db', driver: Database })

    const initializeDb = async () => {
        await db.exec(
            'CREATE TABLE IF NOT EXISTS serial (serialNumber TEXT, controlType TEXT)'
        )
        await db.exec(
            'CREATE TABLE IF NOT EXISTS engines (id TEXT, name TEXT, brand TEXT, serialInterfaceSerialNumber TEXT, controlId INT, controlType TEXT)'
        )
    }

    const getSerialList = async () => {
        if (db == null) {
            throw new Error('Database is not initialized')
        }
        const stmt = await db.prepare('SELECT * FROM serial')
        const serial = await stmt.all()
        return serial
    }

    const getEngineList = async () => {
        if (db == null) {
            throw new Error('Database is not initialized')
        }
        const stmt = await db.prepare('SELECT * FROM engines')
        const engines = await stmt.all()
        return engines
    }

    const addEngine = async (engine: Engine) => {
        const stmt = await db.prepare(
            'INSERT INTO engines VALUES (?,?,?,?,?,?)'
        )
        await stmt.run(
            engine.getId(),
            engine.getEngineInfo().name,
            engine.getEngineInfo().brand,
            engine.getEngineSerial().serial.serialNumber,
            engine.getEngineInfo().controlId,
            engine.getEngineInfo().controlType
        )
    }

    const removeEngine = async (engineId: string) => {
        const stmt = await db.prepare('DELETE FROM engines WHERE id = ?')
        await stmt.run(engineId)
    }

    const addSerial = async (
        serialNumber: string,
        controlType: ControlType
    ) => {
        const stmt = await db.prepare('INSERT INTO serial VALUES (?,?)')
        await stmt.run(serialNumber, controlType)
    }

    const removeSerial = async (serialNumber: string) => {
        const stmt = await db.prepare(
            'DELETE FROM serial WHERE serialNumber = ?'
        )
        await stmt.run(serialNumber)
    }

    return {
        initializeDb,
        getSerialList,
        getEngineList,
        addSerial,
        addEngine,
        removeSerial,
        removeEngine,
    }
}
