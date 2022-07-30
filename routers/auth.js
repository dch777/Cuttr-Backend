const express = require("express");
const jwt = require("jsonwebtoken");

const authRouter = express.Router();
const authTable = "cuttr-auth";

authRouter.post("/signup", (req, res) => {
	const ddb = req.ddb;
	const uuid = req.body.id;

	var params = {
		TableName: authTable,
		Item: {
			uuid: { S: uuid },
			name: { S: uuid },
		},
	};

	ddb.putItem(params, (err, data) => {
		if (err) res.set(`[${process.pid}] ${err}`);
		else res.set(`[${process.pid}] ${data}`);
	});
});

// authRouter.post("/login", (req, res) => {
// 	const { email, password } = req.body;
// 	User.findOne({ email }, (err, user) => {
// 		if (err) {
// 			console.error(err);
// 			res.status(500).json({
// 				error: "Internal error please try again",
// 			});
// 		} else if (!user) {
// 			res.status(401).json({
// 				error: "Incorrect email or password",
// 			});
// 		} else if (user.verifyPassword(password)) {
// 			const payload = { email };
// 			const token = jwt.sign(payload, process.env.JWT_SECRET, {
// 				expiresIn: "1h",
// 			});
// 			res.cookie("token", token, { httpOnly: true }).sendStatus(200);
// 		} else {
// 			res.status(401).json({
// 				error: "Incorrect email or password",
// 			});
// 		}
// 	});
// });

// authRouter.post("/register", function (req, res) {
// 	const { email, password, firstName, lastName } = req.body;
// 	const user = new User({ email, password, firstName, lastName, points: 0 });
// 	user.save(function (err) {
// 		if (err) {
// 			console.error(err);
// 			res.status(500).send("Server error, try again");
// 		} else {
// 			res.status(200).send("New user registered");
// 		}
// 	});
// });

// authRouter.post("/logout", withAuth, function (req, res) {
// 	const email = req.email;
// 	User.findOne({ email }, (err, user) => {
// 		if (err) {
// 			console.error(err);
// 			res.status(500).json({
// 				error: "Internal error please try again",
// 			});
// 		} else {
// 			res
// 				.cookie("token", "", { httpOnly: true, expires: new Date() })
// 				.sendStatus(200);
// 		}
// 	});
// });

// authRouter.get("/verifyToken", withAuth, function (req, res) {
// 	const email = req.email;
// 	User.findOne({ email }, (err, user) => {
// 		user = user.toObject();
// 		delete user.password;
// 		res.status(200).json(user);
// 	});
// });

// authRouter.get("/:id", function (req, res) {
// 	const id = mongoose.Types.ObjectId(req.params.id.trim());

// 	User.findById({ _id: id }, (err, user) => {
// 		user = user.toObject();
// 		delete user.password;
// 		res.status(200).json(user);
// 	});
// });

module.exports = authRouter;
