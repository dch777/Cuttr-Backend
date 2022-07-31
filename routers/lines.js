const express = require("express");
const {
	getUserByJWT,
	validateClient,
	validateCustomer,
} = require("../middleware/auth.js");

const linesRouter = express.Router();
const linesTable = "cuttr-lines";
linesRouter.use(getUserByJWT);

linesRouter.post("/add", validateClient, (req, res) => {});

linesRouter.get("/locate", validateCustomer, (req, res) => {});

linesRouter.get("/:id/join", validateCustomer, (req, res) => {});

module.exports = linesRouter;
