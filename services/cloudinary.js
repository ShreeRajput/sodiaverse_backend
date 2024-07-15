import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"  

cloudinary.config({ 
    cloud_name: 'filestoragearea', 
    api_key: '585944921297462', 
    api_secret: 'FkEJepsr4aiJB3CU2srzRoLEBX8' 
});

const uploadOnCloudinary = async (localFilePath)=> {

    try {

        if(!localFilePath)
            throw new Error("file path not found")

        //upload on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"
        })

        return response

    } 
    catch (error) {
        //if file failed to upload on cloud then need to clear it from server as well 
        //AS BEFORE UPLOAD FILE ON CLOUD WE STORE IT FIRST ON SERVER AND THEN ON CLOUD
        
        fs.unlinkSync(localFilePath) //removes locally stored file
        console.log("error",error)
        return null

    }

}

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) throw new Error("public ID not found");

        const response = await cloudinary.uploader.destroy(publicId);
        return response;
    } catch (error) {
        console.log("error", error);
        return null;
    }
};

export {uploadOnCloudinary,deleteFromCloudinary}