# collect

Returns a Pipe that collects next values.

**Signature**: \`Int|Boolean -> Pipe a -> Pipe a

**Parameters**

-   `count` **([number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)\|[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean))** the amount of next values to collect.
     If false, collect them all.
-   `parentPipe` **pipe** the parent pipe

**Examples**

```javascript
var pipe1 = PH.pipe();
var mPipe = PH.collect(false, pipe1);
```

Returns **pipe** the pipe with the collected next values
