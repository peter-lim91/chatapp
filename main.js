const express = require('express');
const WebSocket = require('ws');
// const cors = require('cors');
const path = require('path');
// const { v4: uuidv4 } = require('uuid');
const { EventEmitter } = require('events');


const app = express();
const port = process.env.PORT || 3000;
app.listen(port, () => console.log('listening on port ' + port));
app.use(express.static('src/commandline'));
  
const wss = new WebSocket.Server({
  port: 8080,
});

const rooms = [{
  roomName: 'default',
  clients: [],
}];

const wsmessage = new EventEmitter();

wss.on('connection', (ws) => {
  ws.room = rooms[0];
  ws.room.clients.push(ws);
  ws.send('What is your Name?');
  ws.acceptMessages = false;

  ws.on('message', function incoming(message) {
    if (!ws.name) {
      ws.name = message;
      ws.send('Welcome ' + ws.name + '!');
      ws.acceptMessages = true;
    } else {
      switch (message.split(" ")[0]) {
        case 'room':
          changeRoom(ws, message);
          break;
        case 'clients':
          const clients = () => {
            for (const client of ws.room.clients) {
              console.log(client.name);
            }
            for (const room of rooms) {
              console.log(room.roomName);
            }
          }
          console.log(clients());
          // ws.send(rooms.clients.toString());
          break;
        default:
          wsmessage.emit('messagereceived', ws, message);
      };
    }
  });

  wsmessage.on('messagereceived', (sender, message) => {
    if (ws.acceptMessages && ws !== sender) {
      ws.send(sender.name + ': ' + message);
    }
  })  
});


function changeRoom(ws, message) {
  ws.room.clients.splice(ws.room.clients.indexOf(ws), 1);
  let room;
  const roomName = message.split(" ")[1];
  room = rooms.find((room) => room.roomName === roomName);
  if (room === undefined) {
    console.log('couldnt find oom');
    room = {
      roomName: roomName,
      clients: [],
    };
    rooms.push(room);
  }
  ws.room = room;
  ws.room.clients.push(ws);
  ws.send('You are now in room ' + ws.room.roomName);
}
