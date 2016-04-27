# Estream

A javascript utility library for working with stream-like events in the browser.

#### [Estream API](./api)

## Summary

Estreams work similar to Node read/write streams in that you can listen for data, errors, and end events coming through the streams. You can push new data into the streams by calling `push` on your stream and passing in a piece of data or an error `new Error('boom')`. If there are consumers of the stream (or connected streams) it will pass along the data to them, otherwise the data is lost. However, you can buffer this data into memory calling `setBuffer(true)` if you want to save all the events for later consumption.

## Combining Estreams

Combining estreams is very easy. All you have to do is pass the streams you want to merge as arguments when you create a new stream e.g. `var s3 = ES(s1, s2)`: this wil flow data and errors from both s1 and s2 into s3.

## Estream Endings

To end an estream just call `push` without any arguments, e.g. `s.push();`. When a stream ends, all consumer references are removed so you don't have to call `off`. Also, if an estream has multiple parent estreams then the child estream won't emit an end until all of the parent estreams have ended.

## Removing a Consumer

```javascript
var dataConsumer = function(x) {
  console.log('I got data: ', x);
};

s.on('data', dataConsumer);
s.off('data', dataConsumer);
```

## Examples:

Basic Example:
```javascript
var ES = require('estreams');
var s = ES();

s
.on('data', function(x) {
  console.log('I got some data: ', x);
})
.on('error', function(x) {
  console.log('I got an error: ', x.message);
})
.on('end', function() {
  console.log('The stream ended');
});


pipe1.push(5);
pipe1.next(new Error('boom'));
pipe1.push(); // calling push with no value is how you end an estream.
```

Chained Transformation:
```javascript
var s = ES();

s
.map(add1)
.scan(sum, 10)
.on('data', function(x) {
  console.log(x);
});

s.push(5);
// 16 logs in the console
```

Buffering Data:
```javascript
var s = ES();

s.setBuffer(true);
s.push(5).push(6).push(10);

setTimeout(function() {
  s.on('data', function(x) {
    console.log(x);
  });
}, 2000);
// [5, 6, 10]
```

## Inspiration

This library was inspired by my own need to create a predictable way to work with events that you want to transform, merge and observe. I've used a lot of stream and observable libraries but found that there were certain aspects of them that I found confusing or problematic. Estream tries to create a very simple abstraction for dealing with async events in the client.

## Credits

I was heavily influenced by (and probably directly stole code) from [flyd](https://github.com/paldepind/flyd), [highland](http://highlandjs.org), and [RxJs](https://github.com/Reactive-Extensions/RxJS).
