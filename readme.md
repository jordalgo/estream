# Piping Hot

A javascript utility library for creating pipe-able events.

Simple Example:
```javascript
var pipe = PH.pipe();

pipe.onNext(function(x) {
  console.log('I got a next: ', x);
});

pipe.next(100);

// I got a next: 100
```

## Inspiration

This library was inspired by my own need to create a predictable way to work with "observables" or rather events that you want to transform, merge and react to. I've used a lot of stream and observable libraries but found that there were certain aspects of them that I found confusing or problematic. Piping Hot tries to create a very simple abstraction for dealing with async events in the client and piping them. The "Hot" part comes from Rx where they have this concept of hot vs cold observables; hot being the ones that produce events regardless if an object is listening or ready for them e.g. mouse events, web socket messages, etc...

## Pipes

This is the abstraction. Every pipe has next, error, and complete methods. Every pipe also has onNext, onError, onComplete. Next values can be transformed, errors signify that something went wrong, and complete means that no more next values or errors will be passed through this pipe.

#### Stateless

Pipes are stateless when it comes to the values they are pushing; they have no current value (be it an error, next, or complete), though when pipe's "complete" they will sever all connections to their parent pipes and their observers. Connecting a pipe to another pipe will only yield future values. Once a message has been pushed through a pipe, it has no record of it; it's gone (unless you use pipe's collect but we'll talk about that later).

#### Transformations

Pipes have the ability to transform (map, scan) values that pass through them. These transformations only act on "next" values and not on "error" values. Similar to Maybe and Either monads.

#### Chaining

Pipes can be easily chained, or connected, together. All of the transformation methods yield a new pipe that connects to the previous one. The previous pipe has a record of this new pipe and passes along next, error, and complete values to it. A pipe can have multiple pipes connected to it.

```javascript
const pipe1 = PH.pipe();
const pipe2 = PH.pipe();

pipe1
.map(add1) // this map creates a new pipe
.onNext(console.log.bind(console)); // this is called on the pipe created by map

const pipe3 = PH.pipe(pipe1, pipe2); // pipe3 will now get messages from pipe1 and pipe2
```

#### Async Piped to Async

When you want to listen to a pipe's events and trigger another async event, you can use `reroute`. This effectively breaks the pipe chain and puts the responsibility of reconnecting it on you. Here is an example:

```javascript
var pipe1 = PH.pipe();

pipe1.reroute(function(parentPipe, childPipe) {
  parentPipe.onNext(function(val) {
    // simulate a network request
    setTimeout(function() {
      childPipe.next(val + 10);
    }, 1000);
  });
  // reconnect error and complete
  parentPipe.onError(childPipe.error);
  parentPipe.onComplete(childPipe.complete);
})
.scan(sum)
.map(add1)
.onNext(console.log.bind(console));
```


## Credits

I was heavily influenced by (and probably directly stole code) from [flyd](https://github.com/paldepind/flyd), [highland](http://highlandjs.org), and [RxJs](https://github.com/Reactive-Extensions/RxJS).
