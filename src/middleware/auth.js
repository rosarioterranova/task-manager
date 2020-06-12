const jwt = require("jsonwebtoken")
const User = require("../models/user")

const auth = async (req, res, next) => {
    try {
        const token = req.header("Authorization").replace("Bearer ","") //get the doken from the header
        const decoded = jwt.verify(token, process.env.JWT_SECRET) //decode the token using the secret string
        const user = await User.findOne({_id: decoded._id, "tokens.token":token }) //search if a user id has this token

        if(!user) throw new Error()

        req.user = user //store the authenticated user on the request parameter
        req.token = token //store the token on the request parameter

        next()

    } catch (e) {
        res.status(401).send({error: "Please authenticate"})
    }
}

module.exports = auth