'use strict'

const typesMap = {
  Any: v=>true,
  Function: v=>typeof v == 'function',
  Boolean: v=>typeof v == 'boolean',
  String: v=>typeof v == 'string',
  Number: v=>typeof v === 'number' && !isNaN(v),
  Object: v=>!(v instanceof Array) && v instanceof Object
}

/**
 * Prints a string representing the value.
 * @param {*} value 
 * @return {String}
 */
function printType(value) {
  if (value === null) return 'null'
  if (typeof value === 'undefined') return 'undefined'
  if (typeof value === 'number' && isNaN(value)) return 'NaN'
  return value.constructor.name
}

/**
 * Nominal type checking.
 * @param {*} value
 * @param {String} typeName
 * @return {Boolean}
 */
function instanceOf(typeName, value) {
  let constructor = value.constructor
  while (constructor) {
    if (constructor.name === typeName) return true
    if (constructor.constructor === constructor) return false
    constructor = constructor.__proto__
  }
  return false
}

/**
 * Checks each value against a declared type (if any given).
 * @param {Array<Object>} argTypes 
 * @param {Array} values 
 */
function checkArgs(argTypes, values) {
  const err = []
  if (values.length > argTypes.length) err.push(
    `Too many parameters: ${values.length} passed, ${argTypes.length} declared.`
  )
  argTypes.forEach((arg, i) => {
    if (values.length <= i) return err.push(`${arg.name} parameter not provided.`)
    if (!arg.check(values[i])) err.push(
      `${arg.name} was not of type ${arg.type}. ${printType(values[i])} provided.`
    )
  })
  if (err.length) const err = new TypeError(
    `${this.name}(${argTypes.list})\n\n  ${err.join('\n\n  ')}\n`
  )
  console.log(err)
  throw err
}

/**
 * Returns the portion of a function source string that lists the arguments.
 * @param {String} src - A function source string
 * @return {String}
 */
function getArgsList(src) {
  let depth = 1
  const start = src.indexOf('(') + 1
  if (src[start] === ')') return ''
  let pos = start
  while (depth > 0) {
    pos++
    if (pos > src.length) throw new Error('Syntax error.')
    if (src[pos] === ')') depth--
    if (src[pos] === '(') depth++
  }
  return src.slice(start, pos)
}

/**
 * Creates an array of objects that describe a parameter, its type, and a
 * function that validates the given type.
 * @param {Function} func 
 * @return {Array<Object>}
 */
function getArgumentTypes(func) {
  const list = getArgsList(func.toString())
  if (!list) return []
  const argTypes = list.split(',').map(s=>s.trim()).map(s => {
    let [name, type] = s.split('=')
    if (!type) type = 'Any'
    if (!/^[A-Z]/.test(type)) {
      throw new Error('Default values are not permitted.')
    }
    const check = typesMap[type] || instanceOf.bind(null, type)
    return {name, type, check}
  })
  argTypes.list = list
  return argTypes
}

/**
 * Provides all non-arrow functions with easy declarative type checking.
 * @param {Arguments} args
 */
Function.prototype.check = function(args) {
  if (!this.__check) this.__check = checkArgs.bind(this, getArgumentTypes(this))
  this.__check(args)
}

module.exports = {}