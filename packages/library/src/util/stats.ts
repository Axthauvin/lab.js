// TODO: These are fairly naive implementations,
// it might be worth pulling in some higher-quality
// alternatives. In particular, lodash covers the
// sum and the mean.
// TODO: It would be cool to shield these functions
// against obvious errors, for example if only
// numbers are passed in (as multiple arguments).

export const sum = a =>
  a.reduce((x, y) => x + y)

export const mean = a =>
  sum(a) / a.length

export const variance = (a) => {
  // The variance is the mean
  // of the sum of squares
  const m = mean(a)
  return mean(
    a.map(x => (x - m)**2)
  )
}

export const std = a =>
  Math.sqrt(variance(a))
