# Estream

A javascript utility library for working with event streams in the browser.

#### [Estream API](./api/estream.md)

## Summary
Estreams, or event streams, are a simple abstraction for reacting to async events. Estreams deal with three different [event types](#event-types): data, error, and end. Estreams at their most basic are stateless transfer tools that just take in events and push them out to consumers. Unlike many other reactive libraries that conflate the concept of data streams, event streams, observables and even data within static arrays, Estream tackles a single use-case and that is async events, which can happen once or continuously throughout the life-cycle of an app.

## Event Types

* **EsData** - These are objects that are used to represent successful data.
* **EsError** - These are objects that are used to represent an error, either from the source itself or internally in the stream (e.g. like from a failed map function)
* **EsEnd** - These are objects that are used to represent an end to an estream. All values are wrapped in an array as estreams can have multiple source estreams that end. Once an end is emitted by a stream, no more events will be emitted and all references to the consuming functions will be removed.

## Example
```javascript
var clickStream = estream();
var count = 0;
document.addEventListener('click', function(e) {
  clickStream.push(++count);
});

clickStream.onData(function(value) {
  // value == count
});
```

[More Examples](./examples)

## Combining Estreams

Use the combine function: `var estream3 = ES.combine([estream1, estream2])`: this wil flow data and errors from both estream1 and estream2 into estream3. However, the combined stream will not end until all of it's parent/source estreams have ended.

## Estream Options
An object passed as the second parameter when creating new estreams.

* **buffer** (default: true): If the buffer is on and events are pushed into an Estream they will get stored in the buffer (an array), then once a consumer is added, all the previous events will flow into the consumer as individual actions in the same call stack. You can also pull individual events from the buffer with `getBuffer`.

## Unidirectional
Estreams flow one way. A consumer cannot trigger an estream to push data or execute a function, nor can it pass data up the stream to be used in some way. However, because anything that has acesss to a stream can push data into it, you can set up a circular flow of reactive estreams. For example:

```javascript
var estream = require('./estream');

var s1 = estream();
var s2 = estream();

s1.onData(function(val) {
  // simulate a server or async action
  setTimeout(function() {
    s2.push(val + 5);
  }, 500);
});

s2.onData(function(val) {
  setTimeout(function() {
    s1.push(val + 10);
  }, 500);
});

s1.push(1); // kick things off.
```


## Inspiration

This library was inspired by my own need to create a predictable way to work with events that you want to transform, combine and observe. I've used a lot of stream and observable libraries but found that there were certain aspects of them that I found confusing or problematic. Estream tries to create a very simple abstraction for dealing with async events in the client.

## Credits

I was heavily influenced by (and probably directly stole code) from [flyd](https://github.com/paldepind/flyd), [highland](http://highlandjs.org), [RxJs](https://github.com/Reactive-Extensions/RxJS), and [Bacon](https://baconjs.github.io/)
