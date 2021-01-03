const HOST = location.origin.replace(/^http/, 'ws');
// const HOST = 'ws://localhost/server:3000'
const socket = new WebSocket(HOST);

socket.addEventListener('message', function (ev) {
  line.queueResponse(ev.data);
  console.log(ev);
});

