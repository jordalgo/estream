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
var mPipe = PH.filter(isEven, pipe1);
```

Returns **pipe** 
