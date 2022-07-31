const cluster = require("cluster");

if (cluster.isMaster) {
	const cpuCount = require("os").cpus().length;

	for (var i = 0; i < cpuCount; i += 1) {
		cluster.fork();
	}

	cluster.on("exit", function (worker) {
		console.log("Worker " + worker.id + " died :(");
		cluster.fork();
	});
} else {
	const express = require("express");

	const withDDB = require("./middleware/ddb");
	const auth = require("./routers/auth");

	const app = express();
	app.use(express.json());
	app.use(withDDB);
	const http = require("http").Server(app);
	const io = require("socket.io")(http);
	app.set(io);

	app.get("/", (req, res) => {
		res.send("Cuttr API");
	});
	app.use("/auth/", auth);

	const port = process.env.PORT || 3000;
	http.listen(port, function () {
		console.log(`[${process.pid}] Listening on port ${port}`);
	});
}
