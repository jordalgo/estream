var TYPE_ERROR = 'error';
var TYPE_NEXT = 'next';
var TYPE_COMPLETE = 'complete';

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

function complete(state, value) {
  if (state.complete) {
    return;
  }
  state.complete = true;
  if (!state.open) {
    return;
  }
  state.pipes.forEach(function(pipe) {
    pipe.complete(value)
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
    complete: false,
    endsOnError: false,
    pipes: []
  };

  // Public API
  s.addPipe = addPipe.bind(null, state);
  s.start = function(delay) {
    if (arguments.length) {
      setTimeout(function() {
        fn(next.bind(null, state), error.bind(null, state), complete.bind(null, state));
      }, delay);
    } else {
      fn(next.bind(null, state), error.bind(null, state), complete.bind(null, state));
    }
    s.start = startError;
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
  if (message.type !== TYPE_COMPLETE) {
    state.observers[message.type].forEach(function(o) {
      o(message.value);
    });
    state.pipes.forEach(function(pipe) {
      pipe[message.type](message.value);
    });
  } else {
    if (state.sourceCount < 2) {
      state.observers.complete.forEach(function(ob) {
        ob();
      });
      state.pipes.forEach(function(pipe) {
        pipe.complete(message.value);
      });
    }
    state.sourceCount--;
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
  var p = createPipe(this);
  p.next = function(value) {
    this._notify({
      value: fn(value),
      type: TYPE_NEXT
    });
  };
  return p;
}

function scan(state, fn, acc) {
  var p = createPipe(this);
  p.next = function(val) {
    this._notify({
      value: acc = fn(acc, val),
      type: TYPE_NEXT
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
      error: [],
      complete: []
    }
  };

  // Private
  p._notify = _notify.bind(p, state);

  // Public API
  p.onNext = onAction.bind(p, state, TYPE_NEXT);
  p.onError = onAction.bind(p, state, TYPE_ERROR);
  p.onComplete = onAction.bind(p, state, TYPE_COMPLETE);

  p.next = pipeMessage.bind(p, TYPE_NEXT);
  p.error = pipeMessage.bind(p, TYPE_ERROR);
  p.complete = pipeMessage.bind(p, TYPE_COMPLETE);

  p.map = map.bind(p, state);
  p.scan = scan.bind(p, state);
  p.collect = collect.bind(p, state);
  p.take = take.bind(p, state);

  p.addPipe = addPipe.bind(null, state);
  p.addSource = addSource.bind(p, state);

  return p;
}


module.exports = {
  pipe: createPipe,
  source: createSource
};
