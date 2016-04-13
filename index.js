var TYPE_ERROR = 'error';
var TYPE_NEXT = 'next';
var TYPE_END = 'end';

var createPipe;

function addPipe(state, pipe) {
  state.pipes.push(pipe);
}

// Sources

function startError() {
  console.warn('This source has already started.');
}

function next(state, value) {
  if (state.ended) {
    throw new Error('You pushed a value to an ended source');
  }
  if (!state.open) {
    return;
  }
  state.pipes.forEach(function(pipe) {
    pipe.next(value);
  });
}

function error(state, value) {
  if (state.ended) {
    throw new Error('You pushed an error to an ended source');
  }
  if (!state.open) {
    return;
  }
  state.pipes.forEach(function(pipe) {
    pipe.error(value);
  });
}

function end(state) {
  if (state.ended) {
    return;
  }
  state.ended = true;
  if (!state.open) {
    return;
  }
  state.pipes.forEach(function(pipe) {
    pipe.end()
  });
  state.pipes = [];
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
    ended: false,
    endsOnError: false,
    pipes: []
  };

  // Public API
  s.addPipe = addPipe.bind(null, state);
  s.start = function(delay) {
    if (arguments.length) {
      setTimeout(function() {
        fn(next.bind(null, state), error.bind(null, state), end.bind(null, state));
      }, delay);
    } else {
      fn(next.bind(null, state), error.bind(null, state), end.bind(null, state));
    }
    s.start = startError;
    return s;
  }
  s.close = close.bind(null, state);
  s.open = open.bind(null, state);
  s.hasEnded = function() {
    return state.ended;
  };

  return s;
}

// Pipes

function _severSources(state) {
  state.sourceCount = 0;
}

function _notify(state, message) {
  state.pipes.forEach(function(pipe) {
    pipe[message.type](message.value);
  });
  if (message.type === TYPE_NEXT || message.type === TYPE_ERROR) {
    state.observers[message.type].forEach(function(o) {
      o(message.value);
    });
  } else {
    if (state.sourceCount < 2) {
      state.observers.end.forEach(function(ob) {
        ob();
      });
      state.observers = {
        next: [],
        error: [],
        end: []
      }
      state.pipes = [];
      state.sourceCount = 0;
    } else {
      state.sourceCount--;
    }
  }
}

function addSource(state, source) {
  state.sourceCount++;
  source.addPipe(this)
  return this;
}

function onAction(state, action, fn) {
  state.observers[action].push(fn);
  return this;
}

function pipeMessage(type, value) {
  this._notify({
    value: value,
    type: type
  });
}

// Pipe Utils

function map(state, fn) {
  var p = createPipe();
  p.next = function(value) {
    this._notify({
      value: fn(value),
      type: TYPE_NEXT
    });
  };
  state.pipes.push(p);
  return p;
}

function scan(state, fn, acc) {
  var p = createPipe();
  p.next = function(val) {
    this._notify({
      value: acc = fn(acc, val),
      type: TYPE_NEXT
    });
  }
  state.pipes.push(p);
  return p;
}

function collect(state, count) {
  var p = createPipe();
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
  state.pipes.push(p);
  return p;
}

function take(state, count) {
  var p = createPipe();
  p._notifyPre = p._notify;
  p._notify = function(message) {
    p._notifyPre(message);
    count--;
    if (count < 1) {
      p._severSources();
      p._notifyPre({
        type: TYPE_END
      });
    }
  };
  state.pipes.push(p);
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
      error: [],
      end: []
    }
  };

  // Private
  p._notify = _notify.bind(p, state);
  p._severSources = _severSources.bind(p, state);

  // Public API
  p.onNext = onAction.bind(p, state, TYPE_NEXT);
  p.onError = onAction.bind(p, state, TYPE_ERROR);
  p.onEnd = onAction.bind(p, state, TYPE_END);

  p.next = pipeMessage.bind(p, TYPE_NEXT);
  p.error = pipeMessage.bind(p, TYPE_ERROR);
  p.end = pipeMessage.bind(p, TYPE_END);

  p.map = map.bind(null, state);
  p.scan = scan.bind(null, state);
  p.collect = collect.bind(null, state);
  p.take = take.bind(null, state);

  p.addPipe = addPipe.bind(null, state);
  p.addSource = addSource.bind(p, state);

  return p;
}


module.exports = {
  pipe: createPipe,
  source: createSource
};
