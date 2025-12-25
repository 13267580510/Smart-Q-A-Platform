export const formatTimestamp = (timestamp:string)=> {
    const date = new Date(timestamp);
    
    // 获取年、月、日
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以要加1
    const day = String(date.getDate()).padStart(2, '0');
    
    // 返回格式化后的日期字符串
    return `${year}年${month}月${day}日`;
}

export const debounce = (fn:any,t:number)=>{
    let timer:any = null;
    return function(){
        if(timer) clearTimeout(timer);
        timer = setTimeout(function(){
            fn();
        },t)
    }
}