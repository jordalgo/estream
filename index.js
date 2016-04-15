var TYPE_ERROR = 'error';
var TYPE_NEXT = 'next';
var TYPE_COMPLETE = 'complete';

var createPipe;

function addPipe(state, pipe) {
  if (state.pipes.indexOf(pipe) === -1) {
    state.pipes.push(pipe);
  }
}

function _notify(state, message) {
  if (message.type === TYPE_COMPLETE) {
    if (state.sourceCount < 2) {
      state.observers[message.type].forEach(function(o) {
        o(message.value);
      });
      state.pipes.forEach(function(pipe) {
        pipe[message.type](message.value);
      });
      state.pipes = [];
      Object.keys(state.observers).forEach(function(key) {
        state.observers[key] = [];
      });
    }
    state.sourceCount--;
  } else {
    state.observers[message.type].forEach(function(o) {
      o(message.value);
    });
    state.pipes.forEach(function(pipe) {
      pipe[message.type](message.value);
    });
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

function pipeMessage(type, value) {
  this._notify({
    type: type,
    value: value
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
  p.next = function(value) {
    this._notify({
      value: acc = fn(acc, value),
      type: TYPE_NEXT
    });
  }
  return p;
}

function filter(state, fn) {
  var p = createPipe(this);
  p.next = function(value) {
    if (fn(value)) {
      this._notify({
        value: value,
        type: TYPE_NEXT
      });
    }
  };
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

function reroute(fn) {
  var p = createPipe();
  fn(this, p);
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
  p.filter = filter.bind(p, state);
  p.collect = collect.bind(p, state);
  p.take = take.bind(p, state);
  p.reroute = reroute.bind(p);

  p.addPipe = addPipe.bind(null, state);
  p.addSource = addSource.bind(p);

  return p;
}


module.exports = {
  pipe: createPipe
};
