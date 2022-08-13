const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { getLine } = require("../middleware/lines.js");
const {
	getUserByJWT,
	validateClient,
	validateCustomer,
} = require("../middleware/auth.js");

const linesRouter = express.Router();
const linesTable = "cuttr-lines";
linesRouter.use(getUserByJWT);

linesRouter.get("/", (req, res) => {
	const ddb = req.ddb;
	const user = req.user;

	getLineParams = {
		TableName: linesTable,
	};

	ddb.scan(getLineParams, (err, data) => {
		if (err) {
			console.error(`[${process.pid}] ${err}`);
			res.status(500).send("Server error");
		} else res.status(200).send(data.Items);
	});
});

linesRouter.get("/:id", getLine, (req, res) => {
	res.status(200).send(req.line);
});

linesRouter.post("/add", validateClient, (req, res) => {
	const ddb = req.ddb;
	const uuid = uuidv4();
	const owner_id = req.user.uuid.S;
	const { address, lat, long } = req.body;

	const addLineParams = {
		TableName: linesTable,
		Item: {
			uuid: { S: uuid },
			owner_id: { S: owner_id },
			address: { S: address },
			lat: { N: lat.toString() },
			long: { N: long.toString() },
			customers: { L: [] },
		},
	};

	ddb.putItem(addLineParams, (err, data) => {
		if (err) {
			console.error(`[${process.pid}] ${err}`);
			res.status(500).send("Server error");
		} else res.status(200).send("Line created");
	});
});

linesRouter.post("/:id/update", [getLine, validateClient], (req, res) => {
	const ddb = req.ddb;
	const io = req.app.get("io");
	const uuid = req.params.id;
	const new_line = req.body.line;

	const updateLineParams = {
		TableName: linesTable,
		Key: {
			uuid: { S: uuid },
		},
		UpdateExpression: "SET customers = :c",
		ExpressionAttributeValues: {
			":c": { L: new_line },
		},
		ReturnValues: "ALL_NEW",
	};

	ddb.updateItem(updateLineParams, (err, data) => {
		if (err) {
			console.error(`[${process.pid}] ${err}`);
			res.status(500).send({ error: "Server Error" });
		} else if (data.Attributes) {
			io.emit(`line-${uuid}-update`, data.Attributes);
			res.status(200).send("Updated line");
		} else {
			res.status(401).send({ error: "Not found" });
		}
	});
});

linesRouter.post("/:id/delete", [getLine, validateClient], (req, res) => {
	const ddb = req.ddb;
	const uuid = req.params.id;

	const deleteLineParams = {
		TableName: linesTable,
		Key: {
			uuid: { S: uuid },
		},
	};

	ddb.deleteItem(deleteLineParams, (err, data) => {
		if (err) {
			console.error(`[${process.pid}] ${err}`);
			res.status(500).send({ error: "Server Error" });
		} else res.status(200).send("Line deleted");
	});
});

linesRouter.post("/:id/advance", [getLine, validateClient], (req, res) => {
	const ddb = req.ddb;
	const io = req.app.get("io");
	const uuid = req.params.id;

	const advanceLineParams = {
		TableName: linesTable,
		Key: {
			uuid: { S: uuid },
		},
		UpdateExpression: "REMOVE customers[0]",
		ReturnValues: "ALL_NEW",
	};

	ddb.updateItem(advanceLineParams, (err, data) => {
		if (err) {
			console.error(`[${process.pid}] ${err}`);
			res.status(500).send({ error: "Server Error" });
		} else if (data.Attributes) {
			io.emit(`line-${uuid}-update`, data.Attributes);
			res.status(200).send("Advanced line");
		} else {
			res.status(401).send({ error: "Not found" });
		}
	});
});

linesRouter.post("/:id/kick", [getLine, validateClient], (req, res) => {
	const ddb = req.ddb;
	const io = req.app.get("io");
	const uuid = req.params.id;
	const customer_id = req.body.customer_id;
	const customers = req.line.customers.L.map((customer) => customer.S);
	const idx = customers.indexOf(customer_id);

	if (idx === -1) {
		return res.status(401).send("Customer not in line");
	}

	const kickLineParams = {
		TableName: linesTable,
		Key: {
			uuid: { S: uuid },
		},
		UpdateExpression: `REMOVE customers[${idx}]`,
		ReturnValues: "ALL_NEW",
	};

	ddb.updateItem(kickLineParams, (err, data) => {
		if (err) {
			console.error(`[${process.pid}] ${err}`);
			res.status(500).send({ error: "Server Error" });
		} else if (data.Attributes) {
			io.emit(`line-${uuid}-update`, data.Attributes);
			res.status(200).send("Customer kicked");
		} else {
			res.status(401).send({ error: "Not found" });
		}
	});
});

linesRouter.get("/locate", validateCustomer, (req, res) => {});

linesRouter.post("/:id/join", [getLine, validateCustomer], (req, res) => {
	const ddb = req.ddb;
	const io = req.app.get("io");
	const customers = req.line.customers.L.map((customer) => customer.S);
	const uuid = req.params.id;
	const customer_id = req.user.uuid.S;

	if (customers.includes(customer_id)) {
		return res.status(200).send("Customer already in line");
	}

	const joinLineParams = {
		TableName: linesTable,
		Key: {
			uuid: { S: uuid },
		},
		UpdateExpression: "SET customers = list_append(customers, :c)",
		ExpressionAttributeValues: {
			":c": { L: [{ S: customer_id }] },
		},
		ReturnValues: "ALL_NEW",
	};

	ddb.updateItem(joinLineParams, (err, data) => {
		if (err) {
			console.error(`[${process.pid}] ${err}`);
			res.status(500).send({ error: "Server Error" });
		} else if (data.Attributes) {
			io.emit(`line-${uuid}-update`, data.Attributes);
			res.status(200).send("Joined line");
		} else {
			res.status(401).send({ error: "Not found" });
		}
	});
});

linesRouter.post("/:id/leave", [getLine, validateCustomer], (req, res) => {
	const ddb = req.ddb;
	const io = req.app.get("io");
	const uuid = req.params.id;
	const customer_id = req.user.uuid.S;
	const customers = req.line.customers.L.map((customer) => customer.S);
	const idx = customers.indexOf(customer_id);
	console.log(customers);
	console.log(customer_id);
	console.log(idx);

	if (idx === -1) {
		return res.status(401).send("Customer not in line");
	}

	const leaveLineParams = {
		TableName: linesTable,
		Key: {
			uuid: { S: uuid },
		},
		UpdateExpression: `REMOVE customers[${idx}]`,
		ReturnValues: "ALL_NEW",
	};

	ddb.updateItem(leaveLineParams, (err, data) => {
		if (err) {
			console.error(`[${process.pid}] ${err}`);
			res.status(500).send({ error: "Server Error" });
		} else if (data.Attributes) {
			io.emit(`line-${uuid}-update`, data.Attributes);
			res.status(200).send("Left line");
		} else {
			res.status(401).send({ error: "Not found" });
		}
	});
});

module.exports = linesRouter;
