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
                control.setWhistle(req.body.whistleLevel)
                break
            }
            case 'tmccWhistle': {
                control.setTMCCWhistle(req.body.whistle)
                break
            }
            case 'forwardDirection': {
                control.forwardDirection()
                break
            }
            case 'backwardDirection': {
                control.backwardDirection()
                break
            }
            case 'toggleDirection': {
                control.toggleDirection()
                break
            }
            case 'setSpeed': {
                control.setSpeed(req.body.speed)
                break
            }
            case 'incrementSpeed': {
                control.incrementSpeed()
                break
            }
            case 'decrementSpeed': {
                control.decrementSpeed()
                break
            }
            case 'startUpFast': {
                control.startUpFast()
                break
            }
            case 'shutDownFast': {
                control.shutDownFast()
                break
            }
            case 'startUpExt': {
                control.startUpExt()
                break
            }
            case 'shutDownExt': {
                control.shutDownExt()
                break
            }
            case 'couplerFront': {
                control.openCouplerForward()
                break
            }
            case 'couplerRear': {
                control.openCouplerRear()
                break
            }
            case 'speedType': {
                control.setSpeedType(req.body.speedType)
                break
            }
            case 'halt': {
                control.haltEngine()
                break
            }
        }
    } catch (err) {
        console.log(err)
        return res.sendStatus(500)
    }
    res.sendStatus(200)
}
