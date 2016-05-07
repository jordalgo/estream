# Estream

The Estream Object. To create use the exposed factory function.

**Parameters**

-   `opts` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** stream options

**Examples**

```javascript
var ES = require('estream');
var estream1 = ES();
```

## clearHistory

Clear the history queue.

**Parameters**

-   `clearHistory`  

# addEstreamMethods

Add methods to the base estream object.

**Signature**: `[Objects] -> undefined`

**Parameters**

-   `addedMethods` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** an array of objects

**Examples**

```javascript
ES.addEstreamMethods({
 name: 'collect',
 fn: require('estream/modules/collect')(ES)
});
```

# addSources

Creates a new estream with x amount of parent estreams.

**Parameters**

-   `args` **estream** a list of estreams

**Examples**

```javascript
var estream1 = ES();
var estream2 = ES();
var estream3 = ES();
var estream4 = estream1.addSources(estream2, estream3);
```

# createEstream

Create a new estream and update parent estreams if passed.

**Examples**

```javascript
var estream1 = ES();
var estream2 = ES(estream1);
```

Returns **estream** the pipe

# debounce

Debounce data events.

**Signature**: `Number -> Estream a`

**Parameters**

-   `interval` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** the debounce timeout amount

**Examples**

```javascript
var estream = ES();
var mEstream = estream.debounce(1000);
```

Returns **Estream** 

# end

Pushes an end event down the estream.
After a stream ends no more errors or data can be pushed down stream.

**Signature**: `a -> Estream`

**Parameters**

-   `value` **Any** the error
-   `Estream`  

**Examples**

```javascript
var estream = ES();
estream1.end();
```

# endOnError

Returns an Estream that ends on any error.

**Signature**: `* -> estream a`

Returns **estream** the estream that will end on error

# error

Pushes an error down the estream

**Signature**: `a -> Estream`

**Parameters**

-   `value` **Any** the error
-   `Estream`  

**Examples**

```javascript
var estream = ES();
estream1.error(5);
```

# filter

Returns a estream that filters non-error data.
Does not catch errors that occur in the filtering function,
for that use safeFilter in modules.

**Signature**: `(a -> Boolean) -> estream a`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the filtering function

**Examples**

```javascript
var estream1 = ES();
var mEstream = estream1.filter(isEven);
```

Returns **estream** 

# forEach

An alias for calling `on('data', consumer)`.

**Parameters**

-   `consumer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the consuming function

Returns **Estream** 

# getHistory

Get data out of the history

**Parameters**

-   `start` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** when to start in reading from the history
-   `end` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** when to end when reading from the history

Returns **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** an array of history events

# keepHistory

Sets the \_keepHistory property. Set to true by default.
If this is set to true then an Estream keeps a record of all it's pushed data and errors.

**Parameters**

-   `keep` **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 

Returns **Estream** 

# map

Returns an Estream that maps data.
Does not catch errors that occur in the mapping function,
for that use safeMap in modules.

**Signature**: `(a -> b) -> Estream b`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the mapping function

**Examples**

```javascript
var estream = ES();
var mEstream = estream.map(add1);
```

Returns **Estream** 

# off

Removes a consumer from a estream.

**Signature**: `(a -> *) -> Estream a`

**Parameters**

-   `type` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** event type (data, error, end)
-   `consumer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the consuming function

**Examples**

```javascript
var estream1 = es();
var onData = function(x) { console.log(x); };
estream1.on('data', onData);
estream1.off('data', onData);
```

Returns **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** if the consumer was found and removed.

# on

Adds a consumer to a estream.

**Signature**: `(a -> *) -> Estream a`

**Parameters**

-   `type` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** event type (data, error, end)
-   `consumer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the consuming function

**Examples**

```javascript
var estream1 = es();
estream1.on('data', function(x, estreamId, estream1, unsubscribe) {
  console.log('got some data', x);
});
```

Returns **Estream** 

# pause

Set \_isFlowing property to false.
If a stream is not flowing it will not notify consumers of data and errors.

Returns **Estream** 

# push

Connects a child Estream to a Parent Estream

**Signature**: `[EVENT_TYPES] -> Estream a -> undefined`

**Parameters**

-   `eventTypes` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** 'data', 'error', 'end'
-   `Estream`  

# push

Pushes data down the estream.

**Signature**: `a -> estream`

**Parameters**

-   `value` **Any** the value
-   `Estream`  

**Examples**

```javascript
var estream = ES();
estream1.push(5);
```

# reduce

Returns a Estream that reduces all data and end values,
emitting the final value on end.

**Signature**: `(b -> a -> c) -> b -> Estream b`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the reducing function
-   `acc` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** intial value

**Examples**

```javascript
var estream1 = ES();
estream1.reduce(sum, 0).on('end', function(finalValue) {});
```

Returns **Estream** 

# replay

Replay a streams events.
This will switch a stream back on and reflow all the events
in the history at that passed in interval.

**Parameters**

-   `interval` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** the time between each replayed event
-   `start` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** where to start in the history replay

# resume

Set \_isFlowing property to true.
If a stream is not flowing it will not notify consumers of data and errors.

Returns **Estream** 

# scan

Returns a Estream that scans data.
Does not catch errors that occur in the scanning (reducing) function,
for that use safeScan in modules.

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
