# safeScan

Returns a Estream that scans the values from data events.
It catches errors from the scan and sends them down the stream
as EsErrors.

**Signature**: `(b -> a -> c) -> b -> Estream -> Estream`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the reducing function
-   `acc` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** intial value
-   `es` **Estream** 

**Examples**

```javascript
var estream1 = ES();
var sEstream = safeScan(sum, 0, estream1);
```

Returns **Estream** 
