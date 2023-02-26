import { Api } from './api'
import { DualsenseController } from './dualsenseController'
console.clear()
console.log('Starting LBC-Dualsense')
const errorCallback = (type: 'error' | 'fatal', message: string) => {
    console.log(type, message)
}
const api = Api()

const dualsenseController = DualsenseController(api, errorCallback)

dualsenseController.connect().then(() => {
    console.clear()
    console.log('LBC-Dualsense Running')
})
