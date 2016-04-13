# Piping Hot

A javascript utility library for creating pipe-able events.

## Inspiration

This library was inspired by my own need to create a predictable way to work with "observables" or rather events that you want to transform, merge and react to. I've used a lot of stream and observable libraries but found that there were certain aspects of them that I found confusing or troublesome. Piping Hot tries to create a very simple paradigm for dealing with async events in the client and piping them. The "Hot" part comes from Rx where they have this concept of hot vs cold observables; hot being the ones that produce events regardless if an object is listening or ready for them e.g. mouse events, web socket messages, etc...

## Pipes and Sources

These are the two objects in this library. A **source** is what is creating events (next, error, complete) and a **pipe** is what is connected to a source to receive these events and do something with them, or rather the values attached to them.

Simple Example:
``` javascript
var source = PH.source(function(next, end, complete) {
  var count = 0;
  setInterval(function() {
    next(count++);
  });
});

PH.pipe(source)
.map(add1)
.onNext(function(value) {
  console.log('onNext', value);
});

source.start();
```

### Stateless

Both pipes and sources are stateless when it comes to the values they are pushing; they have no current next or error value. You can't connect a pipe to an already started source and get the last value it produced. Once a message has been pushed from the source and through a pipe, the source and pipe have no record of it; it's gone (unless you use pipe's collect but we'll talk about that later).

### Controlled Starts

Sources do not start pushing values unless you explicitly turn them on. Just adding a pipe to a source doesn't do this. Why? You want to be able to control when the flow of data starts and set up your pipes and transforms before those events start flowing right? You want to be able to add multiple pipes to a single source if you want more than one module reacting to a source's events.


## Credits

I was heavily influenced by (and probably directly stole code) from [flyd](https://github.com/paldepind/flyd), [highland](http://highlandjs.org), and [RxJs](https://github.com/Reactive-Extensions/RxJS).
