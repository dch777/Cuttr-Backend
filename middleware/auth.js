const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
	const token =
		req.body.token ||
		req.query.token ||
		req.headers["x-access-token"] ||
		req.cookies.token;

	if (!token) {
		res.status(401).send("Unauthorized: No token provided");
	} else {
		jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
			if (err) {
				res.status(401).send("Unauthorized: Invalid token");
			} else {
				req.email = decoded.email;
				return next();
			}
		});
	}
};
