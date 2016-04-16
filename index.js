var createPipe;

function addPipe(state, pipe) {
  if (state.pipes.indexOf(pipe) === -1) {
    state.pipes.push(pipe);
  }
}

function _next(state, value) {
  state.observers.next.forEach(function(obs) {
    obs(value);
  });
  state.pipes.forEach(function(pipe) {
    pipe.next(value);
  });
}

function _error(state, value) {
  state.observers.error.forEach(function(obs) {
    obs(value);
  });
  state.pipes.forEach(function(pipe) {
    pipe.error(value);
  });
}

function _complete(state, value) {
  if (state.sourceCount < 2) {
    state.observers.complete.forEach(function(o) {
      o(value);
    });
    state.pipes.forEach(function(pipe) {
      pipe.complete(value);
    });
    state.pipes = [];
    Object.keys(state.observers).forEach(function(key) {
      state.observers[key] = [];
    });
  }
  state.sourceCount--;
}

function addSource(source) {
  var p = createPipe(this, source);
  return p;
}

function onAction(state, action, fn) {
  state.observers[action].push(fn);
  return this;
}

// Pipe Utils

function map(state, fn) {
  var p = createPipe(this);
  p.next = function(value) {
    this._next(fn(value));
  };
  return p;
}

function scan(state, fn, acc) {
  var p = createPipe(this);
  p.next = function(value) {
    this._next(acc = fn(acc, value));
  };
  return p;
}

function filter(state, fn) {
  var p = createPipe(this);
  p.next = function(value) {
    if (fn(value)) {
      this._next(value);
    }
  };
  return p;
}

function collect(state, count) {
  var p = createPipe(this);
  var history = [];
  p._nextPre = p._next;
  p._next = function(message) {
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
      p._nextPre(message);
    });
    p._next = p._nextPre;
    history = [];
  };
  return p;
}

function take(state, count) {
  var p = createPipe(this);
  p._nextPre = p._next;
  p._next = function(message) {
    if (count > 0) {
      p._nextPre(message);
      count--;
    } else {
      p._next = function() {};
    }
  };
  return p;
}

function completeOnError() {
  var p = createPipe(this);
  p.preError = p.error;
  p.error = function() {
    p.preError.apply(p, arguments);
    p.complete();
  };
  return p;
}

function reroute(fn) {
  var p = createPipe();
  fn(this, p);
  return p;
}

createPipe = function() {
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
  p._next = _next.bind(p, state);
  p._error = _error.bind(p, state);
  p._complete = _complete.bind(p, state);

  // Public API
  p.next = p._next;
  p.error = p._error;
  p.complete = p._complete;

  p.onNext = onAction.bind(p, state, 'next');
  p.onError = onAction.bind(p, state, 'error');
  p.onComplete = onAction.bind(p, state, 'complete');

  p.map = map.bind(p, state);
  p.scan = scan.bind(p, state);
  p.filter = filter.bind(p, state);
  p.collect = collect.bind(p, state);
  p.take = take.bind(p, state);
  p.reroute = reroute.bind(p);

  p.completeOnError = completeOnError.bind(p);
  p.addPipe = addPipe.bind(null, state);
  p.addSource = addSource.bind(p);

  return p;
};


module.exports = {
  pipe: createPipe
};
