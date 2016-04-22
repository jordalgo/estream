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
