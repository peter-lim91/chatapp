document.addEventListener('keydown', checkForEnter);
document.addEventListener('DOMContentLoaded', insertNewLine);
document.addEventListener('DOMContentLoaded', () => line = new CommandLine());


let line;

function refocus(currentLine) {
  currentLine.focus();
}

function getNewLine() {
  const newLineTemplate = document.getElementsByTagName('template')[0];  //added
  const newLine = newLineTemplate.content.firstElementChild.cloneNode(true);
  return newLine;
}

function checkForEnter(e) {
  if (e.code === 'Enter' || e.code === 'NumpadEnter') {
    e.preventDefault();
    line.evaluate();
  } else if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
    e.preventDefault();
    line.getHistory(e.code);
  }
}

function autoGrow(oField) {
  if (oField.scrollHeight > oField.clientHeight) {
    oField.style.height = oField.scrollHeight + "px";
  }
}

function insertNewLine() {
  const newLine = document.body.appendChild(getNewLine());
  const textArea = newLine.getElementsByTagName('textarea')[0];
  textArea.focus();
}

function listOptions(options) {
  let optionsList = '';
  for (const i in options) {
    optionsList += `${parseInt(i) + 1}. ${options[i].name}`
    if (i < (options.length - 1)) {
      optionsList += `\n`
    }
  }
  return optionsList;
}

async function getResponse() {
  const responseHead = await fetch('http://localhost:3000/api/courses/1');
  const response = await responseHead.text();
  return response;
}

class CommandLine {
  constructor() {
    this.assignCommandLine();
    this.ignore = false;
    this.history = [];
    this.historyIndex = 0;
    this.queuedResponses = [];
    this.queuedResponsesProcessing = false;
  }
  get textArea() {
    return this.node.getElementsByTagName('textarea')[0];
  }
  get text() {
    return this.textArea.value;
  }
  set text(text) {
    this.textArea.value = text;
  }

  assignCommandLine() {
    this.node = document.getElementById('command');
    this.textArea.disabled = false;
    this.textArea.focus();
  }

  queueResponse(response) {
    this.queuedResponses.push(response);
    this.pushQueuedResponses();
  }

  async pushQueuedResponses() {
    if (this.queuedResponsesProcessing) return;
    this.queuedResponsesProcessing = true;

    while (this.queuedResponses.length > 0) {
      await this.insertResponse(this.queuedResponses.shift());
    }
    this.queuedResponsesProcessing = false;
  }

  async insertResponse(response) {
    this.ignore = true;
    const delayedInput = () => {
      return new Promise((resolve) => {
        const nextLetter = (index = 1) => {
          if (index < response.length) {
            this.text = response.slice(0, index);
            autoGrow(this.textArea);
            setTimeout(() => nextLetter(index + 1), 20);
          } else {
            this.text = response;
            autoGrow(this.textArea);
            resolve();
          }
        };
        nextLetter();
      });
    };
    await delayedInput();
    this.freezeCommandLine();
    this.ignore = false;
    return 'MessageInserted';
  }

  freezeCommandLine() {
    this.node.removeAttribute('id');
    this.textArea.removeAttribute('oninput');
    this.textArea.removeAttribute('onfocusout');
    this.textArea.disabled = true;
    insertNewLine();
    this.assignCommandLine();
  }

  async evaluate() {
    if (this.ignore) return;
    this.recordHistory(this.text);
    socket.send(this.text);
    this.freezeCommandLine();
    // const response = await getResponse(this.text);
    // await this.insertResponse(response);
    this.ignore = false;
  }

  recordHistory(command) {
    this.history.push(command);
    this.historyIndex = this.history.length;
  }

  getHistory(evt) {
    if (this.history.length === 0) return;
    if (evt === 'ArrowUp') {
      this.historyIndex -= 1;
    } else if (evt === 'ArrowDown') {
      this.historyIndex += 1;
    }
    this.historyIndex = Math.max(Math.min(this.history.length - 1, this.historyIndex), 0);
    this.text = this.history[this.historyIndex];
  }
}