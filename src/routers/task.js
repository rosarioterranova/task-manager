const express = require("express")
const Task = require ("../models/task")
const auth = require("../middleware/auth")

const router = new express.Router()

// CREATE TASK
router.post("/tasks", auth, async (req, res) => {
    const task = new Task({
        ...req.body, //spread operator to copy all value from req.body
        owner: req.user._id //create task associated with owner id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send("Error! " + e)
    }
})

// READ with pagination
// /tasks?completed=true&limit=5&skip=0&sortBy=createdAt:desc
router.get("/tasks", auth, async (req, res) => {
    const match = {}
    const sort = {}

    if(req.query.completed){
        match.completed = (req.query.completed === "true")
    }

    if(req.query.sortBy){
       const parts = req.query.sortBy.split(":")
       sort[parts[0]] = (parts[1] === "desc"? -1 : 1) //desc = -1, asc = 1
    }

    try {
        await req.user.populate({
            path: "tasks",
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send("Error! " + e)
    }
})

// READ SPECIFIC TASK
router.get("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Task.findOne({_id, owner: req.user._id}) //get the task ID and check if actual user is the owner
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send("Error! " + e)
    }
})

// UPDATE SPECIFIC TASK
router.patch("/tasks/:id", auth, async (req, res) => {

    //Check if the update is allowed
    const updates = Object.keys(req.body) //get an array of keys of the obj passed
    const allowedUpdates = ["completed", "description"]
    const isValidOperation = updates.every((update) => { //every run a function for every element of the array and return a boolean if success
        return allowedUpdates.includes(update)
    })
    if(!isValidOperation){
        return res.status(400).send({error: "Invalid update!"})
    }

    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
        if(!task){
            return res.status(404).send()
        }

        updates.forEach((update) => task[update] = req.body[update])
        await task.save()

        res.send(task)
    } catch (e) {
        res.status(500).send("Error! " + e)
    }
})

// DELETE SPECIFIC TASK
router.delete("/tasks/:id", auth, async (req, res) =>{
    try {
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send("Error! " + e)
    }
})

module.exports = router