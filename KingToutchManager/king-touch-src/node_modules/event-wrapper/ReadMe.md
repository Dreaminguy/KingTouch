# EventWrapper

## About

Sometimes you deal with event emitters that emit events for long periods of time. Think Socket.io, Primus,
etc. On top of this firehose of events, you're trying to stick logic that applies to a subset of events,
and perhaps only for now. Once you're done dealing with these events, you don't want to have to think about
them anymore. EventEmitter#once is a dangerous function to use, because when your event never emits, your
event handler will be dangling from the emitter until some unspecified time in the future.

In comes EventWrapper. It's a zero-dependency library that solves the problem above by allowing you to listen
for events on any event emitter, and once you're done, you can notify the wrapper that you are *really* done,
and it will remove all listeners for you.

## Installation

### NPM

```sh
npm install --save event-wrapper
```

## Usage

```js
var createWrapper = require('event-wrapper');

function done(error) {
    // this function receives all arguments passed when wrap.done() is called
    console.log('Finally done!');
}

var wrap = createWrapper(emitter, done);

wrap('event1', function (arg1, arg2) {
    // do some very important stuff
});

wrap('event2', function (arg1) {
    // do some more important stuff

    if (arg1 < 0) {
        // exceptions are automatically sent to our final callback done()
        throw new Error('Arg1 was negative! Oh noes!');
    }
});

wrap('event3', function () {
    wrap.done();
});
```

## Compatibility

EventWrapper works with any event emitter that exposes the following 2 methods:

- on(eventName, callback)
- removeListener(eventName, callback)

## License

MIT of course.
