const express = require('express');
const WebSocket = require('ws');
const { EventEmitter } = require('events');


const PORT = process.env.PORT || 3000;
const app = express();
const server = app.listen(PORT, () => console.log('listening on port ' + PORT));
app.get('/', (req, res, next) => {
  next();
})
app.use(express.static('src/commandline'));

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req)
  })
})
  
const wss = new WebSocket.Server({ noServer: true });

const rooms = [{
  roomName: 'default',
  clients: [],
}];

const wsmessage = new EventEmitter();

wss.on('connection', (ws) => {
  console.log('a connection');
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
          break;
        default:
          wsmessage.emit('messagereceived', ws, message);
      };
    }
  });

  wsmessage.on('messagereceived', (sender, message) => {
    if (ws.acceptMessages && ws !== sender && ws.room === sender.room) {
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
