const request = require("supertest")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const app = require("../src/app")
const User = require("../src/models/user")

const dummyUserOneID = new mongoose.Types.ObjectId()
const dummyUserOne = {
    _id: dummyUserOneID,
    name: "MikeDummy",
    email: "myke@dummy.com",
    password: "MyPass123!",
    tokens:[{
        token: jwt.sign({_id: dummyUserOneID}, process.env.JWT_SECRET)
    }]
}

beforeEach(async () => {
    await User.deleteMany()
    await new User(dummyUserOne).save()
})

afterEach(() => {
    console.log("after each")
})

test("Should signup a new user", async () =>{
    const response = await request(app).post("/users").send({ //sending fake data to test DB
        name: "Rosario",
        email: "rosario@example.com",
        password: "Mcxcxx123!"
    }).expect(201)

    //Assert that the db was chanegd correctly
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    //Assertions about response
    expect(response.body).toMatchObject({
        user:{
            name: "Rosario",
            email: "rosario@example.com"
        },
        token: user.tokens[0].token
    })
})

test("Should login existing user", async () =>{
    await request(app).post("/users/login").send({
        email: dummyUserOne.email,
        password: dummyUserOne.password
    }).expect(200)
})

test("Should get profile for user", async () =>{
    await request(app).
    get("/users/me")
    .set("Authorization", `Bearer ${dummyUserOne.tokens[0].token}`)
    .send()
    .expect(200)
})

test("Should not get profile for not authenticated user", async () =>{
    await request(app).
    get("/users/me")
    .send()
    .expect(401)
})

test("Should delete account for user", async () => {
    await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${dummyUserOne.tokens[0].token}`)
    .send()
    .expect(200)
})

test("Should not delete account for user", async () => {
    await request(app)
    .delete("/users/me")
    .send()
    .expect(401)
})