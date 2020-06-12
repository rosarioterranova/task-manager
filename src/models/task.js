const mongoose = require('mongoose')
const validator = require('validator')

const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        lowercase: true,
        validate(value){
            if(value.length <= 6)
                throw new Error("Description too short")
        }
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    }
},{
    timestamps: true //field to track when is created
})

const Task = mongoose.model("Task", taskSchema)

module.exports = Task