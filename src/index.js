// this will not show any issue but is inconsistant
// require("dotenv").config({path:'./env'})
// always apply try/catch and async await while connecting with database 

import dotenv from 'dotenv';
import { app } from "./app.js";



// !st process 
import connectDB from "./db/index.js";
dotenv.config({
    path:'./.env'
})

// now to make import statement work we have to reload our env config we can add experimental feature in package.json
// add -r dotenv/config --experimental-json-modules 

connectDB()
// .then work as async code always returns a promise
.then(()=>{
    app.on("error", (error)=>{
        console.log("Erorr on connecting with database:",error);
        throw error;
    })
    app.listen(process.env.PORT|| 8000, ()=>{
        console.log(`App listening on the PORT: ${process.env.PORT}`)
    })
})
.catch(error=>{
    console.error("Mongo Db connection failed :",error)
    throw error;
})













// this is approach to write simple all code in index without importing

// import mongoose from "mongoose";
// import {DB_NAME} from "./constants.js";
// const app = express();

// // now we will use iffis (which should always start with ";")
// ;(async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${dbname}`)
//         app.on("error",()=>{
//             console.log("application is not able to talk to the server:",error);
//             throw error;
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`App listening on the PORT: ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.error("Error :",error)
//         throw error;
//     }
// })()