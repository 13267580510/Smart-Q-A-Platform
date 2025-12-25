import { defineStore } from "pinia";

const useLayoutSetting = defineStore('LayoutSetting',{
    state:()=>{
        return {
            isCollapse:false,
            refresh:false
        }
    },
    actions:{

    }
})

export default useLayoutSetting;