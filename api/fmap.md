# fmap

Returns a Pipe that lifts a next value.

**Signature**: `(a -> b) -> Pipe f a -> Pipe f b`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the mapping function
-   `parentPipe` **pipe** the parent pipe passing a functor

**Examples**

```javascript
var pipe1 = PH.pipe();
var mPipe = pipe1.fmap(add1);
// or
var mPipe = PH.fmap(add1, pipe1);
pipe1.next([1, 1, 1]);
// mPipe emits [2, 2, 2]
```

Returns **pipe** 
