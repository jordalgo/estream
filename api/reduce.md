# reduce

Returns a Estream that reduces all data and end values,
emitting the final value on Estream end in an EsEnd object.

**Signature**: `(b -> a -> c) -> b -> Estream b`

**Parameters**

-   `fn` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the reducing function
-   `acc` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** intial value
-   `es` **Estream** the source estream

**Examples**

```javascript
var estream1 = ES();
estream1.reduce(sum, 0).on(function(event) {
 if (event.isEnd) console.log(event.value);
});
```

Returns **Estream** 
