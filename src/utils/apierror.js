import { startSession } from "mongoose"

class apiError extends Error{
    constructor(
        statusCode,
        message = "something went wromg",
        errors = [],
         statck = ""
        
    ){
        super(message)
        this.statusCode = statusCode
        this.data = nullthis.message = message
        this.success = false;
        this.errors = errors

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}
export{apiError}