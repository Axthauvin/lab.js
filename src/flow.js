// Flow control components for lab.js
import { shuffle, mean } from 'lodash'
import { Component, status, handMeDowns } from './core'

// Helper function to handle nested components
const prepareNested = function(nested, parent) {
  // Setup parent links on nested components
  nested.forEach(c => (c.parent = parent))

  // Set ids on nested components
  nested.forEach((c, i) => {
    // For each child, use this component's id
    // and append a counter
    if (parent.options.id == null) {
      c.options.id = String(i)
    } else {
      c.options.id = [parent.options.id, i].join('_')
    }
  })

  // Pass on specified attributes
  nested.forEach((c) => {
    parent.options.handMeDowns.forEach((k) => {
      c.options[k] = c.options[k] || parent.options[k]
    })
  })

  // Trigger prepare on all nested components
  return Promise.all(
    nested.map(c => c.prepare(false)), // indicate automated call
  )
}

// A sequence combines an array of other
// components and runs them sequentially
export class Sequence extends Component {
  constructor(options={}) {
    super(options)

    this.options = {
      // Define an array of nested components
      // to iterate over
      content: [],
      // Shuffle items, if so desired
      shuffle: false,
      // Use default hand-me-downs
      // unless directed otherwise
      // (note that the hand-me-downs are copied)
      handMeDowns: [...handMeDowns],
      ...this.options,
    }

    // Set default values for current component and index
    this.internals.currentComponent = null
    this.internals.currentPosition = null
  }

  async onPrepare() {
    // Shuffle content, if requested
    if (this.options.shuffle) {
      this.options.content = shuffle(this.options.content)
    }

    // Define an iterator over the content
    this.internals.iterator = this.options.content.entries()
    this.internals.stepper = this.step.bind(this)

    // Prepare nested items
    await prepareNested(this.options.content, this)
  }

  async onRun() {
    // Make the first step
    return await this.step()
  }

  onEnd() {
    // End prematurely, if necessary
    if (this.internals.currentComponent.status !== status.done) {
      this.internals.currentComponent.off('after:end', this.internals.stepper)
      this.internals.currentComponent.end('abort by sequence')
    }
  }

  async step() {
    if (this.status === status.done) {
      throw new Error('Sequence ended, can\'t take any more steps')
    }

    // Move through the content
    const next = this.internals.iterator.next()
    if (next.done) {
      return await this.end()
    } else {
      [this.internals.currentPosition, this.internals.currentComponent] = next.value
      this.internals.currentComponent.on('after:end', this.internals.stepper)
      this.triggerMethod('step')
      return await this.internals.currentComponent.run()
    }
  }

  get progress() {
    return mean(
      this.options.content.map(c => c.progress),
    )
  }
}

Sequence.module = ['flow']

// A loop functions exactly like a sequence,
// except that the components in the loop are
// generated upon initialization from a
// factory function and a data collection.
// Technically, the content is generated by
// mapping the data onto the factory function.
export class Loop extends Sequence {
  constructor(options={}) {
    super(options)

    this.options = {
      // Generate the content by applying
      // the componentFactory function to each
      // entry in the data array
      content: options.parameters.map(options.componentFactory),
      ...this.options,
    }

  }
}

Loop.module = ['flow']

// A parallel component executes multiple
// other components simultaneously
export class Parallel extends Component {
  constructor(options={}) {
    super(options)

    this.options = {
      // The content, in this case,
      // consists of an array of components
      // that are run in parallel.
      content: [],
      mode: 'race',
      handMeDowns: [...handMeDowns],
      ...this.options,
    }
  }

  onPrepare() {
    prepareNested(this.options.content, this)
  }

  // The run method is overwritten at this point,
  // because the original promise is swapped for a
  // version that runs all nested items in parallel
  onRun() {
    // End this component when all nested components,
    // or a single component, have ended
    Promise[this.options.mode](
      this.options.content.map(c => c.waitFor('end')),
    ).then(() => this.end())

    // Run all nested components simultaneously
    return Promise.all(
      this.options.content.map(c => c.run()),
    )
  }

  onEnd() {
    // Cancel remaining running nested components
    this.options.content.forEach((c) => {
      if (c.status < status.done) {
        c.end('abort by parallel')
      }
    })
  }

  get progress() {
    return mean(
      this.options.content.map(c => c.progress),
    )
  }
}

Parallel.module = ['flow']
