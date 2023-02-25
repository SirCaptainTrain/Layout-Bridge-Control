import cors from 'cors'
import express from 'express'
import path from 'node:path'

const app = express()

app.use(cors({ origin: true }))

app.get('/app', (req, res) => {
    // Hacky solution to allow either localhost or LAN IP control
    let address = req.socket.localAddress
    if (address.substring(0, 7) === '::ffff:') {
        address = req.socket.localAddress.substring(7)
    }
    if (address.includes('localhost') || address.includes('::1')) {
        res.send({ url: 'http://localhost:3000' })
    } else {
        res.send({ url: `http://${address}:3000` })
    }
})

app.get('/', (_req, res) => {
    const web = path.join(__dirname, 'public/index.html')
    res.sendFile(web)
})

app.listen('3002', () => {
    console.log('Client listening on 3002')
})
