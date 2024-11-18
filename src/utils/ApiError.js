class ApiError extends Error{
    constructor(
        statusCode,
        message="Something Went wrong",
        error=[],
        statck=""
    ){// type all what u want to overwrite
        super(message)
        this.statusCode=statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = error;

        if(statck){
            this.statck = statck
        }else{
            Error.captureStackTrace(this,this.constructor)
        }

    }
}

export {ApiError}