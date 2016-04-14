var TYPE_ERROR = 'error';
var TYPE_NEXT = 'next';

var createPipe;

function addPipe(state, pipe) {
  if (state.pipes.indexOf(pipe) === -1) {
    state.pipes.push(pipe);
  }
}

// Sources

function startError() {
  console.warn('This source has already started.');
  return this;
}

function sourceMessage(state, type, value, last) {
  if (state.complete) {
    throw new Error('You pushed a value to a completed source');
  }
  if (last) {
    state.complete = true;
    if (state.open) {
      state.pipes.forEach(function(pipe) {
        pipe[type](value, last);
      });
    }
    state.pipes = [];
    return;
  }
  if (state.open) {
    state.pipes.forEach(function(pipe) {
      pipe[type](value, last);
    });
  }
}

function close(state) {
  state.open = false;
}

function open(state) {
  state.open = true;
}

function createSource(fn) {
  var s = {};
  var state = {
    open: true,
    complete: false,
    pipes: []
  };

  // Public API
  s.addPipe = addPipe.bind(null, state);
  s.start = function(delay) {
    if (arguments.length) {
      setTimeout(function() {
        fn(sourceMessage.bind(null, state, TYPE_NEXT), sourceMessage.bind(null, state, TYPE_ERROR));
      }, delay);
    } else {
      fn(sourceMessage.bind(null, state, TYPE_NEXT), sourceMessage.bind(null, state, TYPE_ERROR));
    }
    s.start = startError.bind(s);
    return s;
  }
  s.close = close.bind(null, state);
  s.open = open.bind(null, state);
  s.hasCompleted = function() {
    return state.complete;
  };

  return s;
}

// Pipes

function _notify(state, message) {
  var finalLast = false;
  if (message.last) {
    if (state.sourceCount < 2) {
      finalLast = true;
    }
    state.sourceCount--;
  }
  state.observers[message.type].forEach(function(o) {
    o(message.value, finalLast);
  });
  state.pipes.forEach(function(pipe) {
    pipe[message.type](message.value, finalLast);
  });
  if (finalLast) {
    state.pipes = [];
  }
}

function addSource(source) {
  var p = createPipe(this, source);
  return p;
}

function onAction(state, action, fn) {
  state.observers[action].push(fn);
  return this;
}

function pipeMessage(type, value, last) {
  this._notify({
    type: type,
    value: value,
    last: last
  });
}

// Pipe Utils

function map(state, fn) {
  var p = createPipe(this);
  p.next = function(value, last) {
    this._notify({
      value: fn(value),
      type: TYPE_NEXT,
      last: last
    });
  };
  return p;
}

function scan(state, fn, acc) {
  var p = createPipe(this);
  p.next = function(value, last) {
    this._notify({
      value: acc = fn(acc, value),
      type: TYPE_NEXT,
      last: last
    });
  }
  return p;
}

function collect(state, count) {
  var p = createPipe(this);
  var history = [];
  p._notifyPre = p._notify;
  p._notify = function(message) {
    history.push(message);
    if (count) {
      if (count > 1) {
        count--;
      } else {
        p.drain();
      }
    }
  };
  p.drain = function() {
    history.forEach(function(message) {
      p._notifyPre(message);
    });
    p._notify = p._notifyPre;
    history = [];
  };
  return p;
}

function take(state, count) {
  var p = createPipe(this);
  p._notifyPre = p._notify;
  p._notify = function(message) {
    if (count > 0) {
      p._notifyPre(message);
      count--;
    } else {
      p._notify = function() {};
    }
  };
  return p;
}


function createPipe() {
  var p = function() {};
  var sources = Array.prototype.slice.call(arguments);
  sources.forEach(function(source) {
    source.addPipe(p);
  });
  var state = {
    sourceCount: sources.length,
    pipes: [],
    observers: {
      next: [],
      error: []
    }
  };

  // Private
  p._notify = _notify.bind(p, state);

  // Public API
  p.onNext = onAction.bind(p, state, TYPE_NEXT);
  p.onError = onAction.bind(p, state, TYPE_ERROR);

  p.next = pipeMessage.bind(p, TYPE_NEXT);
  p.error = pipeMessage.bind(p, TYPE_ERROR);

  p.map = map.bind(p, state);
  p.scan = scan.bind(p, state);
  p.collect = collect.bind(p, state);
  p.take = take.bind(p, state);

  p.addPipe = addPipe.bind(null, state);
  p.addSource = addSource.bind(p);

  return p;
}


module.exports = {
  pipe: createPipe,
  source: createSource
};
