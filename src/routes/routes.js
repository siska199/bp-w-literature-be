const express = require('express')
const router = express.Router()
const { uploudFile } = require('../middleware/uploudfile')
const {auth} = require('../middleware/auth')
const { register, login, getUsers, deleteUser, getUser , checkAuth, updateUser} = require('../controller/user')
const { addLit, getLits, getLit,getMyLits,deleteLit, editLit,getMyCollections,downloadLit} = require('../controller/literature')
const { addYear, getYears, getYear, editYear, deleteYear } = require('../controller/year')
const {addCollection,getCollection,deleteColl} = require('../controller/collection')

router.post('/register',register)
router.post('/login',login)
router.get('/users',auth,getUsers)
router.get('/profile',auth,getUser)
router.delete('/user/:id',auth,deleteUser)
router.patch('/user',auth, uploudFile(
    {
        image: {
            types: ["jpg", "jpeg", "png"],
            folder: "profile",
        },
    }),updateUser)
router.get('/check-auth',auth,checkAuth)

router.post('/literature',auth,uploudFile({
    pdf: {
        types: ["pdf"],
        folder: "book",
    },
}),addLit)
router.get('/literatures',auth,getLits) 
router.get('/literature/:id',auth,getLit)
router.get('/my-literatures',auth,getMyLits)
router.get('/my-collections',auth,getMyCollections)
router.patch('/literature/:id',auth,uploudFile({
    pdf: {
        types: ["pdf"],
        folder: "book",
    },
}),editLit)
router.delete('/literature/:id',auth,deleteLit)

router.post('/year',auth,addYear)
router.get('/years',getYears)
router.get('/year/:id',getYear)
router.patch('/year/:id',auth,editYear)
router.delete('/year/:id',auth,deleteYear)

router.post('/collection',auth,addCollection)
router.get('/collection/:idLiterature',auth,getCollection)
router.delete('/collection/:id',auth,deleteColl)

module.exports = router