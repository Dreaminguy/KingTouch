var test = require('tape');
var EE = require('events');
var createWrapper = require('../');


test('events fire', function (t) {
	var emitter = new EE();
	var wrap = createWrapper(emitter, t.end);

	wrap('foo', function (value) {
		t.equal(value, 'abc');
		wrap.done();
	});

	emitter.emit('foo', 'abc');
});


test('events clean up', function (t) {
	var emitter = new EE();

	function instance() {
		var called = 0;
		var wrap = createWrapper(emitter);
		wrap('foo', function () {
			called += 1;
			t.equals(called, 1);
		});

		emitter.emit('foo');
		wrap.done();
	}

	instance();
	instance();
	instance();

	t.equal(EE.listenerCount(emitter, 'foo'), 0);

	t.end();
});

test('final callback may throw', function (t) {
	var emitter = new EE();

	var wrap = createWrapper(emitter, function (error) {
		throw new Error('Oh noes!');
	});

	wrap('foo', function () {
		wrap.done();
	});

	emitter.emit('foo');

	process.once('uncaughtException', function (error) {
		t.equal(error.message, 'Oh noes!');
		t.end();
	});
});
