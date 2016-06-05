# take

Creates an Estream that takes X number of data events
then ends.

**Signature**: `Number -> Estream`

**Parameters**

-   `count` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** number of data events to take
-   `es` **Estream** 

**Examples**

```javascript
var stream2 = stream1.take(3);
```

Returns **Estream** 
