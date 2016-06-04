# debounce

Creates an Estream that debounces all events from the source stream.

**Signature**: `Number -> Estream`

**Parameters**

-   `interval` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** the debounce timeout amount
-   `es` **Estream** 

**Examples**

```javascript
var stream2 = stream1.debounce(1000);
```

Returns **Estream** 
