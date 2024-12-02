// const path = require('path');
// const pdf = require('pdf-poppler');
// const fs = require('fs')
// const cloudinary = require('./cloudinary')

exports.capitalCase = (sentence)=> {
    let array = sentence.split(' ')
    if(!array[0]){
        array.splice(0,1)
    }
    if(!array[array.length-1]){
        array.splice(array.length-1,1)
    }
    result = array.map(w=>{
        return(w[0].toUpperCase()+w. substring(1,w.length).toLowerCase())
    })
    return(result.join(' '))
}

exports.nameFormat=(fullname)=>{
    let array = fullname.split(' ')
    if(!array[0]){
        array.splice(0,1)
    }
    if(!array[array.length-1]){
        array.splice(array.length-1,1)
    }

    let result 
    if(array.length ==2){
        result = array.map((w,i)=>{
            return(w[0].toUpperCase()+w.substring(1,w.length).toLowerCase())
        })
    }else{
        result = array.map((w,i)=>{
            if(i==array.length-1){
                return(w[0].toUpperCase()+w.substring(1,w.length).toLowerCase())
            }else{
                return(w[0].toUpperCase())
            }
        })
    }
    return(result.join(' '))
}


// exports.thumbPDF=async(input, name)=>{
//     try {
//         let file = input
//         let opts = {
//             format: 'jpeg',
//             out_dir: "uploud/thumbnail",
//             out_prefix: name,
//             page: 1,

//         }

//         await pdf.convert(file, opts)
//         let dirCount = fs.readdirSync('uploud/thumbnail')
//         const filter = new RegExp(name,"ig")

//         let files = dirCount.filter(function(elm){
//             return(elm.match(filter))
//         })

//         fs.rename('uploud/thumbnail/'+files[0], 'uploud/thumbnail/'+name+'.jpg', () => {
//         });

//         await cloudinary.uploader.upload('uploud/thumbnail/'+name+'.jpg',{
//             folder: 'thumbnail',
//             use_filename: true,
//             unique_filename : false
//         })

//     } catch (error) {
//         console.log(error)
//     }

    
// }