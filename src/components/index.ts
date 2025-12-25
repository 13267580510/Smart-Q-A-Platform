import SvgIcon from './SvgIcon/index.vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const allGlobalComponent = {SvgIcon}

export default {
    install(app){
        Object.keys(allGlobalComponent).forEach(key=>{
            app.component(key,allGlobalComponent[key])
        })
        for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
            app.component(key, component)
          }
    }
}