# Estream

A javascript utility library for working with stream-like events in the browser.

#### [Estream API](./api/estream.md)

## Summary
Estreams, or event streams, are a simple abstraction for listening to async events. Estreams deal with three different [event types](#event-types): data, error, and end. Estreams at their most basic are stateless transfer tools that just take in events and push them out to consumers. Unlike many other reactive libraries that conflate the concept of event streams, data streams, observables and even data within static arrays, Estream tackles a single use-case and that is async events, which can happen once or continuously throughout the life-cycle of an app.

## Event Types

#### [EsData](./api/estream.md#esdata)
These are objects that are used to represent successful data.

#### [EsError](./api/estream.md#eserror)
These are objects that are used to represent an error, either from the source itself or internally in the stream.

#### [EsEnd](./api/estream.md#esend)
These are objects that are used to represent an end to an estream. All values are wrapped in an array as estreams can have multiple source estreams that end. Once an end is emitted by a stream, no more events will be emitted and all references to the consuming functions will be removed.

## Example
```javascript
var backendStream = estream(function(push, error, end) {
  setInterval(function() {
    pollForData(function(err, res) {
      if (err) {
        error(err);
      } else {
        push(res);
      }
    });
  }, 1000);
});

backendStream.onData(function(data) {
  // got some data
});

backendStream.onError(function(error) {
  // got an error
});
```

## Combining Estreams

Combining estreams is very easy. All you have to do is pass the streams you want to merge in an array when you create a new stream e.g. `var estream3 = ES.combine([estream1, estream2])`: this wil flow data and errors from both estream1 and estream2 into estream3. However, the combined stream will not end until all of it's parent or source estreams have ended.

## Estream Options
An object passed as the second parameter when creating new estreams.

* **buffer** (default: true): If the buffer is on and events are pushed into the Estream they will get stored in the buffer (an array), then once a consumer is added, all the previous events will flow into the consumer as individual actions in the same call stack. You can also pull individual events from the buffer with `getBuffer`.

## Inspiration

This library was inspired by my own need to create a predictable way to work with events that you want to transform, combine and observe. I've used a lot of stream and observable libraries but found that there were certain aspects of them that I found confusing or problematic. Estream tries to create a very simple abstraction for dealing with async events in the client.

## Credits

I was heavily influenced by (and probably directly stole code) from [flyd](https://github.com/paldepind/flyd), [highland](http://highlandjs.org), [RxJs](https://github.com/Reactive-Extensions/RxJS), and [Bacon](https://baconjs.github.io/)
