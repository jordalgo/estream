# Estream

A javascript utility library for working with event streams in the browser.

#### [Estream API](./api/estream.md)

## Summary
Estreams, or event streams, are a simple abstraction for reacting to async events. Estreams deal with three different [event types](#event-types): data, error, and end. Estreams at their most basic are stateless transfer tools that just take in events and push them out to subscribers. Unlike many other reactive libraries that conflate the concept of data streams, event streams, observables and even data within static arrays, Estream tackles a single use-case and that is async events, which can happen once or continuously throughout the life-cycle of an app.

## Event Types

* **EsData** - These are objects that are used to represent successful data.
* **EsError** - These are objects that are used to represent an error.
* **EsEnd** - These are objects that are used to represent an end to an estream. All values are wrapped in an array as estreams can have multiple source estreams that end. Once an end is emitted by a stream, no more events will be emitted and all references to the subscribing functions will be removed.

## Example
```javascript
var clickStream = estream({
  start: function(push, error, end) {
    var handleClick = function(e) {
      push(e);
    };
    document.body.addEventListener('click', handleClick);
    return handleClick;
  },
  stop: function(handleClick) {
    document.body.removeEventListener('click', handleClick);
  }
});

clickStream.onData(function(value) {
  // value == clickEvent
});
```

[More Examples](./examples)

## Combining Estreams

Use the combine function: `var estream3 = ES.combine([estream1, estream2])`: this wil flow data and errors from both estream1 and estream2 into estream3. However, the combined stream will not end until all of it's parent/source estreams have ended.

## Estream Options
An object passed as the second parameter when creating new estreams.

* **history** (default: 0): If you set a number greater than 0 on the history than the estream will keep a record of that number of events stored in a history array. Use this if a subscriber gets added to a stream after it has started and you don't want to miss any past events.

## Inspiration

This library was inspired by my own need to create a predictable way to work with events that you want to transform, combine and observe. I've used a lot of stream and observable libraries but found that there were certain aspects of them that I found confusing or problematic. Estream tries to create a very simple abstraction for dealing with async events in the client.

## Credits

I was heavily influenced by (and probably directly stole code) from [flyd](https://github.com/paldepind/flyd), [highland](http://highlandjs.org), [xstream](https://github.com/staltz/xstream), [RxJs](https://github.com/Reactive-Extensions/RxJS), and [Bacon](https://baconjs.github.io/)
