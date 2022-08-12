const linesTable = "cuttr-lines";

const getLine = (req, res, next) => {
	const ddb = req.ddb;
	const uuid = req.params.id || req.body.id;

	if (!uuid) {
		res.status(401).send({ error: "No Line ID provided" });
	} else {
		const getLineParams = {
			TableName: linesTable,
			Key: {
				uuid: { S: uuid },
			},
		};

		ddb.getItem(getLineParams, (err, data) => {
			if (err) {
				console.error(`[${process.pid}] ${err}`);
				res.status(500).send({ error: "Server Error" });
			} else if (data.Item) {
				req.line = data.Item;
				return next();
			} else {
				res.status(404).send({ error: "Line not found" });
			}
		});
	}
};

module.exports = { getLine };
