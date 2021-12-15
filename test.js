// const path = require('path')
// const dir = path.join(__dirname)
// console.log("Path", dir)

// const name = "siska.pdf"
// const neww = name.match(/\.pdf/)
// console.log(neww)

// const date ='01/2/2003'
// const year = date.split('/')[2]
// console.log(year)

// const auth = "I. KAMILA1, E. H. NUGRAHANI2, D. C. LESMANA2"
const {capitalCase, nameFormat} = require('./src/functions/function')

// let author = auth.split(',').map(d=>{
//     return(nameFormat(d))
// })
// console.log("Author",author.join(', '))


console.log(capitalCase(" Efficient classical computation of expectation values arising in a class of quantum circuits with an epistemically restricted phase space representation"))