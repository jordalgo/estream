# addMethods

Add methods to the base estream object.
This is so you can chain methods easier.

**Signature**: `[Objects] -> undefined`

**Parameters**

-   `addedMethods` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** an array of objects

**Examples**

```javascript
var estream = require('estream');
var take = require('estream/modules/take');
estream.addMethods([{
 name: 'take',
 fn: take
}]);
```

# clearBuffer

Remove all stored events from the buffer.

# combine

Combine estreams into a new estream.

**Parameters**

-   `sources` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** an array of Estreams
-   `options` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** set of estream options

**Examples**

```javascript
var estream3 = ES.combine([estream1, estream2]);
```

Returns **Estream** 

# EsEnd

Estream End Event object.
The value kept inside this object will always be an array
since a stream can have multiple source/parent streams
and we want to keep a list of all the end event values.

If you don't push a value, the array is empty.

**Examples**

```javascript
var ES = require('estream');
var estream1 = ES(function(push, error, end) {
 end();
});
estream1.on(function(event) {
 event.isEnd // true
 event.value // []
});
```

# createEstream

Estream factory function.
The only way to create a new Estream.

**Parameters**

-   `options` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** set of estream options

**Examples**

```javascript
var es1 = estream({ buffer: false });
```

Returns **Estream** 

# end

Pushes an end event down the estream.

**Parameters**

-   `value` **Any** the value

Returns **** this

# error

Pushes an error event down the estream.

**Parameters**

-   `value` **Any** the value

Returns **** this

# EsData

Estream Data Event object.

**Examples**

```javascript
var ES = require('estream');
var estream1 = ES(function(push) {
 push(5);
});
estream1.on(function(event) {
 event.isData // true
 event.value // 5
});
```

# EsError

Estream Error Event object.

**Examples**

```javascript
var ES = require('estream');
var estream1 = ES(function(push, error) {
 error(new Error('boom'));
});
estream1.on(function(event) {
 event.isError // true
 event.value.message // 'boom'
});
```

# EsEvent

Base Estream event object.
This is not exposed.

**Parameters**

-   `value` **Any** 

# Estream

The Estream Object. To create use the exposed factory function (createEstream).

**Parameters**

-   `opts` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** stream options

**Examples**

```javascript
var ES = require('estream');
// the passed function is called immediately
var estream1 = ES(function(push, error, end){});
```

# filter

Returns a estream that filters the values of data events.
It also catches errors that occur in the filtering fn
and sends the error as an EsError down the Estream.

**Signature**: `(a -> Boolean) -> Estream EsEvent a`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the filtering function

**Examples**

```javascript
var estream1 = ES();
var mEstream = estream1.filter(isEven);
```

Returns **estream** 

# filterEvent

Creates a new Estream that filters EsEvents themselves,
as opposed to the data within an EsData event.

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the filtering function

**Examples**

```javascript
var estream1 = ES();
estream1.filterEvent(function(e) {
 return e.isData;
});
```

Returns **Estream** 

# getBuffer

Pulls events out of the buffer. Useful if the stream has ended.
This will also update the buffer; removing pulled events.

**Parameters**

-   `end` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** when to end when reading from the buffer

Returns **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** an array of buffered events

# map

Returns an Estream that maps the values from data events.
It also catches errors that occur in the mapping fn
and sends the error as an EsError down the Estream.

**Signature**: `(a -> b) -> Estream EsEvent b`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the mapping function

**Examples**

```javascript
var estream = ES();
var mEstream = estream.map(add1);
```

Returns **Estream** 

# off

A pre-bound function that unsubscribes a consumer/subscriber from a stream.
This is returned for every "on" function.

**Parameters**

-   `estream` **Estream** 
-   `consumer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** 

Returns **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 

# on

Adds a consumer/subscriber to an estream.

When an event gets pushed down an estream, the consumer will get as params:

-   the event (EsData | EsError | EsEnd)
-   a reference to the estream
-   the off/unsubscribe function

**Parameters**

-   `consumer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the consuming function

**Examples**

```javascript
var estream1 = es();
var estream1.on(function(event, estream1, off) {
  console.log('got an event', event.value);
});
```

Returns **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** off - the unsubscribe function

# onData

A helper function for getting only data event values from Estreams.

**Parameters**

-   `consumer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the consuming function

**Examples**

```javascript
var estream1 = es();
var estream1.onData(function(eventValue, estream1, off) {
  console.log('got an data event value', eventValue);
});
```

Returns **Estream** 

# onError

A helper function for getting only end event values from Estreams.

**Parameters**

-   `consumer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the consuming function

**Examples**

```javascript
var estream1 = es();
var estream1.onEnd(function(eventValue, estream1, off) {
  console.log('got a end event value', eventValue);
});
```

Returns **Estream** 

# onError

A helper function for getting only error event values from Estreams.

**Parameters**

-   `consumer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the consuming function

**Examples**

```javascript
var estream1 = es();
var estream1.onError(function(eventValue, estream1, off) {
  console.log('got a error event value', eventValue);
});
```

Returns **Estream** 

# push

Pushes a data event down the estream.

**Parameters**

-   `value` **Any** the value

Returns **** this

# scan

Returns a Estream that scans the values from data events.
It also catches errors that occur in the scanning fn
and sends the error as an EsError down the Estream.

**Signature**: `(b -> a -> c) -> b -> Estream EsEvent b`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the reducing function
-   `acc` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** intial value

**Examples**

```javascript
var estream1 = ES();
var sEstream = estream1.scan(sum, 0);
```

Returns **Estream** 
