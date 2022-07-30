const AWS = require("aws-sdk");
AWS.config.region = process.env.REGION || "us-east-1";
const ddb = new AWS.DynamoDB();

module.exports = (req, res, next) => {
	req.ddb = ddb;
	next();
};
