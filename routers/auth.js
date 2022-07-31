const express = require("express");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { getUserByEmail, getUserByJWT } = require("../middleware/auth.js");

const authRouter = express.Router();
const authTable = "cuttr-auth";

authRouter.post("/signup", getUserByEmail, (req, res) => {
	const ddb = req.ddb;
	const uuid = uuidv4();
	const { email, username, password, phone, client } = req.body;

	if (!req.user) {
		const signUp = {
			TableName: authTable,
			Item: {
				uuid: { S: uuid },
				email: { S: email },
				username: { S: username },
				password: { S: password },
				phone: { N: phone.toString() },
				client: { BOOL: client },
			},
		};

		ddb.putItem(signUp, (err, data) => {
			if (err) {
				console.error(`[${process.pid}] ${err}`);
				res.status(500).send("Server error");
			} else res.status(200).send("User created");
		});
	} else {
		res.status(403).send({ error: "User Exists" });
	}
});

authRouter.post("/login", getUserByEmail, (req, res) => {
	const { password } = req.body;

	if (!req.user) {
		res.status(401).json({
			error: "Account does not exist",
		});
	} else if (req.user.password.S === password) {
		const payload = req.user.uuid;
		const token = jwt.sign({ payload }, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});

		res.status(200).send({ token: token });
	} else {
		res.status(401).json({
			error: "Incorrect email or password",
		});
	}
});

authRouter.get("/data", getUserByJWT, (req, res) => {
	console.log(req.user);
	res.status(200).send(req.user);
});

module.exports = authRouter;
