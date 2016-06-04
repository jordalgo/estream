# addMethods

Add methods to the base estream object.

**Signature**: `[Objects] -> undefined`

**Parameters**

-   `addedMethods` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** an array of objects

**Examples**

```javascript
ES.addEstreamMethods({
 name: 'collect',
 fn: function collect() {}
});
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
```

# createEstream

Estream factory function.
The only way to create a new blank Estream.

**Parameters**

-   `fn` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the source function
-   `options` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** set of estream options

**Examples**

```javascript
var estream1 = ES(function(push, error, end) {}, { buffer: false });
```

Returns **Estream** 

# end

Pushes an end event down the estream.
The estream param is bound automatically when creating a new estream.

**Parameters**

-   `estream` **Estream** 
-   `value` **Any** the value

# error

Pushes an error event down the estream.
The estream param is bound automatically when creating a new estream.

**Parameters**

-   `estream` **Estream** 
-   `value` **Any** the value

# EsData

Estream Data Event object.

**Examples**

```javascript
var ES = require('estream');
var estream1 = ES(function(push) {
 push(5);
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
```

# EsEvent

Base Estream event object.
This is not exposed directly.

**Parameters**

-   `value` **Any** 

# Estream

The Estream Object. To create use the exposed factory function.

**Parameters**

-   `opts` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** stream options

**Examples**

```javascript
var ES = require('estream');
var estream1 = ES(function(push, error, end){});
```

# filter

Returns a estream that filters the values of data events.
Catches errors that occur in the filtering function
and sends the error event down the Estream.

**Signature**: `(a -> Boolean) -> estream a`

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

**Parameters**

-   `end` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** when to end when reading from the buffer

Returns **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** an array of buffered events

# map

Returns an Estream that maps the values from data events.
Catches errors that occur in the mapping fn
and sends the error event down the Estream.

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

A pre-bound function that unsubscribes a consumer from a stream.
This is returned for every "on" function.

**Parameters**

-   `estream` **Estream** 
-   `consumer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** 

Returns **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 

# on

Adds a consumer to an estream.
When an event gets pushed down this estream,

the consumer will get as params:

-   the event (EsData | EsError | EsEnd)
-   a reference to the estream
-   the off/unsubscribe function

**Signature**: `(a -> *) -> Estream a`

**Parameters**

-   `consumer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the consuming function

**Examples**

```javascript
var estream1 = es();
var estream1.on(function(event, estream1, unsubscribe) {
  console.log('got an event', event.value);
});
```

Returns **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** off - the unsubscribe function

# onData

A helper function for getting only data event values from Estreams.

**Parameters**

-   `consumer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the consuming function

Returns **Estream** 

# onError

A helper function for getting only error event values from Estreams.

**Parameters**

-   `consumer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the consuming function

Returns **Estream** 

# onError

A helper function for getting only end event values from Estreams.

**Parameters**

-   `consumer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the consuming function

Returns **Estream** 

# push

Pushes a data event down the estream.
The estream param is bound automatically when creating a new estream.

**Parameters**

-   `estream` **Estream** 
-   `value` **Any** the value

# scan

Returns a Estream that scans the values from data events.
Catches errors that occur in the reducing function
and sends the error event down the Estream.

**Signature**: `(b -> a -> c) -> b -> Estream b`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the reducing function
-   `acc` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** intial value

**Examples**

```javascript
var estream1 = ES();
var sEstream = estream1.scan(sum, 0);
```

Returns **Estream** 
