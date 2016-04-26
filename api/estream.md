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

# endOnError

Returns an Estream that ends on any error.

**Signature**: `* -> estream a`

Returns **estream** the estream that will end on error

# Estream

The Estream Object. To create use the exposed factory function.

# filter

Returns a estream that filters non-error data.

**Signature**: `(a -> Boolean) -> estream a -> estream a`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the filtering function
-   `safe` **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** if true, wraps the scan in a try/catch (default: false)
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

Returns an Estream that maps non-error values.

**Signature**: `(a -> b) -> Estream a -> Estream b`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the mapping function
-   `safe` **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** if true, wraps the map in a try/catch (default: false)
-   `parentEstream` **Estream** 

**Examples**

```javascript
var estream = ES();
var mEstream = estream.map(add1, true);
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

# push

Pass data down the estream.
If the data is an instanceof Error, it will get routed differently.
If you call this function with no arguments, you end the estream.
This will also throw if you try to push data into an ended estream.

**Signature**: `a -> estream`

**Parameters**

-   `value` **Any** the value
-   `Estream`  

**Examples**

```javascript
var estream = ES();
estream1.push(5);
estream1.push(new Error('boom'));
estream1.push(); // ends the estream.
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

# scan

Returns a Estream that scans non-error data.

**Signature**: `(b -> a -> c) -> b -> Estream a -> Estream c`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the mapping function
-   `acc` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** intial value
-   `safe` **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** if true, wraps the scan in a try/catch (default: false)
-   `parentEstream` **Estream** the parent pipe

**Examples**

```javascript
var estream1 = ES();
var sEstream = estream1.scan(sum, 0, true);
// or
var sEstream = ES.scan(sum, 0, estream1);
```

Returns **Estream** 

# setBuffer

Set \_isBuffering property. If buffering is turned on then any value pushed
into an Estream will be stored in memory (in pushed order) until there is a consumer.

**Parameters**

-   `bool` **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 

Returns **Estream** 
