const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(process.env.PORT || 3004, () => {
      console.log("Server running at http://localhost:3004");
    });
  } catch (error) {
    console.log(`DB Error : ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/admins", async (request, response) => {
  const { username, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM admins WHERE username = '${username}'; `;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `INSERT INTO admins 
     (username, password, gender, location) VALUES 
     (
         '${username}', 
         '${hashedPassword}', 
         '${gender}', 
         '${location}');`;
    await db.run(createUserQuery);
    response.send("Admin created successfully");
  } else {
    response.status(400);
    response.send("Admin already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const getAccessQuery = `
    SELECT * FROM admins WHERE username = '${username}';`;
  const dbUser = await db.get(getAccessQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login Success");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

// insert users into table
app.post("/users/", async (request, response) => {
  const userDetails = request.body;
  const values = userDetails.map(
    (eachUser) =>
      `(${eachUser.userId}, ${eachUser.id}, '${eachUser.title}', '${eachUser.body}')`
  );

  const valuesString = values.join(",");
  const insertDataQuery = `
    INSERT INTO user (user_id, id, title, body) 
    VALUES 
       ${valuesString};`;
  await db.run(insertDataQuery);
  response.send("User Added Successfully");
});

// Get users data
app.get("/users/", async (request, response) => {
  const getUsersQuery = ` SELECT * FROM users ; `;
  const usersData = await db.all(getUsersQuery);
  response.send(usersData);
});

module.exports = app;
