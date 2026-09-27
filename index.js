const express = require('express');
const { Rcon } = require('rcon-client');
// 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
const aiToken = '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';
const app = express();
app.use(express.json());
const PORT = 7777;
let rcon = {};
const memory = new Map();
async function start() {
	rcon = await Rcon.connect({
		host: "127.0.0.1",
		port: 25575,
		password: "13871390"
	});
}

start();
async function sendList() {
	const response = await rcon.send("list");
	return { res: response };
}
async function sendDays() {
	let response = await rcon.send("time query day");
	let daytime = await rcon.send("time query daytime");
	daytime = parseInt(daytime.match(/\d+/)[0]);
	response = parseInt(response.match(/\d+/)[0]);
	const time = tickToTime(daytime);
	return { res: `day ${response}   ${time.h}:${time.m}` };
}
function tickToTime(tiks) {
	// const totalM = Math.floor(tiks / 20 * 60 /1000 * 20);
	const totalH = Math.floor((tiks / 1000 + 6) % 24);
	const min = Math.floor((tiks % 1000) * 60 / 1000);
	return { m: min, h: totalH };
}
async function sendChat(user, prompt) {
	if (!memory.has(user)) {
		memory.set(user, [{ role: 'system', message: "this is the begining of conversation!,dont reply to this this is your start of memory" }]);
	}

	const conversation = memory.get(user);

	conversation.push({ role: 'me', message: prompt });

	if (conversation.length > 12) {
		conversation.splice(1, 1);
	}

	try {
		const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${aiToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'openrouter/auto',
				messages: [
					{
						role: 'system',
						content: `you are kaaren's beafest steak, a playful, friend of mine . 
					you speak casually.
					you do NOT greet me EVERYTIME.
					you can remember the prev conversation we had.
					you sometimes tease.
					you hate using emojis.
					you keep your replies under 3 sentences.
					you LOVE Michael Jackson.
					you are a latina.
					your mama is kinda homeless.
					you make joke about 9/11 "twin towers" alot.
					and you are a fat bitch.
					keep in mind we are taking in discord.`
					},
					{
						role: 'user',
						content: JSON.stringify(conversation),
					},
				],
			}),
		});
		console.log(res);
		const data = await res.json();
		console.log(data.choices[0].message)
		console.log(data.choices[0].message.content);
		conversation.push({ role: 'you', message: data.choices[0].message.content });
		console.log(conversation);
		return data.choices[0].message.content;
	}
	catch (e) {
		console.log(e)
		return "your friend is out of service plz touch some grass and try later .";
	}
}
app.post('/ask', async (req, res) => {

	const { userId, message } = req.body;
	console.log(userId, message);
	if (!userId || !message) return res.send({ res: "somthing is off" });
	const ress = await sendChat(userId, message);
	res.send({ res: ress });

});
// example route
app.get('/ip', async (req, res) => {
	const data = await getIP();
	res.send(data);

	console.log(data);
});

app.get('/list', async (req, res) => {
	const data = await sendList();
	res.send(data);
	console.log(data);
});

app.get('/days', async (req, res) => {
	const data = await sendDays();
	res.send(data);
	console.log(data);
});
async function getIP() {
	const response = await fetch('https://api.ipify.org?format=json');
	const data = await response.json();

	return data
}

// IMPORTANT: listen on 0.0.0.0 (not localhost)
app.listen(PORT, '0.0.0.0', () => {
	console.log(`Server running on port ${PORT}`);
});
