import bcrypt from "bcrypt";
import pool from "../config/db.js";

const hashAndInsertUsers = async () => {
  const saltRounds = 10;

  const users = [
    { username: "admin", password: "1234", role: "admin" },
    { username: "pharma", password: "1234", role: "pharmacist" },
  ];

  for (let user of users) {
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);

    await pool.query(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
      [user.username, hashedPassword, user.role]
    );
  }

  console.log("Users inserted with hashed passwords 🔐");
};

hashAndInsertUsers();