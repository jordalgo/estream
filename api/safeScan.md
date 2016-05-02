# safeScan

Returns an Estream that safely scans data
by wrapping the applied function in a try/catch.
Sending errors down the stream when there is an error.

**Signature**: `(b -> a -> c) -> b -> Estream a -> Estream c`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the reducing function
-   `acc` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** intial value
-   `parentEstream` **Estream** the parent pipe

**Examples**

```javascript
var estream1 = ES();
var sEstream = estream1.safeScan(sum, 0);
// or
var sEstream = ES.safeScan(sum, 0, estream1);
```

Returns **Estream** 
