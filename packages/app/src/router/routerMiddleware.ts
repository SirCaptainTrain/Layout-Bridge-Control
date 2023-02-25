export const routerMiddleware = (req, res, _next) => {
    const type = req.body.type
    const engineId = req.body.engineId
    const control = res.locals.control
    if (type == null) return res.sendStatus(400)
    if (engineId == null || typeof engineId !== 'string')
        return res.sendStatus(400)
    if (control == null) return res.sendStatus(500)
    try {
        switch (type) {
            case 'bellOn': {
                control.bellOn(engineId)
                break
            }
            case 'bellOff': {
                control.bellOff(engineId)
                break
            }
            case 'whistle': {
                control.setWhistle(engineId, req.body.whistleLevel)
                break
            }
            case 'tmccWhistle': {
                control.setTMCCWhistle(engineId, req.body.whistle)
                break
            }
            case 'forwardDirection': {
                control.forwardDirection(engineId)
                break
            }
            case 'backwardDirection': {
                control.backwardDirection(engineId)
                break
            }
            case 'toggleDirection': {
                control.toggleDirection(engineId)
                break
            }
            case 'setSpeed': {
                control.setSpeed(engineId, req.body.speed)
                break
            }
            case 'incrementSpeed': {
                control.incrementSpeed(engineId)
                break
            }
            case 'decrementSpeed': {
                control.decrementSpeed(engineId)
                break
            }
            case 'startUpFast': {
                control.startUpFast(engineId)
                break
            }
            case 'shutDownFast': {
                control.shutDownFast(engineId)
                break
            }
            case 'startUpExt': {
                control.startUpExt(engineId)
                break
            }
            case 'shutDownExt': {
                control.shutDownExt(engineId)
                break
            }
            case 'couplerFront': {
                control.openCouplerForward(engineId)
                break
            }
            case 'couplerRear': {
                control.openCouplerRear(engineId)
                break
            }
            case 'speedType': {
                control.setSpeedType(engineId, req.body.speedType)
                break
            }
            case 'halt': {
                control.haltEngine(engineId)
                break
            }
        }
    } catch (err) {
        console.log(err)
        return res.sendStatus(500)
    }
    res.sendStatus(200)
}
