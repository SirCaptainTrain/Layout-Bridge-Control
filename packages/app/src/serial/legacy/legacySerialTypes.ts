export const LEGACY_FIRST_BYTE = 0xf8

export enum LEGACY_COMMAND_FIELD {
    COMMAND_1 = 0x1,
    COMMAND_0 = 0x0,
}

export enum LEGACY_COMMAND {
    ENGINE_FORWARD_DIRECTION = 0b00000000,
    ENGINE_TOGGLE_DIRECTION = 0b00000001,
    ENGINE_REVERSE_DIRECTION = 0b00000011,
    ENGINE_OPEN_COUPLER_FRONT = 0b00000101,
    ENGINE_OPEN_COUPLER_REAR = 0b00000110,
    ENGINE_BLOW_HORN = 0b00011100,
    ENGINE_BELL_ON = 0b11110101,
    ENGINE_BELL_OFF = 0b11110100,
    ENGINE_QUILL_HORN = 0b11100000,
}