const amqp = require("amqplib");

const queueConsume = "Grid-Level-Instructions";
const queueSend = "CompletedInstructions";
const rabbitmqUrl = "amqp://20.190.124.233:5672/";

class RabbitMQHandler {
	constructor() {
		this.connection = null;
		this.channel = null;
		this.messages = [];
		this.initialize();
	}

	async initialize() {
		try {
			this.connection = await amqp.connect(rabbitmqUrl);
			this.channel = await this.connection.createChannel();
			console.log("RabbitMQ connection established.");
		} catch (err) {
			console.warn("Error initializing RabbitMQ:", err);
		}
	}

	async listenForMessages() {
		console.log("listenForMessages");
		this.messages = [];

		if (!this.channel) {
			console.warn("Channel is not initialized.");
			return;
		}

		// await this.channel.assertQueue(queueConsume, { durable: true });
		await this.channel.consume(
			queueConsume,
			async (message) => {
				const resData = await JSON.parse(message.content.toString());
				console.log("resData : ", resData);
				await this.messages.push(resData);
			},
			{ noAck: true }
		);

		return this.messages;
	}

	async sendMessage(data) {
		if (!this.channel) {
			console.warn("Channel is not initialized.");
			return;
		}

		try {
			await this.channel.assertQueue(queueSend, { durable: true });
			await this.channel.sendToQueue(
				queueSend,
				Buffer.from(JSON.stringify(data))
			);
			console.log("Message sent successfully.");
		} catch (err) {
			console.warn("Error sending message:", err);
		}
	}

	async closeConnection() {
		try {
			await this.connection.close();
			console.log("RabbitMQ connection closed.");
		} catch (err) {
			console.warn("Error closing RabbitMQ connection:", err);
		}
	}
}

module.exports = RabbitMQHandler;
