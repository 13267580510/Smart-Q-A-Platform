import { defineStore } from "pinia";

const useQuestionStore = defineStore('QuestionStore',{
    state:()=>{
        return {
            content:''
        }
    },
    actions:{
        answer(){
            console.log(this.content)
        }
    }
})

export default useQuestionStore;