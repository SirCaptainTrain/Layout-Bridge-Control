export const routerMiddleware = (req, res, next) => {
    const type = req.body.type
    const control = res.locals.control
    if (type == null) return res.sendStatus(400)
    if (control == null) return res.sendStatus(500)
    try {
        switch (type) {
            case 'engine': {
                control.setEngine(req.body.engineId)
                break
            }
            case 'bellOn': {
                control.bellOn()
                break
            }
            case 'bellOff': {
                control.bellOff()
                break
            }
            case 'whistle': {
                control.setWhistle(req.body.whistle)
            }
            case 'forwardDirection': {
                control.forwardDirection()
                break
            }
            case 'backwardDirection': {
                control.backwardDirection()
            }
            case 'toggleDirection': {
                control.toggleDirection()
            }
            case 'setSpeed': {
                control.setSpeed(req.body.speed)
            }
        }
    } catch (err) {
        console.log(err)
        return res.sendStatus(500)
    }
    res.sendStatus(200)
}
