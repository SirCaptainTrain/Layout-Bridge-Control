import express from 'express'
import path from 'node:path'

const app = express()

app.get('/', (_req, res) => {
    const web = path.join(__dirname, 'public/index.html')
    res.sendFile(web)
})

app.listen('3002', () => {
    console.log('Client listening on 3002')
})
