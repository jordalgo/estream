# takeUntil

Creates an Estream that emits all events from a parent stream
until the passed function which takes an event, evaluates to true.

**Signature**: `(EsEvent -> Bool) -> Estream -> Estream`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the function that accepts an EsEvent
    and returns a boolean.
-   `es` **Estream** 

**Examples**

```javascript
var stream2 = stream1.takeUntil(function(event) {
  return event.isData && event.value === 5;
});
```

Returns **Estream** 
