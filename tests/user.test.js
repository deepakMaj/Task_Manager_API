const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/user");

const userId = new mongoose.Types.ObjectId();
const user = {
  _id: userId,
  name: "Mike Well",
  email: "mikewell@gmail.com",
  password: "mike12345",
  tokens: [{
    token: jwt.sign({ _id: userId }, process.env.JWT_SECRET)
  }]
};

beforeEach(async () => {
  await User.deleteMany();
  await new User(user).save();
});

test("Should sign up a new user", async () => {
  await request(app)
    .post("/users")
    .send({
      name: "John Doe",
      email: "johndoe@gmail.com",
      password: "1234567"
    }).expect(201);
});

test("Should login existing user", async () => {
  await request(app)
    .post("/users/login")
    .send({
      email: user.email,
      password: user.password
    }).expect(200);
});

test("Should not login non existent user", async () => {
  await request(app)
    .post("/users/login")
    .send({
      email: "jd@gmail.com",
      password: "1234567"
    }).expect(400);
});

test("Should get profile for a user", async () => {
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${user.tokens[0].token}`)
    .send()
    .expect(200)
});

test("Should not get profile for unauthenticated user", async () => {
  await request(app)
    .get("/users/me")
    .send()
    .expect(401);
});

test("Should delete authenticated user profile", async () => {
  await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${user.tokens[0].token}`)
    .send()
    .expect(200)
});

test("Should not delete unauthenticated user profile", async () => {
  await request(app)
    .delete("/users/me")
    .send()
    .expect(401);
});