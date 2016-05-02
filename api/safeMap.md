# safeMap

Returns an Estream that safely maps data
by wrapping the applied function in a try/catch.
Sending errors down the stream when there is an error.

**Signature**: `(a -> b) -> Estream a -> Estream b`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the mapping function
-   `parentEstream` **Estream** 

**Examples**

```javascript
var estream = ES();
var mEstream = estream.safeMap(add1);
// or
var mEstream = ES.safeMap(add1, estream);
```

Returns **Estream** 
