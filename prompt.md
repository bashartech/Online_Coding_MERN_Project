# script.js

const http requirel "http"); const express const Server)

require("express");

const path

require("path");

require("socket.io");

const app express(); const server http.createServer(app); const io new

Server(server):

//Socket.io io.on('connection". (socket) => [ socket.on('user-message", (message) => [ io.emit("message". message); 1):

1):

LTE

app.uselexpress.staticipa th.resolve("./public")));

app.get("/". (req, res) => [ return res.sendFile('/public/ind ex.html"); 1):

server.listen(9000, () => console.log(Server Started at PORT:9000)):


# /public/index.html

<title>Chat

APP</title>

</head>

<body>

<h1>Chatting</h1>

<input type="text"

id="message"

placeholder "Enter

Message' />

<button

id='sendBtn">Send</button

>

<div id="messages">

</div>

<script

src="/socket.io/socket.io

js'></script>

<script>

const socket =

10):

const sendBtn = document.getElementById(" sendBtn"):

const message Input

document.getElementById(" message"):

const allMessages = document.getElementById(" message");

const allMessages document.getElementById(" messages"):

socket.on("message". (message) => {

const p

document.createElement("p

p.innerText =

message:

allMennages.appendChildip 1:

});

sendBtn.addEventListener( 'click', () => {

const message

messageInput.value:

console.log(message):

socket.emit('user-message, message);

</script>

</body>

</html>

