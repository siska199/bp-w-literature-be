const multer = require('multer')

exports.uploudFile = (fileType) =>{
    const storage = multer.diskStorage({
        destination : function(req, file, cb){
            if(fileType=='pdf'){
                cb(null, "uploud/pdf")
            }else if(fileType=='image'){
                cb(null, "uploud/profile")
            }
        },
        filename : function(req, file, cb){
            cb(null, Date.now()+'-'+file.originalname.replace(/\s/g,'')) // \s replace any white space https://regexr.com/
        }
    })

    const fileFilter = function(req, file, cb){
        if(fileType=='pdf'){
            if(!file.originalname.match(/\.pdf/)){
                req.fileValidationError = {
                    message : 'Only pdf files are allowed'
                }
                return cb(new Error('Only pdf files are allowed'), false)
            }
            cb(null, true)
        }

        else if(fileType=='image'){
            if(!file.originalname.match(/\.(|jpg|JPG|jpeg|JPEG|png|PNG)/)){
                req.fileValidationError = {
                    message : 'Only image files are allowed'
                }
                return cb(new Error('Only image files are allowed'), false)
            }
            cb(null, true)
        }


    }
    const sizeInMB = 100;
    const maxSize = sizeInMB*1000*1000

    const uploud = multer({
        storage,
        fileFilter,
        limits :{
            fileSize:maxSize
        }
    }).single(fileType)

    return(req, res, next)=>{
        uploud(req, res, function(err){
            if(req.fileValidationError){
                return res.status(400).send(req.fileValidationError)
            }

            if(!err){
                if(!fileType=='pdf' || !fileType=='image' && !req.files){
                    return res.status(400).send({
                        message: 'Please select files to uploud'
                    })
                }
            }

            if(!fileType=='pdf' || !fileType=='image' && !req.file){
                return res.status(400).send({
                    message: 'Please select file to uploud'
                })
            }

            if(err){
                if(err.code=="LIMIT_FILE_SIZE"){
                    return res.status(400).send({
                        message: 'Max file sized 10MB'
                    })
                }
                return res.status(400).send(err)
            }

            return next()

        })
    }
}