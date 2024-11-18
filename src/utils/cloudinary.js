import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

(async function() {

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_SECRET
    });   
})();


// uploading first file 
const uploadOnCLoudinary = async(localFilePath)=>{
    try {
        if(!localFilePath) return null
        // upload file on  cloudinary
        const resources = await cloudinary.v2.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        // file hass been uploaded successfully
        console.log("file is uploaded successfully", resources.url);
        return response;
    } catch (error) {
        // as localfilepath is created if there is issueuploading to cloud then we should remove local file so that there are not many malicioius/currropted file
        fs.unlinkSync(localFilePath) 
        return null
    }
}



export {uploadOnCLoudinary  }