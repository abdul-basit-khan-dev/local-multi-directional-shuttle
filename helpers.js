const amqp = require("amqplib");

const queueConsume = "Grid-Level-Instructions";
const queueSend = "CompletedInstructions";
const rabbitmqUrl = "amqp://20.190.124.233:5672/";
let messages = [];

async function listenForMessages() {
	console.log("listenForMessages");
	messages = [];

	try {
		const connection = await amqp.connect(rabbitmqUrl);
		const channel = await connection.createChannel();
		console.log("messages-1 : ", messages);

		await channel.assertQueue(queueConsume, { durable: true });
		await channel.consume(
			queueConsume,
			async (message) => {
				const resData = await JSON.parse(message.content.toString());
				console.log("resData : ", resData);
				await messages.push(resData);
			},
			{ noAck: true }
		);
		return messages;
	} catch (err) {
		console.warn(err);
	}
}

async function sendMessage(data) {
	try {
		const connection = await amqp.connect(rabbitmqUrl);
		const channel = await connection.createChannel();

		await channel.assertQueue(queueSend, { durable: true });
		await channel.sendToQueue(queueSend, Buffer.from(JSON.stringify(data)));

		console.log("Message sent successfully.");
	} catch (err) {
		console.warn("Error sending message:", err);
	}
}

module.exports = { listenForMessages, sendMessage };
