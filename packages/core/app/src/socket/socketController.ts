import { Server } from 'socket.io'

export type SocketController = {
    setup: () => void
}

const io = new Server()
export const SocketController = (): SocketController => {
    const setup = () => {
        const socket = io.listen(3001)
        socket.on('connection', () => {
            console.log('hello')
        })
    }

    return {
        setup,
    }
}
