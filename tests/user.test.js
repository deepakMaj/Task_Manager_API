const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const { userOne, setupDatabase } = require("./fixtures/db");

beforeEach(setupDatabase);

test("Should sign up a new user", async () => {
  const response = await request(app)
    .post("/users")
    .send({
      name: "John Doe",
      email: "johndoe@gmail.com",
      password: "1234567"
    }).expect(201);
  
  const user = await User.findById(response.body.user._id);

  expect(user).not.toBeNull();

  expect(response.body).toMatchObject({
    user: {
      name: "John Doe",
      email: "johndoe@gmail.com"
    },
    token: user.tokens[0].token
  });

  expect(user.password).not.toBe("1234567");
});

test("Should login existing user", async () => {
  const response = await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: userOne.password
    }).expect(200);
  
  const user = await User.findById(userOne._id);

  expect(response.body.token).toBe(user.tokens[1].token);
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
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
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
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(userOne._id);

  expect(user).toBeNull();
});

test("Should not delete unauthenticated user profile", async () => {
  await request(app)
    .delete("/users/me")
    .send()
    .expect(401);
});

test("Should upload avatar image", async () => {
  await request(app)
    .post("/users/me/avatar")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .attach("avatar", "tests/fixtures/profile-pic.jpg")
    .expect(200);

  const user = await User.findById(userOne._id);

  expect(user.avatar).toEqual(expect.any(Buffer));
});

test("Should update valid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: "Emma Watson",
      email: "emmawatson@gmail.com",
      age: 31
    })
    .expect(200);

  const user = await User.findById(userOne._id);

  expect(user).toMatchObject({
    name: "Emma Watson",
    email: "emmawatson@gmail.com",
    age: 31
  });
});

test("Should not update invalid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      location: "London"
    })
    .expect(400);
});