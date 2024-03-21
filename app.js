const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const RabbitMQHandler = require("./RabbitMQHandler");
require("dotenv").config();

const PORT = 8000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "http://localhost:3000/",
		methods: ["GET", "POST"],
	},
});
const rabbitHandler = new RabbitMQHandler();

io.on("connection", (socket) => {
	socket.on("message", async () => {
		const messages = await rabbitHandler.listenForMessages();
		// messages.sort((a, b) => parseInt(a.Sequence) - parseInt(b.Sequence));
		console.log("Received RabbitMQ messages:", messages);

		await socket.emit("response", messages);
	});

	socket.on("disconnect", () => {
		console.log("Client disconnected");
	});

	socket.on("sendData", async (data) => {
		console.log("Received data from client:", data);

		try {
			await rabbitHandler.sendMessage(data);
			console.log("Data sent to RabbitMQ successfully.");
		} catch (err) {
			console.error("Error sending data to RabbitMQ:", err);
		}
	});
});

server.listen(PORT, function () {
	console.log(`Example app listening on port ${PORT}!`);
});
