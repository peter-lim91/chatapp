const socket = new WebSocket('ws://localhost:8080');

socket.addEventListener('message', function (ev) {
  line.queueResponse(ev.data);
  console.log(ev);
});

