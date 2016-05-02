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

-   `args` **estream** a list of pipes

**Examples**

```javascript
var estream1 = ES();
var estream2 = ES();
var estream3 = ES();
var estream4 = estream1.addSources(estream2, estream3);
```

# Estream

The Estream Object. To create use the exposed factory function.

## clearHistory

Clear the history queue.

**Parameters**

-   `clearHistory`  

# createEstream

Create a new estream and update parent estreams if passed.

**Signature**: `Estream a -> estream b`

**Examples**

```javascript
var estream1 = ES();
var estream2 = ES(estream1);
```

Returns **estream** the pipe

# drain

Drain any history messages that have accumulated while estream is paused
and turns flowing on.

# endOnError

Returns an Estream that ends on any error.

**Signature**: `* -> estream a`

Returns **estream** the estream that will end on error

# filter

Returns a estream that filters non-error data.

**Signature**: `(a -> Boolean) -> estream a -> estream a`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the filtering function
-   `parentEstream` **estream** the parent estream

**Examples**

```javascript
var estream1 = ES();
var mEstream = estream1.filter(isEven);
// or
var mEstream = ES.filter(isEven, estream1);
```

Returns **estream** 

# getHistory

Get data out of the history

**Parameters**

-   `start` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** when to start in reading from the history
-   `end` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** when to end when reading from the history

Returns **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** an array of historyed events

# keepHistory

Sets the \_keepHistory property. Set to true by default.
If this is set to true then an Estream keeps a record of all it's pushed data and errors.

**Parameters**

-   `keep` **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 

Returns **Estream** 

# map

Returns an Estream that maps data.
Does not catch errors that occur in the mapping function,
for that use safeMap.

**Signature**: `(a -> b) -> Estream a -> Estream b`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the mapping function
-   `parentEstream` **Estream** 

**Examples**

```javascript
var estream = ES();
var mEstream = estream.map(add1);
// or
var mEstream = ES.map(add1, estream);
```

Returns **Estream** 

# map

Exposed Functions
That are also added to the Estream prototype.

**Parameters**

-   `fn`  
-   `parentEstream`  

# off

Removes a consumer from a estream.
If the stream has data in the history,
the consuming functions will start receiving the data in the history on nextTick.

**Signature**: `(a -> *) -> Estream a`

**Parameters**

-   `type` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** event type (data, error, end)
-   `consumer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the consuming function

**Examples**

```javascript
var estream1 = es();
var off = estream1.off('data', function(x) {
  console.log('got some data', x);
});
```

Returns **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** if the consumer was found and removed.

# on

Adds a consumer to a estream.
If the stream has data in the history,
the consuming functions will start receiving the data in the history on nextTick.

**Signature**: `(a -> *) -> Estream a`

**Parameters**

-   `type` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** event type (data, error, end)
-   `consumer` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the consuming function

**Examples**

```javascript
var estream1 = es();
var off = estream1.on('data', function(x) {
  console.log('got some data', x);
});
```

Returns **Estream** 

# pause

Set \_isFlowing property to false. If an estream is not flowing then any value pushed
into an Estream will be stored in the history unless history is off.

Returns **Estream** 

# push

Connects a child Estream to a Parent Estream

**Signature**: `[EVENT_TYPES] -> Estream a -> undefined`

**Parameters**

-   `eventTypes` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** 'data', 'error', 'end'
-   `Estream`  

**Examples**

```javascript
var estream = ES();
estream1.end();
```

# push

Pushes an error down stream

**Signature**: `a -> Estream`

**Parameters**

-   `value` **Any** the error
-   `Estream`  

**Examples**

```javascript
var estream = ES();
estream1.error(5);
```

# push

Pushes data down stream.

**Signature**: `a -> estream`

**Parameters**

-   `value` **Any** the value
-   `Estream`  

**Examples**

```javascript
var estream = ES();
estream1.push(5);
```

# push

Pushes an end down stream.
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

# resume

Set \_isFlowing property to true. If an estream is not flowing then any value pushed
into an Estream will be stored in the history unless history is off.

Returns **Estream** 

# scan

Returns a Estream that scans data.
Does not catch errors that occur in the scanning (reducing) function,
for that use safeScan.

**Signature**: `(b -> a -> c) -> b -> Estream a -> Estream c`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the reducing function
-   `acc` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** intial value
-   `parentEstream` **Estream** the parent pipe

**Examples**

```javascript
var estream1 = ES();
var sEstream = estream1.scan(sum, 0);
// or
var sEstream = ES.scan(sum, 0, estream1);
```

Returns **Estream** 
