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
		origin: "https://multi-directional-shuttle.vercel.app/",
		methods: ["GET", "POST"],
		credentials: true,
	},
});

const rabbitHandler = new RabbitMQHandler();

io.on("connection", (socket) => {
	socket.on("message", async () => {
		try {
			const messages = await rabbitHandler.listenForMessages();
			console.log("Received RabbitMQ Messages List:", messages);
			await socket.emit("response", messages);
		} catch (err) {
			console.error("Error Receiving RabbitMQ Messages List:", err);
		}
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

	socket.on("liveLogs", async () => {
		console.log("liveLogs");
		try {
			const logs = await rabbitHandler.liveLogs();
			await socket.emit("responseLiveLogs", logs);
		} catch (err) {
			console.error("Error sending data to RabbitMQ:", err);
		}
	});

	socket.on("disconnect", () => {
		console.log("Client disconnected");
	});
});

server.listen(PORT, function () {
	console.log(`Example app listening on port ${PORT}!`);
});
