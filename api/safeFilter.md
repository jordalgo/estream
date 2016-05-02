# safeFilter

Returns an Estream that safely filters data
by wrapping the applied function in a try/catch.
Sending errors down the stream when there is an error.

**Signature**: `(a -> Boolean) -> estream a -> estream a`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the filtering function
-   `parentEstream` **estream** the parent estream

**Examples**

```javascript
var estream1 = ES();
var mEstream = estream1.filter(isEven);
// or
var mEstream = ES.filter(isEven, estream1);
```

Returns **estream** 
