# Estream

A javascript library that provides a simple and understandable abstraction for subscribing to and transforming events in the browser.

## [Estream API](./api/estream.md)

## What Kind of Events ?

A big usecase for this library are "push" events or rather events that you don't control or trigger; think I/O events like mouse clicks, or Web Socket messages, or the computer clock. These are events you can listen for or ignore but they will occur regardless. However, you can also use estreams for making backend request or long-polling streams.

## The Basics

When you create a new estream you pass an object with a mandatory `start` function and an optional `stop` function. When the first subscriber is added the `start` function is called during the run of the next event loop (so you can add multiple subscribers without worrying about missing an event). When the last subscriber is removed (or unsubscribes) then the `stop` function is called (if it exists and also on the next event loop). The stop function is optional because ultimately it is up to this sink/creator object to decide the events that get passed into a stream.

**Note**: The `start` will only ever get re-called if all subscribers have been removed, a `stop` function exists (or `start` returns a function), the stream has not ended, and a new subscriber gets added. It **does not** get recalled every time a new subscriber is added (unlike RxJS).

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
```

## History

If you're worried a subscriber is going to miss out on crucial events because it gets added to an already producing stream, you can set this `history` option on the stream. This will keep X number of events in a history array which gets passed as the second param in every event notification e.g.

```javascript
var stream = estream({ start, stop }, { history: 3 });
stream.on(function(event, history) {
  // A New event occured
}
```

You can also get events from the history by calling `getHistory` on a stream.

The `history` is set to 0 by default because to avoid object build up in estreams.

## Estream Event Types

* **EsData** - These are objects that are used to represent successful data.
* **EsError** - These are objects that are used to represent an error.
* **EsEnd** - These are objects that are used to represent an end to an estream. All values are wrapped in an array as estreams can have multiple source estreams that end. Once an end is emitted by a stream, no more events will be emitted and all references to the subscribing functions will be removed.

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
