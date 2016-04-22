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
var mPipe = PH.ap(1, pipe1);
pipe1.next(function(x) { return x + 1; });
```

Returns **pipe** 
