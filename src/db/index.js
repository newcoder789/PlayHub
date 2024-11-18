import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        
    } catch (error) { 
        console.error("Error connecting with mongodb:",error);
        process.exit(1);// we can use exit(); but that causes issue as sometime console.error is assynchronous so exit might stops the process in middle
        // while this will make all async- process to complete first
    }
}

export default connectDB;