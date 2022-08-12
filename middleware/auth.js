const jwt = require("jsonwebtoken");

const authTable = "cuttr-auth";

const getUserByEmail = (req, res, next) => {
	const ddb = req.ddb;
	const { email } = req.body;

	const getUserByEmailParams = {
		TableName: authTable,
		IndexName: "email-index",
		ExpressionAttributeValues: {
			":e": { S: email },
		},
		KeyConditionExpression: "email = :e",
	};

	ddb.query(getUserByEmailParams, (err, data) => {
		if (err) {
			console.error(`[${process.pid}] ${err}`);
			res.status(500).send({ error: "Server Error" });
		} else {
			req.user = data.Items[0];
			return next();
		}
	});
};

const getUserByJWT = (req, res, next) => {
	const ddb = req.ddb;

	const token =
		req.body.token ||
		req.query.token ||
		req.headers["x-access-token"] ||
		req.cookies.token;

	if (!token) {
		res.status(401).send({ error: "No token provided" });
	} else {
		jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
			if (err) {
				res.status(401).send({ error: "Invalid token" });
			} else {
				const uuid = decoded.payload.S;
				const getUserByIDParams = {
					TableName: authTable,
					Key: {
						uuid: { S: uuid },
					},
				};

				ddb.getItem(getUserByIDParams, (err, data) => {
					if (err) {
						console.error(`[${process.pid}] ${err}`);
						res.status(500).send({ error: "Server Error" });
					} else if (data.Item) {
						req.user = data.Item;
						delete req.user.password;
						return next();
					} else {
						res.status(401).send({ error: "Invalid token" });
					}
				});
			}
		});
	}
};

const validateClient = (req, res, next) => {
	const { client } = req.user;
	const { uuid } = req.user;
	if (!req.user) {
		res.status(401).set("Not logged in");
	} else if (!req.line && client.BOOL) {
		req.owner_id = uuid.S;
		next();
	} else {
		res.status(403).set("Must be client to access");
	}
};

const validateCustomer = (req, res, next) => {
	const { client } = req.user;
	if (!req.user) {
		res.status(401).set("Not logged in");
	} else if (!client.BOOL) {
		next();
	} else {
		res.status(403).set("Must be customer to access");
	}
};

module.exports = {
	getUserByEmail,
	getUserByJWT,
	validateClient,
	validateCustomer,
};
