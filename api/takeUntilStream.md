# take

Creates an Estream that emits all events from a parent stream
until a second stream emits a specific event type.
If the passed eventType is any other value then if any event is emitted
from the second stream the created stream ends.

**Signature**: `Number -> Estream`

**Parameters**

-   `eventType` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 'data' | 'error' | 'end' or null
-   `parent` **Estream** the source estream
-   `ender` **Estream** 

**Examples**

```javascript
var stream2 = stream1.take(3);
```

Returns **Estream** 
