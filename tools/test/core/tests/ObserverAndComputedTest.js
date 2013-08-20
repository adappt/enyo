enyo.kind({
	name: "ObserverTest",
	kind: enyo.TestSuite,
	noDefer: true,
	testObservers: function () {
		var o = new enyo.Object();
		this.finish(
			(!o.observers && "observers object not created as expected") ||
			(!o._observerMap && "observer map not created as expected") || 
			(!o._observerNotificationQueue && "observer notification queue not created as expected")
		);
	},
	testPublishedPropertyAsObserver: function () {
		var test = {}, o;
		test.Object = enyo.kind({
			kind: enyo.Object,
			published: {
				testProp: false
			},
			testPropChanged: function () {}
		});
		o = new test.Object();
		this.finish(
			(!o.observers.testPropChanged && "the testPropChanged method should have been an observer") ||
			(enyo.indexOf("testProp", o.observers.testPropChanged) !== 0 && "observer dependency should have been testProp") ||
			(!o._observerMap.testProp && "observer map did not include dependency map of testProp") ||
			(enyo.indexOf("testPropChanged", o._observerMap.testProp) !== 0 && "observer map should map testProp to testPropChanged handler")
		);
	},
	testFindChangedHandlers: function () {
		var test = {}, o;
		test.Object = enyo.kind({
			kind: enyo.Object,
			testPropChanged: function () {},
			testProp1Changed: function () {}
		});
		o = new test.Object();
		this.finish(
			(!o._observerMap.testProp && "testProp was not automatically added as an observer") ||
			(!o._observerMap.testProp1 && "testProp1 was not automatically added as an observer")
		);
	},
	testAddObserverAPI: function () {
		var test = {}, o, s = this, fn = function (p,c,prop) {
			s.finish(
				(!prop && "the property parameter wasn't present") ||
				(prop !== "testProp" && "the property parameter wasn't correct") ||
				(p !== 0 && "previous value not correct") ||
				(c !== 1 && "current value not correct")
			);
		};
		test.Object = enyo.kind({
			kind: enyo.Object,
			published: {
				testProp: 0
			}
		});
		o = new test.Object();
		o.addObserver("testProp", fn);
		if (!o._observerMap.testProp) {
			return this.finish("observer map not updated on addObserver as expected");
		}
		o.set("testProp", 1);
	},
	testRemoveObserverAPI: function () {
		var o = new enyo.Object(), fn = function () {};
		o.addObserver("noName", fn);
		if (!o._observerMap.noName) {
			return this.finish("remove observer API cannot work because add observer API doesn't work");
		}
		o.removeObserver("noName", fn);
		if (o._observerMap.noName) {
			return this.finish("failed to remove the entry for the observer as expected");
		}
		this.finish();
	},
	testNotificationQueue: function () {
		var test = {}, s = this, o, allowed = false;
		test.Object = enyo.kind({
			kind: enyo.Object,
			published: {
				testProp: 0
			},
			testPropChanged: function (p,c,prop) {
				if (!allowed) {
					throw "observer fired even when notifications were turned off";
				} else {
					s.finish(
						(p !== 1 && "even though the property was queued it did not update the parameters") ||
						(c !== 2 && "even though the property was queued it did not update the parameters")
					);
				}
			}
		});
		o = new test.Object();
		o.stopNotifications();
		if (o._observerNotificationsEnabled) {
			return this.finish("the notifications flag was still enabled");
		}
		if (o._observerStopCount !== 1) {
			return this.finish("the stop count was not updated as expected");
		}
		o.set("testProp", 1);
		// when enabled again the queue should flush only one updated for the observer
		// and its values should have been updated
		o.set("testProp", 2);
		allowed = true;
		o.startNotifications();
	}
});

enyo.kind({
	name: "ComputedTest",
	kind: enyo.TestSuite,
	noDefer: true,
	testComputed: function () {
		var o = new enyo.Object();
		this.finish(
			(!o.computed && "computed hash was not present as expected") ||
			(!o._computedMap && "computed map not present as expected") ||
			(!o._computedCached && "computed cached map not present as expected") ||
			(!o._computedQueue && "computed queue not present as expected")
		);
	},
	testWithComputedProperties: function () {
		var test = {}, o, s = this, allowed = false;
		test.Object = enyo.kind({
			kind: enyo.Object,
			published: {
				testProp: 1
			},
			computed: {
				testProp1: ["testProp"],
				testProp2: ["testProp1", "testProp"]
			},
			testProp1: function () {
				return 1 + this.get("testProp");
			},
			testProp2: function () {
				return this.get("testProp") + this.get("testProp1");
			},
			testProp2Changed: function (p,c,prop) {
				if (!allowed) {
					throw "observer fired but notifications were disabled";
				}
				s.finish(c !== 7 && "computed value was not correct, expected 7, got " + c);
			}
		});
		o = new test.Object();
		o.stopNotifications();
		o.set("testProp", 2);
		o.set("testProp", 3);
		allowed = true;
		o.startNotifications();
	},
	testComputedWithBindings: function () {
		var test = {}, o, t, s = this;
		test.Object = enyo.kind({
			kind: enyo.Object,
			published: {
				first: "",
				last: ""
			},
			computed: {
				fullName: ["first", "last"]
			},
			fullName: function () {
				return this.get("first") + " " + this.get("last");
			} 
		});
		o = new test.Object({first: "Polly", last: "Shore"});
		t = new enyo.Object({
			fullNameChanged: function () {
				s.finish(
					(this.fullName != "Polly Shore" && "name changed but was not correct")
				);
			}
		});
		o.binding({from: ".fullName", to: ".fullName", target: t});
	}
});