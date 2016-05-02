# Estream

A javascript utility library for working with stream-like events in the browser.

#### [Estream API](./api)

## Summary

Estreams work similar to Node read streams in that you can listen for data, errors, and end events coming through the streams and send data via `push`, errors with `error` and end with, well, `end`. The big difference between estreams and node streams is that estreams don't have a buffer but rather a **history**. Events unlike single files, which you might process with a read stream, are not meant to be treated as a single unit. Also, Estreams don't have a current "value", they keep track of what is passed through them (errors and data) in chronological order so that you can debug them easily, pull specific segments of the history, and replay the stream. Streams, by default, have their history on, but you can turn this off if you don't have a need to keep track of the events.

## Combining Estreams

Combining estreams is very easy. All you have to do is pass the streams you want to merge as arguments when you create a new stream e.g. `var estream3 = ES(estream1, estream2)`: this wil flow data and errors from both estream1 and estream2 into estream3.

## Estream Endings

When a stream ends, all consumer references are removed so you don't have to explicitly call `off` (think unsubscribe). Also, if an estream has multiple parent estreams then the child estream won't emit an end until all of the parent estreams have ended.

## Examples:

Basic Example:
```javascript
var ES = require('estreams');
var estream = ES();

estream.on('data', function(x) {
  console.log('I got some data: ', x);
})
.on('error', function(x) {
  console.log('I got an error: ', x.message);
})
.on('end', function() {
  console.log('The estream ended');
});


estream.push(5);
estream.error(new Error('boom'));
estream.end();
```

Chained Transformation:
```javascript
var estream = ES();

estream
.map(add1)
.scan(sum, 10)
.on('data', function(x) {
  console.log(x);
});

estream.push(5);
// logs "16" to the console
```

Removing a Consumer
```javascript
var dataConsumer = function(x) {
  console.log('I got data: ', x);
};

estream.on('data', dataConsumer);
estream.off('data', dataConsumer);
```


## Inspiration

This library was inspired by my own need to create a predictable way to work with events that you want to transform, merge and observe. I've used a lot of stream and observable libraries but found that there were certain aspects of them that I found confusing or problematic. Estream tries to create a very simple abstraction for dealing with async events in the client.

## Credits

I was heavily influenced by (and probably directly stole code) from [flyd](https://github.com/paldepind/flyd), [highland](http://highlandjs.org), [RxJs](https://github.com/Reactive-Extensions/RxJS), and [Bacon](https://baconjs.github.io/)
