# addPipe

Add a child pipe to a parent

**Signature**: `Pipe b -> Pipe a`

**Parameters**

-   `p` **pipe** the pipe to add as a child pipe

**Examples**

```javascript
var pipe1 = PH.pipe();
var pipe2 = PH.pipe();
pipe1.addPipe(pipe2);
```

# addPipeMethods

Add methods to the base pipe object.

**Signature**: `[Objects] -> undefined`

**Parameters**

-   `addedMethods` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** an array of objects

**Examples**

```javascript
PH.addPipeMethods({
 name: 'collect',
 fn: require('piping-hot/modules/collect')(PH.pipe)
});
```

# addSources

Creates a new pipe with x amount of parent-pipes/sources.

**Signature**: `[Pipe a] -> Pipe b`

**Parameters**

-   `args` **pipe** a list of pipes

**Examples**

```javascript
var pipe1 = PH.pipe();
var pipe2 = PH.pipe();
var pipe3 = PH.pipe();
var pipe4 = pipe1.addSources(pipe2, pipe3);
```

# complete

Pass a complete value down the pipe.
Once a complete is passed, a pipe does not pass any more
next or error values and it severs all it's child pipes
and subscribers.

**Signature**: `a -> undefined`

**Parameters**

-   `value` **Any** the value

**Examples**

```javascript
var pipe1 = PH.pipe();
pipe1.complete('The end');
```

# error

Pass an error down the pipe.

**Signature**: `Error -> undefined`

**Parameters**

-   `err` **[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)** the error

**Examples**

```javascript
var pipe1 = PH.pipe();
pipe1.error(new Error('something bad happened'));
```

# forEach

Ads an observer to a pipe's next values.
Equivalent to calling subscribe with only a next function.

**Signature**: `(a -> *) -> Pipe a`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the observing function

**Examples**

```javascript
var pipe1 = PH.pipe();
pipe1.forEach(console.log.bind(console));
```

Returns **pipe** 

# next

Pass a next value down the pipe.

**Signature**: `a -> undefined`

**Parameters**

-   `value` **Any** the value

**Examples**

```javascript
var pipe1 = PH.pipe();
pipe1.next(5);
```

# Pipe

The Pipe Object. Use the exposed createPipe/PH.pipe() factory function to create.

# reroute

Reroutes a pipe to a passed function.
This effectively breaks a pipe chain
and puts the responsiblity of reconnecting it
on the passed function.

**Signature**: `(Pipe a -> Pipe b -> *) -> Pipe b`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the function that takes the parent and new pipe

**Examples**

```javascript
var pipe1 = PH.pipe();
pipe1.reroute(function(parentPipe, childPipe) {
 parentPipe.subscribe({
   next: function() {
     // do something async
     childPipe.next(asyncValue);
   }
 });
});
```

Returns **pipe** 

# subscribe

Ads an observer to a pipe.

**Signature**: `Object -> Pipe a`

**Parameters**

-   `observer` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the observing object

**Examples**

```javascript
var pipe1 = PH.pipe();
var unsubscribe = pipe1.subscribe({
 next: function(x) { console.log('Got a next value', x); },
 error: function(e) { console.log('Got an error', e); },
 complete: function() { console.log('The pipe completed'); }
});
unsubscribe();
```

Returns **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** unsubcribe

# unsubscribe

Unsubscribes from next, error, and complete.

**Examples**

```javascript
var pipe1 = PH.pipe();
var unsubscribe = pipe1.subscribe({
 next: function(x) { console.log('Got a next value', x); },
 error: function(e) { console.log('Got an error', e); },
 complete: function() { console.log('The pipe completed'); }
});
unsubscribe();
```
