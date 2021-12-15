const { literature, year, collection, user} = require('../../models')
const fs = require('fs')
const Joi = require('joi') 
const {capitalCase, nameFormat, thumbPDF} = require('../helper/function')
const cloudinary =  require('../helper/cloudinary')
const yearInformation = 
    {
        model : year,
        as : 'year',
        attributes: {
            exclude :  ["id","createdAt", "updatedAt"]
        }
    }

const userInformation =
    {
        model : user,
        as : 'user',
        attributes: {
            exclude :  ["createdAt", "updatedAt"]
        }
    }
const litExclude =   ["createdAt", "updatedAt"]

exports.addLit = async (req, res) =>{
    console.log("add lit")
        const scheme = Joi.object({
            title: Joi.string().required(),
            publicationDate: Joi.string().required(),
            pages: Joi.number().required(),
            isbn: Joi.string().max(13).required(),
            author: Joi.string().required(),
        })

        const {file, ...dataVal} = req.body;
        const {error} = scheme.validate(dataVal)

        if(error){
            const err = error.details[0].message.split(' ').map((e,i)=>{
                if(i==0){
                    const word = JSON.parse(e)
                    return(capitalCase(word))
                }else{
                    return(e)
                }
            })  
            if(req.files){
                fs.unlinkSync('uploud/pdf/'+file.filename)
            }
            return res.status(400).send({
                status : 'error',
                message : err.join(' ')
            })
        }

    try {
        const {publicationDate,file, ...data} = req.body;
        const yearData = publicationDate.split('-')[0].toString()

        let yearLit = await year.findOne({
            where:{
                year : yearData
            }
        }) 

        if(!yearLit ){
            yearLit  = await year.create({year : yearData})
        }


        let author1 = data.author.split(',').map(d=>{
            return(nameFormat(d))
        })

        const input = 'uploud/pdf/'+req.file.filename
        const name = String(Date.now())
        await thumbPDF(input, name)
        console.log("File path: ", req.file.path)

        const filePDF = await cloudinary.uploader.upload(req.file.path,{
            folder: 'pdf',
            use_filename: true,
            unique_filename : false
        })
        console.log("File pdf enter: ", filePDF)


        const litAdded = await literature.create({
            ...data,
            title : capitalCase(data.title),
            idYear : yearLit.id,
            idUser : req.user.id, 
            status: "Pending",
            publicationDate,
            file : filePDF.public_id,
            thumbnail : 'thumbnail/'+name+'.jpg',
            author : author1.join(', ')
        })

        
        const litData = await literature.findOne({
            where : {
                id : litAdded.id
            },
            include: [yearInformation,userInformation],
            attributes:{
                exclude : litExclude 
            }
        }) 

        res.send({
            status : 'sucsess',
            data : litData ,
        })
    } catch (error) {
        console.log(error)
        fs.unlinkSync('uploud/pdf/'+req.file.filename)
        res.status(500).send({
            status: 'failed',
            message:'Server error'
        })
    }
}

exports.getLits  = async(req, res)=>{
    try {
        const status = req.query.status
        const year = req.query.year
        const title = req.query.title

        let filterData = await literature.findAll({
                            include: [yearInformation,userInformation],
                            attributes:{
                                exclude : litExclude          
                            },
                            raw : true,
                            nest : true
                        })
        filterData = filterData.map(data=>{
            return({
                ...data,
                file : cloudinary.url(data.file, {secure: true}),
                thumbnail : cloudinary.url(data.thumbnail, {secure: true}),
            })
        })
        
        console.log("Result get literature: ", filterData)

        if(status){
            filterData = filterData.filter(f=>f.status==`${status}`)
        }

        if(year!=='All' || year=='' && title){
            const filterYear = new RegExp(year,"ig")
            const filterTitle = new RegExp(title,"ig")
            filterData = filterData.filter(f=>f.year.year.match(filterYear) && f.title.match(filterTitle))

        }
        else if(year !=='All' && title==''){
            const filter = new RegExp(year,"ig")
            filterData = filterData.filter(f=>f.year.year.match(filter))
            
        }else if(title !='' && year=='All' || year==''){
            const filter = new RegExp(title,"ig")
            filterData = filterData.filter(f=>f.title.match(filter))
        }

        //Arrange Data Pnding-Proove-Cancel:
        const pendingData = filterData.filter(f=>f.status=="Pending")
        const approveData = filterData.filter(f=>f.status=="Approve")
        const rejectData = filterData.filter(f=>f.status=="Rejected")

        const totalData = {
            pending : pendingData.length,
            approve : approveData.length,
            reject : rejectData.length
        }
        filterData = [...pendingData, ...approveData, ...rejectData]
        res.status(200).send({
            status : 'success',
            data : filterData,
            totalData
        })


    } catch (error) {
        res.status(500).send({
            status: 'failed',
            message:'Server error'
        })
    }
}


