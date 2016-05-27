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

# addSources

Creates a new estream with X amount of parent estreams.

**Parameters**

-   `estreams` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** an Array of estreams

**Examples**

```javascript
var estream1 = ES();
var estream2 = ES();
var estream3 = ES();
var estream4 = estream1.addSources([estream2, estream3]);
```

Returns **Estream** 

# clearHistory

Remove all stored events from the history.

# EsEnd

Estream End Event object.
The value kept inside this object will always be an array
since a stream can have multiple source/parent streams
and we want to keep a list of all the end event values.

If you don't push a value, the array is just empty.

**Examples**

```javascript
var ES = require('estream');
var estream1 = ES();
estream1.push(new Es.End('my end val'));
// or
estream1.end('my end val'); // which wraps this value in an EsEnd object
```

# createEstream

Estream factory function.
The only way to create a new blank Estream.

**Examples**

```javascript
var estream1 = ES();
var estream2 = ES([estream1]);
```

Returns **Estream** 

# end

Pushes an end event down the estream.
After a stream ends no more errors or data can be pushed down stream.

**Signature**: `a -> Estream`

**Parameters**

-   `value` **Any** the error

**Examples**

```javascript
var estream = ES();
estream1.end();
```

Returns **Estream** 

# endOnError

Returns a new Estream that ends on any error.
The new Estream will have _this_ as a parent/source Estream.

**Parameters**

-   `estream` **Estream** 

Returns **Estream** that will end on error

# error

Pushes an error down the estream wrapped in an EsError.

**Signature**: `* -> Estream`

**Parameters**

-   `value` **Any** the error

**Examples**

```javascript
var estream = ES();
estream1.error(new Error('boom'));
```

Returns **Estream** 

# EsData

Estream Data Event object.

**Examples**

```javascript
var ES = require('estream');
var estream1 = ES();
estream1.push(new Es.Data(5));
// or
estream1.push(5); // which wraps this value in an EsData object
```

# EsError

Estream Error Event object.

**Examples**

```javascript
var ES = require('estream');
var estream1 = ES();
estream1.push(new Es.Error('bad thing'));
// or
estream1.error('bad thing'); // which wraps this value in an EsError object
```

# EsEvent

Base Estream event object.
This is not exposed directly. Please use:
EsData, EsEvent, or EsEnd - which inherit from this base object.

**Parameters**

-   `value` **Any** 
-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the EstreamId that is the original source of the event

# Estream

The Estream Object. To create use the exposed factory function.

**Parameters**

-   `opts` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** stream options

**Examples**

```javascript
var ES = require('estream');
var estream1 = ES();
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

# getHistory

Get events out of the history

**Parameters**

-   `start` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** when to start in reading from the history
-   `end` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** when to end when reading from the history

Returns **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** an array of history events

# keepHistory

Sets the \_keepHistory property. Set to true by default.
If this is set to true then an Estream keeps a record of all it's pushed events.

**Parameters**

-   `keep` **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 

Returns **Estream** 

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

A helper function for getting only data events from Estreams.

**Parameters**

-   `consumer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the consuming function

Returns **Estream** 

# onError

A helper function for getting only end events from Estreams.

**Parameters**

-   `consumer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the consuming function

Returns **Estream** 

# onError

A helper function for getting only error events from Estreams.

**Parameters**

-   `consumer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the consuming function

Returns **Estream** 

# push

Pushes an event down the estream.
If the value isn't an EsData, EsError, or EsEnd object,
the value is wrapped in an EsData object.

**Signature**: `* -> Estream`

**Parameters**

-   `value` **Any** the value

**Examples**

```javascript
var estream = ES();
estream1.push(5);
```

Returns **Estream** 

# reduce

Returns a Estream that reduces all data and end values,
emitting the final value on Estream end in an EsEnd object.

**Signature**: `(b -> a -> c) -> b -> Estream b`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the reducing function
-   `acc` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** intial value

**Examples**

```javascript
var estream1 = ES();
estream1.reduce(sum, 0).on(function(event) {
 if (event.isEnd) console.log(event.value);
});
```

Returns **Estream** 

# replay

Replay a streams events.
This will switch a stream back on and reflow all the events
in the history at that passed in interval.

**Parameters**

-   `interval` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** the time between each replayed event
-   `start` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** where to start in the history replay

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

# setDefaultOptions

Override the default options for all created Estreams

**Parameters**

-   `options` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
