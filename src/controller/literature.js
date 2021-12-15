const { literature, year, collection, user} = require('../../models')
const fs = require('fs')
const Joi = require('joi') 
const {capitalCase, nameFormat, thumbPDF} = require('../helper/function')

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

        const litAdded = await literature.create({
            ...data,
            title : capitalCase(data.title),
            idYear : yearLit.id,
            idUser : req.user.id, 
            status: "Pending",
            publicationDate,
            file : 'http://localhost:3009/uploud/pdf/'+req.file.filename,
            thumbnail : 'http://localhost:3009/uploud/thumbnail/'+name+'.jpg',
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
                            }
                        })
        
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
        const lit = await literature.findOne({
            include: yearInformation,
            where:{
                id : req.params.id
            },
            attributes:{
                exclude :  litExclude 
            }
        })

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
        const lit = await literature.findAll({
            include: yearInformation,
            where:{
                idUser : req.user.id
            },
            attributes:{
                exclude :  litExclude 
            }
        })
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
        const lit = await literature.findAll({
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
            }
        })

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
            data = {
                ...req.body,
                file : 'http://localhost:3009/uploud/pdf/'+req.file.filename
            }
            fs.unlinkSync(litFinded.file.substring(22,litFinded.file.length))

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
            fs.unlinkSync(litData.file.substring(22,litData.file.length))

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

        const pathFile = litFinded.file.substring(22,litFinded.file.length)
        res.download(pathFile)

    } catch (error) {
        res.status(500).send({
            status: 'faild',
            message: 'Server error'
        })
    }
}