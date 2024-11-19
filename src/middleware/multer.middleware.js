import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp') // cb- callback
    },
    filename: function (req, file, cb) {
        //  this is function to stops multiple file of same name can be added latter
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.originalname )  //    file.fieldname + '-' + uniqueSuffix
    }
  })
  
export  const upload = multer({ storage,})
