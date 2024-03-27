// const express = require("express");
// const serverless = require("serverless");
// const cors = require("cors");
// const http = require("http");
// const { Server } = require("socket.io");
// const amqp = require("amqplib");
// require("dotenv").config();
// const { exec } = require("child_process");

// const PORT = process.env.PORT || 8000;
// const app = express();

// const server = http.createServer(app);
// const io = new Server(server, {
// 	cors: {
// 		origin: [
// 			"http://localhost:3000/",
// 			"https://multi-directional-shuttle.vercel.app/",
// 		],
// 		methods: ["GET", "POST"],
// 	},
// });

// const queueConsume = "Grid-Level-Instructions";
// const queueSend = "CompletedInstructions";
// const rabbitmqUrl = "amqp://20.190.124.233:5672/";
// const queueLiveLogs = "LiveLogs";
// let channel;

// amqp
// 	.connect(rabbitmqUrl)
// 	.then((connection) => connection.createChannel())
// 	.then((chnl) => {
// 		channel = chnl;
// 		console.log("Channel created...");
// 		return channel.assertQueue(queueConsume, { durable: true });
// 	})
// 	.then(() => {
// 		return channel.consume(
// 			queueConsume,
// 			async (message) => {
// 				const resData = JSON.parse(message.content.toString());
// 				console.log("resData : ", resData);
// 				io.emit("response", resData);
// 			},
// 			{ noAck: true }
// 		);
// 	})
// 	.then(() => {
// 		return channel.consume(
// 			queueLiveLogs,
// 			async (message) => {
// 				const resData = JSON.parse(message.content.toString());
// 				io.emit("responseLiveLogs", resData);
// 			},
// 			{ noAck: true }
// 		);
// 	})
// 	.catch((error) => {
// 		console.error("Error connecting to RabbitMQ", error);
// 	});

// io.on("connection", (socket) => {
// 	socket.on("sendData", async (data) => {
// 		if (channel) {
// 			try {
// 				await channel.assertQueue(queueSend, { durable: true });
// 				await channel.sendToQueue(queueSend, Buffer.from(JSON.stringify(data)));
// 			} catch (err) {
// 				console.error("Error Receiving RabbitMQ Messages List:", err);
// 			}
// 		}
// 	});

// 	socket.on("disconnect", () => {
// 		console.log("Client disconnected");
// 	});
// });

// server.listen(PORT, function () {
// 	console.log(`Example app listening on port ${PORT}!`);
// });

// module.exports.handler = serverless(app)
const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const amqp = require("amqplib");
require("dotenv").config();
const { exec } = require("child_process");

const PORT = process.env.PORT || 8000;
const app = express();

app.use(cors()); // Enable CORS

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: [
			"http://localhost:3001/",
			"https://multi-directional-shuttle.vercel.app/",
		],
		methods: ["GET", "POST"],
	},
});

const router = express.Router(); // Create a router

const queueConsume = "Grid-Level-Instructions";
const queueSend = "CompletedInstructions";
const rabbitmqUrl = "amqp://20.190.124.233:5672/";
const queueLiveLogs = "LiveLogs";
let channel;

amqp
	.connect(rabbitmqUrl)
	.then((connection) => connection.createChannel())
	.then((chnl) => {
		channel = chnl;
		console.log("Channel created...");
		return channel.assertQueue(queueConsume, { durable: true });
	})
	.then(() => {
		return channel.consume(
			queueConsume,
			async (message) => {
				const resData = JSON.parse(message.content.toString());
				console.log("resData : ", resData);
				io.emit("response", resData);
			},
			{ noAck: true }
		);
	})
	.then(() => {
		return channel.consume(
			queueLiveLogs,
			async (message) => {
				const resData = JSON.parse(message.content.toString());
				io.emit("responseLiveLogs", resData);
			},
			{ noAck: true }
		);
	})
	.catch((error) => {
		console.error("Error connecting to RabbitMQ", error);
	});

io.on("connection", (socket) => {
	socket.on("sendData", async (data) => {
		if (channel) {
			try {
				await channel.assertQueue(queueSend, { durable: true });
				await channel.sendToQueue(queueSend, Buffer.from(JSON.stringify(data)));
			} catch (err) {
				console.error("Error Receiving RabbitMQ Messages List:", err);
			}
		}
	});

	socket.on("disconnect", () => {
		console.log("Client disconnected");
	});
});

router.get("/", (req, res) => {
    res.send("App is running..");
});

app.use("/.netlify/functions/app", router); // Mount the router
server.listen(PORT, function () {
	console.log(`Example app listening on port ${PORT}!`);
});

module.exports.handler = serverless(app);
