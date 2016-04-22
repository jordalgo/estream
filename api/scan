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
