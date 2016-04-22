# Piping Hot

A javascript utility library for creating pipe-able events (sometimes called streams or observables).

## Pipes

Every pipe has `next`, `error`, and `complete` methods. Every pipe also has a `subscribe` where you can listen for next, error, and complete events. Next values can be transformed, errors signify that something went wrong, and complete means that no more next values or errors will be passed through this pipe.

#### [Pipe API](./api)

#### Stateless

Pipes are stateless when it comes to the values that flow through them; they have no current value (be it an error, next, or complete), though when pipes "complete" they will sever all connections to their child pipes and their observers.

#### Transformations

Pipes have the ability to transform (map, scan, filter, etc...) values that pass through them. These transformations only act on "next" values and not on "error" values. Similar to Maybe and Either monads.

#### Chaining

Pipes can be easily chained, or connected, together. All of the transformation methods yield a new pipe that connects to the previous one. The previous pipe has a record of this new pipe and passes along next, error, and complete values to it. A pipe can have multiple pipes connected to it. You can also as easily compose these functions if you prefer.

#### Extendable

Instead of having a ton of methods on the pipe object, you have the ability to add methods onto base pipes to take advantage of chainability.

#### ECMAScript Observable

Pipes are mostly compliant with this [proposal](https://github.com/zenparsing/es-observable) with that difference that pipe observers/subscribers don't control when pipes begin to emit data. A pipe will push data and transform it, even if nothing is listening; much in the same way that click events take place even if you haven't added an event listener. This allows for easily connecting of pipes together and for multiple subscribers to listen to a single pipe and not have it affect when an async event begins to get handled.

## Examples:

Basic Example:
```javascript
var pipe1 = PH.pipe();

var unsubscribe = pipe1.subscribe({
  next: function(x) {
    console.log('got a next', x);
  },
  error: function(err) {
    console.log('got an error', err.message);
  },
  complete: function() {
    console.log('got a pipe completion');
  }
});

pipe1.next(5);
pipe1.error(new Error('boom'));
pipe1.complete();
```

Chained Transformation:
```javascript
var pipe1 = PH.pipe();
var add1 = function(x) { return x + 1; };
var sum = function(acc, val) { return acc + val; };

pipe1
.map(add1) // creates a new pipe
.scan(sum, 10) // creates a new pipe
.forEach(function(x) { // alias for subscribing to next
  console.log('got a next', x);
})

pipe1.next(5);
// got a next 16
```

Pipe to Async Pipe (Rerouting):
```javascript
var pipe1 = PH.pipe();

pipe1.reroute(function(parentPipe, childPipe) {
  parentPipe.subscribe({
    next: function(val) {
      // simulate a network request
      setTimeout(function() {
        childPipe.next(val + 10);
      }, 1000);
    },
    error: childPipe.error.bind(childPipe),
    complete: childPipe.complete.bind(childPipe)
  });
})
.forEach(console.log.bind(console));

pipe1.next(10);

// 20 after 1 second.
```

## Inspiration

This library was inspired by my own need to create a predictable way to work with events that you want to transform, merge and observe. I've used a lot of stream and observable libraries but found that there were certain aspects of them that I found confusing or problematic. Piping Hot tries to create a very simple abstraction for dealing with async events in the client and piping them. The "Hot" part comes from Rx where they have this concept of hot vs cold observables; hot being the ones that produce events regardless if an object is listening or ready for them e.g. mouse events, web socket messages, etc...

## Credits

I was heavily influenced by (and probably directly stole code) from [flyd](https://github.com/paldepind/flyd), [highland](http://highlandjs.org), and [RxJs](https://github.com/Reactive-Extensions/RxJS).
