const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const amqp = require("amqplib");
require("dotenv").config();

const PORT = 8000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: [
			"http://localhost:3000/",
			"https://multi-directional-shuttle.vercel.app/",
		],
		methods: ["GET", "POST"],
	},
});

// const rabbitHandler = new RabbitMQHandler();
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
		console.log("Channle created...");
	})
	.catch((error) => {
		console.error("Error connecting to RabbitMQ", error);
	});

io.on("connection", (socket) => {
	socket.on("message", async () => {
		if (channel) {
			try {
				await channel.assertQueue(queueConsume, { durable: true });
				await channel.consume(
					queueConsume,
					async (message) => {
						const resData = await JSON.parse(message.content.toString());
						console.log("resData : ", resData);
						await socket.emit("response", resData);
					},
					{ noAck: true }
				);
			} catch (err) {
				console.error("Error Receiving RabbitMQ Messages List:", err);
			}
		}
	});

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

	// socket.on("liveLogs", async () => {
	// 	console.log("liveLogs");
	// 	try {
	// 		const logs = await rabbitHandler.liveLogs();
	// 		await socket.emit("responseLiveLogs", logs);
	// 	} catch (err) {
	// 		console.error("Error sending data to RabbitMQ:", err);
	// 	}
	// });

	socket.on("disconnect", () => {
		console.log("Client disconnected");
	});
});

server.listen(PORT, function () {
	console.log(`Example app listening on port ${PORT}!`);
});
