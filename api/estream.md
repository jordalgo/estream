# addEstream

Add a child estream to a parent

**Signature**: `Estream b -> estream a`

**Parameters**

-   `s` **estream** the estream to add as a child estream.

**Examples**

```javascript
var estream1 = ES();
var estream2 = ES();
estream1.addEstream(estream2);
```

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

## batchByCount

Returns an Estream that batches data by count into the buffer.
Sets buffer to false when the count reaches 0 and emits the batched data.

**Signature**: `Number -> estream a`

**Parameters**

-   `count` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** the amount to batch

Returns **Estream** 

# createEstream

Create a new estream and update parent estreams if passed.

**Signature**: `Estream a -> estream b`

**Examples**

```javascript
var estream1 = ES();
var estream2 = ES(estream1);
```

Returns **estream** the pipe

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

# map

Exposed Functions
That are also added to the Estream prototype.

**Parameters**

-   `fn`  
-   `parentEstream`  

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

# off

Removes a consumer from a estream.
If the stream has data in the buffer,
the consuming functions will start receiving the data in the buffer on nextTick.

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
If the stream has data in the buffer,
the consuming functions will start receiving the data in the buffer on nextTick.

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

Set \_isFlowing property to false. If an estream is not flowing then any value pushed;
into an Estream will be stored in memory (in pushed order) until there is a consumer.

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

# reroute

Reroutes an estream to a passed function.
This effectively breaks an estream chain
and puts the responsiblity of reconnecting it
on the passed function.

**Signature**: `(Estream a -> estream b -> *) -> Estream b`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the function that takes the parent and new estream

**Examples**

```javascript
var estream1 = ES();
estream1.reroute(function(parentEstream, childEstream) {
 parentEstream.on({
   data: function() {
     // do something async
     childEstream.push(asyncValue);
   }
 });
});
```

Returns **Estream** 

# resume

Set \_isFlowing property to true. If an estream is not flowing then any value pushed
into an Estream will be stored in memory (in pushed order) until there is a consumer.

Returns **Estream** 

# safeFilter

Returns an Estream that safely filters data
by wrapping the applied function in a try/catch.
Sending errors down the stream when there is an error.

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

# safeMap

Returns an Estream that safely maps data
by wrapping the applied function in a try/catch.
Sending errors down the stream when there is an error.

**Signature**: `(a -> b) -> Estream a -> Estream b`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the mapping function
-   `parentEstream` **Estream** 

**Examples**

```javascript
var estream = ES();
var mEstream = estream.safeMap(add1);
// or
var mEstream = ES.safeMap(add1, estream);
```

Returns **Estream** 

# safeScan

Returns an Estream that safely scans data
by wrapping the applied function in a try/catch.
Sending errors down the stream when there is an error.

**Signature**: `(b -> a -> c) -> b -> Estream a -> Estream c`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the reducing function
-   `acc` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** intial value
-   `parentEstream` **Estream** the parent pipe

**Examples**

```javascript
var estream1 = ES();
var sEstream = estream1.safeScan(sum, 0);
// or
var sEstream = ES.safeScan(sum, 0, estream1);
```

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
