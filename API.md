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
var pipe1 = PH.addPipeMethods({
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

# ap

Returns a Pipe that applies a value to a next function

**Signature**: `a -> Pipe (a -> b) -> Pipe b`

**Parameters**

-   `value` **Any** the value applied to the pipe function
-   `parentPipe` **pipe** the parent pipe

**Examples**

```javascript
var pipe1 = PH.pipe();
var mPipe = pipe1.ap(1);
// or
var mPipe = PH.map(add1, pipe1);
pipe1.next(function(x) { return x + 1; });
```

Returns **pipe** the pipe with the new value

# complete

Pass a complete value down the pipe.
Once a complete is passed a pipe does not pass any more
next or error values and it severs all it's child pipes
and observing functions.

**Signature**: `a -> undefined`

**Parameters**

-   `value` **Any** the value

**Examples**

```javascript
var pipe1 = PH.pipe();
pipe1.complete('The end');
```

# completeOnError

Returns a pipe that completes on any error.

**Signature**: `Pipe a -> Pipe a`

**Parameters**

-   `parentPipe` **pipe** the parent pipe

**Examples**

```javascript
var pipe1 = PH.pipe();
var mPipe = pipe1.completeOnError();
// or
var mPipe = PH.completeOnError(pipe1);
```

Returns **pipe** the pipe that will complete on error

# createPipe

Create a new pipe and update parent pipes if passed.

**Signature**: `Pipe a -> Pipe b`

**Examples**

```javascript
var pipe1 = PH.pipe();
var pipe2 = PH.pipe(pipe1);
```

Returns **pipe** the pipe

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

# filter

Returns a Pipe that filters next values.

**Signature**: `(a -> Boolean) -> Pipe a -> Pipe a`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the filtering function
-   `parentPipe` **pipe** the parent pipe

**Examples**

```javascript
var pipe1 = PH.pipe();
var mPipe = pipe1.filter(isEven);
// or
var mPipe = PH.filter(isEvent, pipe1);
```

Returns **pipe** the pipe with the filtered next values.

# map

Returns a Pipe that maps next values.

**Signature**: `(a -> b) -> Pipe a -> Pipe b`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the mapping function
-   `parentPipe` **pipe** the parent pipe

**Examples**

```javascript
var pipe1 = PH.pipe();
var mPipe = pipe1.map(add1);
// or
var mPipe = PH.map(add1, pipe1);
```

Returns **pipe** the pipe with the mapped next values

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

# onComplete

Ads an observer to a pipe's complete

**Signature**: `(a -> *) -> Pipe a`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the observing function

**Examples**

```javascript
var pipe1 = PH.pipe();
pipe1.onComplete(console.log.bind(console));
```

Returns **pipe** 

# onError

Ads an observer to a pipe's errors

**Signature**: `(a -> *) -> Pipe a`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the observing function

**Examples**

```javascript
var pipe1 = PH.pipe();
pipe1.onError(console.log.bind(console));
```

Returns **pipe** 

# onNext

Ads an observer to a pipe's next values

**Signature**: `(a -> *) -> Pipe a`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the observing function

**Examples**

```javascript
var pipe1 = PH.pipe();
pipe1.onNext(console.log.bind(console));
```

Returns **pipe** 

# reroute

Reroutes a pipe to a passed function.
This effectively breaks a pipe chain
and puts the responsiblity of reconnecting it
on the app developer.

**Signature**: `(Pipe a -> Pipe b -> *) -> Pipe b`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the function that takes the parent and new pipe

**Examples**

```javascript
var pipe1 = PH.pipe();
pipe1.reroute(function(parentPipe, childPipe) {
 parentPipe.onNext(childPipe.next);
 parentPipe.onError(childPipe.error);
 parentPipe.onComplete(childPipe.complete);
});
```

Returns **pipe** 

# scan

Returns a Pipe that scans next values.

**Signature**: `(b -> a -> c) -> b -> Pipe a -> Pipe c`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the mapping function
-   `acc` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** intial value
-   `parentPipe` **pipe** the parent pipe

**Examples**

```javascript
var pipe1 = PH.pipe();
var mPipe = pipe1.scan(sum, 0);
// or
var mPipe = PH.scan(sum, 0, pipe1);
```

Returns **pipe** the pipe with the scanned next values

# take

Returns a Pipe that takes x number of next values then completes.

**Signature**: `Int -> Pipe a -> Pipe a`

**Parameters**

-   `count` **Integer** the number of next values to take
-   `parentPipe` **pipe** the parent pipe

**Examples**

```javascript
var pipe1 = PH.pipe();
var mPipe = pipe1.take(3);
// or
var mPipe = PH.take(3, pipe1);
```

Returns **pipe** the pipe that will only accept x number of next values
