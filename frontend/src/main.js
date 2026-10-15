import './styles/app.css'
import { createAppController } from './controllers/appController.js'

const root = document.getElementById('app')
const controller = createAppController(root)
controller.start()
