# Estream

A javascript utility library for working with stream-like events in the browser.

#### [Estream API](./api/estream.md)

## Summary

Estreams, or event streams, are a simple abstraction for listening to async events. Estreams deal with three different [event types](#event-types): data, error, and end. Estreams at their most basic are stateless transfer tools that just take in events and push them out to consumers. Unlike many other reactive libraries that conflate the concept of streams and observables and even data within static arrays, Estream tackles a single use-case and that is async events, which can happen once or continuously throughout the life-cycle of an app.

Events, unlike chunks of data or a value that can change over time, require their own custom helpers. For example, instead of a buffer, where data is kept in chunks, events (and Estreams) have a history. Events are also immutable, which is why if you map over a piece of data from one event, it becomes another. Estreams can also replay events, combine event streams, and filter, scan, map, reduce, and debounce events.

## Event Types

#### [EsData](./api/estream.md#esdata)
These are objects that are used to represent successful data. `estream.push(new ES.data('my val'))` or, the easier way, `estream.push('my val')`, which wraps the value in an EsData object. To listen to these events:
```javascript
estream.on(function(x) {
  x.isData // true
  x.value // 'my val'
});
```

#### [EsError](./api/estream.md#eserror)
These are objects that are used to represent an error, either from the source itself or internally in the stream. `estream.push(new ES.error('boom'))` or, the easier way, `estream.error('boom')`, which wraps the value in an EsError object. To listen to these events:
```javascript
estream.on(function(x) {
  x.isError // true
  x.value // 'boom'
});
```

#### [EsEnd](./api/estream.md#esend)
These are objects that are used to represent an end to an estream. `estream.push(new ES.end('end'))` or, the easier way, `estream.end('end')`, which wraps the value in an EsEnd object. Once an end is emitted by a stream, no more events will be emitted and all references to the consuming functions will be removed. To listen to these events:
```javascript
estream.on(function(x) {
  x.isEnd // true
  x.value // 'end'
});
```

## Combining Estreams

Combining estreams is very easy. All you have to do is pass the streams you want to merge as arguments when you create a new stream e.g. `var estream3 = ES([estream1, estream2])`: this wil flow data and errors from both estream1 and estream2 into estream3. However, the combined stream will not end until all of it's parent or source estreams have ended e.g. `estream1.end(); estream2.end` will cause `estream3` to end and emit an end event.

## Examples:

Basic Example:
```javascript
var ES = require('estreams');
var estream = ES();

estream.on(function(x) {
  console.log('I got some data: ', x.value);
});

estream.push(5);
```

Chained Transformation:
```javascript
var estream = ES();

estream
.map(add1)
.scan(sum, 10)
.on('data', function(x) {
  console.log(x.value);
});

estream.push(5);
// logs "16" to the console
```

Removing a Consumer
```javascript
var dataConsumer = function(x) {
  console.log('I got data: ', x);
};

var off = estream.on('data', function(x) {
  // do something cool with data
});
off();
```

## Estream Options

* **history** (default: false): When true the Estream keeps a record of all events that pass through it, which you can get by calling `getHistory`.
* **buffer** (default: true): If the buffer is on and events are pushed into the Estream, then once a consumer is added, all the previous events will flow into the consumer as individual actions.
* **detach** (default: true): This removes the references to all of an estream's consumers so that they can be garbage collected.

Example:
```javascript
var estream = ES(null, { history: true, detach: false });
```

## Inspiration

This library was inspired by my own need to create a predictable way to work with events that you want to transform, merge and observe. I've used a lot of stream and observable libraries but found that there were certain aspects of them that I found confusing or problematic. Estream tries to create a very simple abstraction for dealing with async events in the client.

## Credits

I was heavily influenced by (and probably directly stole code) from [flyd](https://github.com/paldepind/flyd), [highland](http://highlandjs.org), [RxJs](https://github.com/Reactive-Extensions/RxJS), and [Bacon](https://baconjs.github.io/)
