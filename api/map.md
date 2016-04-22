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

Returns **pipe** 
