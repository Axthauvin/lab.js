/* global define, describe, it, beforeEach, assert, sinon */
/* eslint-disable import/no-amd */

define(['lab'], (lab) => {

describe('Data handling', () => {
  describe('Store', () => {
    let ds

    beforeEach(() => {
      ds = new lab.data.Store({})
    })

    it('loads', () => {
      assert.deepEqual(ds.state, {})
      assert.deepEqual(ds.data, [])
    })

    describe('Storage', () => {
      it('stores individual values', () => {
        ds.set('one', 1)
        assert.deepEqual(
          ds.state,
          {
            'one': 1,
          }
        )
      })

      it('stores objects', () => {
        ds.set({
          'one': 1,
          'two': 2
        })
        assert.deepEqual(
          ds.state,
          {
            'one': 1,
            'two': 2
          }
        )
      })
    })

    describe('Retrieval', () => {
      it('retrieves individual values', () => {
        ds.set({
          'one': 1,
          'two': 2
        })
        assert.equal(ds.get('one'), ds.state.one)
        assert.equal(ds.get('two'), ds.state.two)
      })

      it('can extract individual columns from the data', () => {
        ds.commit({
          'column_1': 1,
          'column_2': 'a'
        })
        ds.commit({
          'column_1': 2,
          'column_2': 'b'
        })

        assert.deepEqual(
          ds.extract('column_1'),
          [1, 2]
        )
        assert.deepEqual(
          ds.extract('column_2'),
          ['a', 'b']
        )
      })

      it('can filter by sender when extracting columns', () => {
        ds.commit({
          'sender': 'relevantScreen',
          'column_1': 'foo'
        })
        ds.commit({
          'sender': 'irrelevantScreen',
          'column_1': 'bar'
        })
        ds.commit({
          'sender': 'relevantScreen',
          'column_1': 'baz'
        })

        assert.deepEqual(
          ds.extract('column_1', 'relevantScreen'),
          ['foo', 'baz']
        )
      })

      it('can select specified columns in data by a filtering function', () =>{
        var filter_function = (e) => (e.startsWith('c'))
        ds.commit({
          'random': 1,
          'column_1': 'a',
          'column_2': 'b'
        })
        assert.deepEqual(
          ds.select( filter_function ),
          [{ column_1: 'a', column_2: 'b' }]
        )
      })

      it('can select specified columns in data by an array of columns names', () =>{
        ds.commit({
          'random': 1,
          'column_1': 'a',
          'column_2': 'b'
        })
        assert.deepEqual(
          ds.select( ['column_1', 'column_2'] ),
          [{ column_1: 'a', column_2: 'b' }]
        )
      })

    })

    describe('Commit', () => {
      it('copies data to storage on commit', () => {
        ds.set({
          'one': 1,
          'two': 2
        })
        ds.commit()
        assert.deepEqual(
          ds.state,
          {
            'one': 1,
            'two': 2
          }
        )
        assert.deepEqual(
          ds.data,
          [ds.state]
        )
      })

      it('clones stored information, breaking references', () => {
        const someObject = { one: 1 }
        ds.commit({
          someObject: someObject
        })
        ds.state.someObject.one = 2

        // State should changed, but not the stored data
        assert.equal(ds.state.someObject.one, 2)
        assert.equal(ds.data[0].someObject.one, 1)
      })

      it('clears the staging area on commit', () => {
        ds.set({
          'one': 1,
          'two': 2
        })
        ds.commit()
        assert.deepEqual(ds.staging, {})
      })

      it('provides data without keys beginning with an underscore', () => {
        ds.commit({
          'one': 1,
          'two': 2,
          '_parameter': 3
        })
        assert.deepEqual(
          ds.data,
          [{
            'one': 1,
            'two': 2,
            '_parameter': 3,
          }]
        )
        assert.deepEqual(
          ds.cleanData,
          [{
            'one': 1,
            'two': 2,
          }]
        )
      })

      it('can update previously committed data', () => {
        ds.commit({
          foo: 'bar',
        })
        ds.update(0, d => {
          d.foo = 'baz'
          return d
        })

        assert.deepEqual(
          ds.data,
          [{ foo: 'baz' }]
        )
      })

      it('returns data index when committing', () => {
        assert.equal(
          ds.commit({}),
          0
        )

        assert.equal(
          ds.commit({}),
          1
        )
      })
    })

    describe('State proxy', () => {
      it('reads via get method', () => {
        ds.set({ 'one': 1, 'two': 2 })
        const spy = sinon.spy(ds, 'get')

        assert.equal(ds.stateProxy['one'], 1)
        assert.ok(spy.withArgs('one').calledOnce)
      })

      it('writes via set method', () => {
        const spy = sinon.spy(ds, 'set')

        ds.stateProxy['one'] = 1
        assert.equal(ds.get('one'), 1)
        assert.ok(spy.withArgs('one', 1).calledOnce)
      })
    })

    describe('Metadata', () => {
      it('computes column keys', () => {
        ds.commit({
          'one': 1,
          'two': 2
        })
        ds.commit({
          'two': 2,
          'three': 3
        })
        assert.deepEqual(
          ds.keys(), // sorted alphabetically
          ['one', 'three', 'two']
        )
      })

      it('moves metadata to first columns', () => {
        // sender should be moved to the front by default
        ds.commit({
          'abc': 1,
          'sender': 2
        })
        assert.deepEqual(
          ds.keys(),
          ['sender', 'abc']
        )
      })

      it('can include state keys if requested', () => {
        ds.commit({
          'one': 1,
          'two': 2
        })
        ds.set('three', 3)

        assert.deepEqual(
          ds.keys(),
          ['one', 'two']
        )

        assert.deepEqual(
          ds.keys(true),
          ['one', 'three', 'two']
        )
      })

      it('provides the participant id as a property', () => {
        assert.isUndefined(ds.id)

        ds.set({ id: 'abc' })

        assert.equal(ds.id, 'abc')
      })

      it('can suggest a filename', () => {
        const now = new Date('2018-05-25T12:00:00+00:00')
        const clock = sinon.useFakeTimers(now)

        // Compensate for time zone
        const hours = _.padStart(
          (12 - new Date().getTimezoneOffset() / 60).toString(),
          2, '0'
        )

        assert.equal(
          ds.makeFilename('prefix', 'json'),
          'prefix--2018-05-25--' + hours + ':00:00.json'
        )

        clock.restore()
      })
    })

    describe('Reset', () => {
      it('clears transient data if requested', () => {
        ds.commit({
          'a': 'b'
        })

        // Don't clear persistent storage
        ds.clear(false, true)

        assert.deepEqual(
          ds.data,
          []
        )
        assert.deepEqual(
          ds.state,
          {}
        )
        assert.deepEqual(
          ds.staging,
          {}
        )
      })
    })

    describe('Local persistence', () => {
      it('saves state into session storage if requested', () => {
        const persistent_ds = new lab.data.Store({
          persistence: 'session'
        })

        persistent_ds.set('a', 'bcd')
        persistent_ds.commit()

        assert.deepEqual(
          JSON.parse(sessionStorage.getItem('lab.js-data')),
          persistent_ds.data
        )

        sessionStorage.clear()
      })

      it('saves state into local storage if requested', () => {
        const persistent_ds = new lab.data.Store({
          persistence: 'local'
        })

        persistent_ds.set('a', 'bcd')
        persistent_ds.commit()

        assert.deepEqual(
          JSON.parse(localStorage.getItem('lab.js-data')),
          persistent_ds.data
        )

        localStorage.clear()
      })

      it('recovers state from storage', () => {
        // Save some data in sessionStorage
        sessionStorage.setItem('lab.js-data', '[{"a": 1, "b": "foo"}]')

        const persistent_ds = new lab.data.Store({
          persistence: 'session'
        })

        assert.equal(
          persistent_ds.get('a'),
          1
        )
        assert.equal(
          persistent_ds.get('b'),
          'foo'
        )

        sessionStorage.clear()
      })

      it('removes metadata from state when recovering data', () => {
        sessionStorage.setItem('lab.js-data', '[{"a": 1, "sender": "foo"}]')

        const persistent_ds = new lab.data.Store({
          persistence: 'session'
        })
        assert.equal(
          persistent_ds.state.a,
          1
        )
        assert.isUndefined(
          persistent_ds.state.sender
        )

        sessionStorage.clear()
      })

      it('fails gracefully if local data are invalid', () => {
        sessionStorage.setItem('lab.js-data', 'clearly_not_json')
        const persistent_ds = new lab.data.Store({
          persistence: 'session'
        })

        assert.deepEqual(
          persistent_ds.data, []
        )
        assert.deepEqual(
          persistent_ds.state, {}
        )

        sessionStorage.clear()
      })

      it('clears persistent data in sessionStorage when instructed', () => {
        sessionStorage.setItem('lab.js-data', '[{"a": 1, "b": "foo"}]')

        new lab.data.Store({ persistence: 'session' }).clear()

        assert.equal(
          sessionStorage.getItem('lab.js-data'),
          null
        )
      })

      it('clears persistent data in localStorage when instructed', () => {
        localStorage.setItem('lab.js-data', '[{"a": 1, "b": "foo"}]')

        new lab.data.Store({ persistence: 'local' }).clear()

        assert.equal(
          localStorage.getItem('lab.js-data'),
          null
        )
      })

      it('clears previous persistent data on construction if requested', () => {
        sessionStorage.setItem('lab.js-data', '[{"a": 1, "b": "foo"}]')

        const persistent_ds = new lab.data.Store({
          persistence: 'session',
          clearPersistence: true
        })

        assert.deepEqual(
          persistent_ds.data,
          []
        )

        assert.equal(
          sessionStorage.getItem('lab.js-data'),
          null
        )
      })
    })

    describe('Data export', () => {
      it('exports correct json data', () => {
        ds.commit({
          'one': 1,
          'two': 2
        })
        ds.commit({
          'two': 2,
          'three': 3
        })
        assert.deepEqual(
          ds.exportJson(),
          JSON.stringify(ds.data)
        )
      })

      it('exports correct jsonl data', () => {
        ds.commit({
          'one': 1,
          'two': 2
        })
        ds.commit({
          'two': 2,
          'three': 3
        })

        assert.deepEqual(
          ds.exportJsonL(),
          [
            '{"one":1,"two":2}',
            '{"two":2,"three":3}'
          ].join('\n')
        )
      })

      it('exports correct csv data', () => {
        ds.commit({
          'one': 1,
          'two': 2
        })
        ds.commit({
          'two': 2,
          'three': 3
        })
        assert.strictEqual(
          ds.exportCsv(),
          [
            'one,three,two',
            '1,,2',
            ',3,2'
          ].join('\r\n')
        )
      })

      it('places cells in quotation marks if required for csv export', () => {
        ds.commit({
          '1': 'a',
          '2': 'b,',
          '3': 'c\n',
        })
        assert.strictEqual(
          ds.exportCsv(),
          [
            '1,2,3',
            'a,"b,","c\n"',
          ].join('\r\n')
        )
      })

      it('escapes quotation marks in cells during csv export', () => {
        ds.commit({
          '1': 'a',
          '2': 'b"',
          '3': 'c',
        })
        assert.strictEqual(
          ds.exportCsv(),
          [
            '1,2,3',
            'a,"b""",c',
          ].join('\r\n')
        )
      })

      it('escapes all quotation marks during csv export', () => {
        ds.commit({
          '1': '["a", "b", "c"]',
        })
        assert.strictEqual(
          ds.exportCsv(),
          [
            '1',
            '"[""a"", ""b"", ""c""]"',
          ].join('\r\n')
        )
      })

      it('stringifies complex data types during csv export', () => {
        ds.commit({
          'array': [1, 2, 3, 'a', 'b', 'c'],
          'object': { one: 1, two: 2 },
        })

        assert.strictEqual(
          ds.exportCsv(),
          [
            'array,object',
            '"[1,2,3,""a"",""b"",""c""]","{""one"":1,""two"":2}"',
          ].join('\r\n')
        )
      })

      it('omits columns starting with an underscore in csv export', () => {
        ds.commit({
          'one': 1,
          'two': 2,
          '_three': 3,
        })
        ds.commit({
          'two': 2,
          'three': 3,
          '_four': 4,
        })
        assert.strictEqual(
          ds.exportCsv(),
          [
            'one,three,two',
            '1,,2',
            ',3,2'
          ].join('\r\n')
        )
      })

      it('exports data as a blob', () => {
        ds.commit({
          'one': 1,
          'two': 2
        })
        ds.commit({
          'two': 2,
          'three': 3
        })

        // Define a function to convert blobs back into text
        const readBlob = blob =>
          new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              resolve(reader.result)
            }
            reader.onerror = reject
            reader.readAsText(blob)
          })

        return Promise.all([
          readBlob(ds.exportBlob()).then((result) => {
            assert.equal(result, ds.exportCsv())
          }),
          readBlob(ds.exportBlob('json')).then((result) => {
            assert.equal(result, ds.exportJson())
          })
        ])
      })

      it('shows data on the browser console', () => {
        ds.commit({
          'one': 1,
          'two': 2
        })
        ds.commit({
          'two': 2,
          'three': 3
        })

        const stub = sinon.stub(console, 'table')

        // Trigger data output
        ds.show()

        assert.ok(stub.withArgs(ds.data, ds.keys()).calledOnce)
        stub.restore()
      })
    })

    describe('Data transmission', () => {
      beforeEach(() => {
        // Simulate a response as suggested by R.J. Zaworski (MIT licenced)
        // http://rjzaworski.com/2015/06/testing-api-requests-from-window-fetch

        const res = new window.Response('', {
          status: 200,
          headers: {
            'Content-type': 'application/json'
          }
        })

        // Stub window.fetch to return the response,
        // wrapped in a promise
        sinon.stub(window, 'fetch')
          .returns(Promise.resolve(res))

        // Commit data to data store as well as staging area
        ds.commit({ 'one': 1, 'two': 2 })
        ds.commit({ 'three': 3, 'four': 4 })
        ds.set('five', 5)
      })

      afterEach(() => {
        window.fetch.restore()
      })

      // Extract data from stringified payload
      const extractData = (fetchArgs) =>
        JSON.parse(fetchArgs[1]['body'])['data']

      it('transmits data per post request', () => {
        // Make a mock request and ensure that it works
        // (i.e. that a promise is returned, and that the
        // response passed with it is ok)
        return ds.transmit('https://random.example')
          .then((response) => {
            assert.ok(window.fetch.calledOnce)

            // Check that response was received
            assert.ok(response.ok)

            // Make sure fetch has been called with the correct options
            assert.ok(window.fetch.withArgs(
              'https://random.example', {
              method: 'post',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                metadata: {
                  slice: 0,
                },
                url: window.location.href,
                data: ds.data,
              }),
              credentials: 'include',
            }).calledOnce)
            // TODO: There must be a better way than just checking
            // whether the arguments were passed correctly, no?
          })
      })

      it('will retry transmission if it fails', () => {
        window.fetch.restore()

        // And if at first you don't succeed ...
        const fetch = sinon.stub(window, 'fetch')
        fetch.onCall(0).callsFake(() => Promise.reject('not feeling like it'))
        fetch.onCall(1).callsFake(() => Promise.reject('you want it when?'))
        fetch.onCall(2).callsFake(() => Promise.reject('nah, not in the mood'))
        fetch.onCall(3).callsFake(() => Promise.reject(`lalala can't hear you`))
        fetch.onCall(4).callsFake(() => Promise.resolve(new window.Response()))

        return ds.transmit('https://random.example', {}, {
          retry: { delay: 0 }
        }).then(() => {
          assert.equal(
            fetch.callCount,
            5
          )
        })
      })

      it('uses an exponential backoff', () => {
        window.fetch.restore()

        const timestamps = []
        const fetch = sinon.stub(window, 'fetch')
        fetch.callsFake(() => {
          timestamps.push(performance.now())
          return Promise.reject('nope')
        })

        return ds.transmit('https://random.example', {}, {
          retry: { times: 2 }
        }).catch(() => {
          // Calculate timestamp deltas
          const deltas = timestamps
            .map((x, i, arr) => arr[i + 1] - x)
            .filter(x => !isNaN(x))

          // TODO: This is a very crude test
          assert.ok(
            (deltas[0] <= deltas[1]) &&
            (deltas[1] <= deltas[2])
          )
        })
      })

      it('gives up retrying eventually', () => {
        window.fetch.restore()

        // Abandon all hope, ye who enter here
        const fetch = sinon.stub(window, 'fetch')
        fetch.callsFake(() => Promise.reject('gonna nope right out of this'))

        return ds.transmit('https://random.example', {}, {
          retry: { delay: 1, factor: 1 }
        }).catch((error) => {
          assert.equal(error, 'gonna nope right out of this')
          assert.equal(fetch.callCount, 5)
        })
      })

      it('logs last incrementally transmitted row', () => {
        return ds.transmit(
          'https://random.example', {},
          { incremental: true }
        ).then(() => {
            assert.equal(ds._lastIncrementalTransmission, 2)

            // Add new row and transmit again
            ds.commit()
            return ds.transmit(
              'https://random.example', {},
              { incremental: true }
            )
          }).then(() => {
            assert.equal(ds._lastIncrementalTransmission, 3)
          })
      })

      it('can debounce transmissions', () => {
        const clock = sinon.useFakeTimers()

        ds.queueIncrementalTransmission('https://random.example')
        assert.notOk(window.fetch.called)
        clock.tick(2500)
        assert.ok(window.fetch.called)

        clock.restore()
      })

      it('sends all new data with debounced transmission', () => {
        const clock = sinon.useFakeTimers()

        ds.queueIncrementalTransmission('https://random.example')
        ds.commit({ six: 6 })
        ds.queueIncrementalTransmission('https://random.example')
        clock.runAll()

        assert.ok(window.fetch.calledOnce)
        assert.deepEqual(
          extractData(window.fetch.firstCall.args),
          ds.data
        )

        clock.restore()
      })

      it('sends data in increments', () => {
        const clock = sinon.useFakeTimers({
          toFake: ['setTimeout', 'clearTimeout']
        })

        // Queue and transmit first batch of data
        ds.queueIncrementalTransmission('https://random.example')

        // Fast-forward through first transmission
        clock.runAll()
        assert.ok(window.fetch.calledOnce)

        return (new Promise(resolve => setImmediate(resolve)))
          .then(() => {
            window.fetch.resetHistory()

            // Add new data, and transmit it
            ds.commit({ six: 6 })
            ds.queueIncrementalTransmission('https://random.example')

            // Fast-forward again
            clock.runAll()

            assert.ok(window.fetch.calledOnce)
            assert.deepEqual(
              extractData(window.fetch.lastCall.args),
              [{ five: 5, six: 6 }]
            )
            clock.restore()
          })
      })

      it('re-sends earlier data if incremental transmission fails', () => {
        // As above, but this time fail on a first set of transmissions
        window.fetch.callsFake(() => Promise.reject('nope'))

        const clock = sinon.useFakeTimers()
        const p = ds.queueIncrementalTransmission('https://random.example')
        clock.runAll()
        clock.restore()

        // Fast-forward through first batch of data (failing)
        return p.catch(error => null) // Disregard error
          .then(() => {
            const clock = sinon.useFakeTimers()

            // This time, the transmission succeeds
            window.fetch.resetHistory()
            window.fetch.callsFake(() => Promise.resolve(new Response()))

            // Add new data, and transmit it
            ds.commit({ six: 6 })
            ds.queueIncrementalTransmission('https://random.example')

            // Fast-forward again
            clock.runAll()

            assert.ok(window.fetch.calledOnce)
            assert.deepEqual(
              extractData(window.fetch.lastCall.args),
              [
                { one: 1, two: 2 },
                { three: 3, four: 4 },
                { five: 5, six: 6 }
              ]
            )
            clock.restore()
          })
      })

      it('can flush pending transmissions', () => {
        const clock = sinon.useFakeTimers()

        ds.queueIncrementalTransmission('https://random.example')
        assert.notOk(window.fetch.called)
        ds.flushIncrementalTransmissionQueue()
        assert.ok(window.fetch.called)

        clock.restore()
      })
    })
  })
})

})
