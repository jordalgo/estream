# fill

Takes a function and returns a pipe that wait until it fills all
the args of the function with next values before notifying subscribers.

**Signature**: `(* -> *) -> Pipe a -> Pipe b`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the function to fill
-   `parentPipe` **pipe** the parent pipe

**Examples**

```javascript
var pipe1 = PH.pipe();
var sum3 = function(a, b, c) { return a + b + c; };
var mPipe = pipe1.fill(sum3);
// or
var mPipe = PH.fill(sum3, pipe1);
pipe1.next(1);
pipe1.next(2);
pipe1.next(3);
// notifies with a 6 value
```

Returns **pipe** 