exports.getLit = async (req, res)=>{
    try {
        let lit = await literature.findOne({
            include: yearInformation,
            where:{
                id : req.params.id
            },
            attributes:{
                exclude :  litExclude 
            },
            raw : true,
            nest : true

        })
        lit = {
            ...lit,
            file : cloudinary.url(lit.file, {secure: true}),
            thumbnail : cloudinary.url(lit.thumbnail, {secure: true}), 
        }
        console.log("get Literature: ",lit)
        res.status(200).send({
            status : 'success',
            data : lit
        }) 
    } catch (error) {
        res.status(500).send({
            status: 'faild',
            message: 'Server error'
        })
    }
}

exports.getMyLits = async (req, res)=>{
    try {
        let lit = await literature.findAll({
            include: yearInformation,
            where:{
                idUser : req.user.id
            },
            attributes:{
                exclude :  litExclude 
            },
            raw : true,
            nest : true

        })

        lit = lit.map(data=>{
            return({
                ...data,
                file : cloudinary.url(data.file, {secure: true}),
                thumbnail : cloudinary.url(data.thumbnail, {secure: true}),
            })
        })
        console.log("my collections: ", lit)

        res.status(200).send({
            status : 'success',
            data : lit
        }) 
    } catch (error) {
        res.status(500).send({
            status: 'faild',
            message: 'Server error'
        })
    }
}

exports.getMyCollections = async(req, res)=>{
    try{
        let lit = await literature.findAll({
            include: [
                yearInformation,
                {
                    model : collection,
                    as : 'collections',
                    where :{
                        idUser : req.user.id
                    },
                    attributes: {
                        exclude :  ["id","createdAt", "updatedAt"]
                    }   
                }
            ],
            attributes:{
                exclude :  litExclude 
            },
            raw : true,
            nest : true

        })
        lit = lit.map(data=>{
            return({
                ...data,
                file : cloudinary.url(data.file, {secure: true}),
                thumbnail : cloudinary.url(data.thumbnail, {secure: true}),
            })
        })
        console.log("my collections: ", lit)
        res.status(200).send({
            status : 'success',
            data : lit
        }) 
    }catch(error){
        res.status(500).send({
            status: 'faild',
            message: 'Server error'
        })
    }
}

exports.editLit = async (req,res)=>{
    try {
        const {id} = req.params

        const litFinded = await literature.findOne({
            include: yearInformation,
            where :{id}
        })
        let data
        if(req.file){

            const input = 'uploud/pdf/'+req.file.filename
            const name = String(Date.now())
            await thumbPDF(input, name)
            console.log("File path: ", req.file.path)

            const filePDF = await cloudinary.uploader.upload(req.file.path,{
                folder: 'pdf',
                use_filename: true,
                unique_filename : false
            })
            console.log("File pdf enter: ", filePDF)
    

            data = {
                ...req.body,
                file : cloudinary.url(filePDF , {secure: true}),
                thumbnail : 'thumbnail/'+name+'.jpg',
            }

            await cloudinary.destroy(litFinded .file,(res)=>console.log(res))
            await cloudinary.destroy(litFinded .thumbnail,(res)=>console.log(res))

        }else{
            data = req.body
        }

        await literature.update(data, {
            where :{
                id
            },
        })

        let litData = await literature.findOne({
            where:{
                id
            },
            attributes:{
                exclude :  litExclude 
            }
        }) 

        res.status(200).send({
            status : 'success',
            data : litData
        }) 
    } catch (error) {
        res.status(500).send({
            status: 'faild',
            message: 'Server error'
        })
    }
}

exports.deleteLit = async (req, res)=>{
    try {
        const { id } = req.params
        const litData = await literature.findOne({
            include: yearInformation,
            where :{id}
        })

        if(litData){
            await cloudinary.destroy(litData.file,(res)=>console.log(res))
            await cloudinary.destroy(litData.thumbnail,(res)=>console.log(res))
        }

        await literature.destroy({
            where :{
                id
            },
        })

        res.status(200).send({
            status : 'success',
            data : {
                id
            }
        }) 
    } catch (error) {
        res.status(500).send({
            status: 'faild',
            message: 'Server error'
        })
    }
}

exports.downloadLit=async(req, res)=>{
    try {
        const { id } = req.params
       const litFinded = await literature.findOne({
            where :{id}
        })
        res.download('uploud/'+litFinded.file+'.pdf')

    } catch (error) {
        res.status(500).send({
            status: 'faild',
            message: 'Server error'
        })
    }
}