const express = require("express")
const multer = require("multer")
const sharp = require("sharp")
const User = require ("../models/user")
const auth = require("../middleware/auth")

const router = new express.Router()
const upload = multer({
    limits: {
        fileSize: 1000000 //1MB of limit (1 milion of bytes)
    },
    fileFilter(req, file, cb){ //filter the file type
        if(file.originalname.match(/\.(jpg|jpeg|png)$/)){ //regex to match jpg, jpeg, png
            cb(undefined, true)
        } else {
            cb(new Error("Please upload an image"), undefined)
        }
    }
})

// CREATE USER (signup)
router.post("/users", async (req, res) => {
    const user = new User(req.body) //take data from a json request body
    try {
        await user.save()
        const token = await user.generateAuthToken() //sent the token in the response body
        res.status(201).send({user: user.getPublicProfile(), token})
    } catch (e) {
        res.status(400).send("Error! " + e)
    }
})

// READ
router.get("/users/me", auth , async (req, res) => {
    res.send(req.user.getPublicProfile())
})

// UPDATE
router.patch("/users/me", auth, async (req, res) => {

    //Check if the update is allowed
    const updates = Object.keys(req.body) //get a keys array of the obj passed from the body as json
    const allowedUpdates = ["name", "email", "password", "age"]
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update)) //"every" run a function for every element of the array and return a boolean if success
    if(!isValidOperation) return res.status(400).send({error: "Invalid update!"})

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user.getPublicProfile())
    } catch (e) {
        res.status(500).send("Error! " + e)
    }
})

// DELETE
router.delete("/users/me", auth, async (req, res) =>{
    try {
        await req.user.remove()
        res.send(req.user.getPublicProfile())
    } catch (e) {
        res.status(500).send("Error! " + e)
    }
})

// LOGIN
router.post("/users/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password) //custom function
        const token = await user.generateAuthToken()
        res.send({user: user.getPublicProfile(), token})
    } catch (e) {
        res.status(400).send("Error! " + e)
    }
})

// LOGOUT SINGLE SESSION
router.post("/users/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => { //on the list of the tokens, remove the actual one
            return token.token !== req.token //returns the tokens that are different from the actual one
        })
        await req.user.save()
        res.send("Logged out")
    } catch (e) {
        res.status(500).send()
    }
})

// LOGOUT ALL SESSION
router.post("/users/logoutAll", auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send("Logged out all session")
    } catch (e) {
        res.status(500).send()
    }
})

// POST AVATAR
router.post("/users/me/avatar", auth, upload.single("avatar"), async (req, res) => {
    const sharpImage = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png() //import image and apply effects
    const buffer = await sharpImage.toBuffer() //save the image buffer to the user instance
    req.user.avatar = buffer
    await req.user.save()
    res.status(200).send()
}, (error, req, res, next) => { //handle errors
    res.status(400).send({ error: error.message })
})

// DELETE AVATAR
router.delete("/users/me/avatar", auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.status(200).send()
})

// GET AVATAR
router.get("/users/:id/avatar", async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        
        if(!user || !user.avatar){
            throw new Error()
        }

        res.set("Content-Type", "image/png") //response header
        res.send(user.avatar)
    } catch (error) {
        res.status(404).send()
    }
})

module.exports = router