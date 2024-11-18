import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express()

// in this we configure our api coming from different ways like 



app.use(cors({
    origin: process.env.CORS_ORIGIN,// what are the origin link u are allowing to use our api
    credentials: true,  
}))


// configuring json requrest(like filling a form )
app.use(express.json({limit:"16kb"}))


// when form come in way of form submission
app.use(express.urlencoded({
    extended:true,
    limit:"16kb"
}))


app.use (express.static("public"))
// it is used to use-secure-edit cookies from a website
app.use(cookieParser())



export {app}