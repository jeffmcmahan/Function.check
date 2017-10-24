'use strict'

const typesMap = {
  Any: v => true,
  Function: v => typeof v === 'function',
  Boolean: v => typeof v === 'boolean',
  String: v => typeof v === 'string',
  Number: v => typeof v === 'number' && !isNaN(v),
  Object: v => !(v instanceof Array) && v instanceof Object
}

/**
 * Prints a string representing the value.
 * @param {*} value 
 * @return {String}
 */
function printValueType(value) {
  if (value === null) return 'null'
  if (typeof value === 'undefined') return 'undefined'
  if (typeof value === 'number' && isNaN(value)) return 'NaN'
  return value.constructor.name
}

/**
 * Pretty prints a concise representation of an object or array.
 * @param {Array|object}
 * @return {String}
 */
function printObject(obj) {
  const ind = '    '
  let output = ''
  if (!(obj instanceof Array)) {
    Object.keys(obj).forEach(key => {
      output += `\n  ${key}: ${printValueType(obj[key])},`
    })
    output = `{\n  ${output.slice(0,-1).trim()}\n}`
  } else {
    obj.forEach((num, i) => {
      output += `\n  ${printValueType(obj[i])},`
    })
    output = `[\n  ${output.slice(0,-1).trim()}\n]`
  }
  if (output.length < 50) {
    output = output.replace(/\s+/g, ' ')
  }
  return output.split('\n').map(s=> ind + s).join('\n').trim()
}

/**
 * Pretty prints a concise representation of any value.
 * @param {*} value 
 * @return {String}
 */
function printValue(value) {
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'undefined') return 'undefined'
  if (typeof value === 'object') return printObject(value)
  if (typeof value === 'function') {
    return `function ${value.name}(${getArgsList(value.toString())}) ...`
  }
  return value.toString().slice(0,50)
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
 * Redoes the type checks and prints a detailed list of problems.
 * @param {Function} func
 * @param {Array<Object>} argTypes
 * @param {Array<Mixed>} values
 */
function showErr(func, argTypes, values) {
  let err = []
  argTypes.forEach((arg, i) => {
    if (values.length <= i) return err.push(`${arg.name} parameter not provided.`)
    if (!arg.check(values[i])) err.push(
      `${arg.name} was not of type ${arg.type}. ${printValueType(values[i])} `+
      `provided: ${printValue(values[i])}`
    )
  })
  if (values.length > argTypes.length) err.push(
    `Too many parameters: ${values.length} passed, ${argTypes.length} declared.`
  )
  if (err.length) {
    err = new TypeError(`${func.name}(${argTypes.list})\n\n  ${err.join('\n\n  ')}\n`)
    console.log(err)
    console.log('')
    throw err
  }
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
  return src.slice(start, pos).trim()
}

/**
 * Creates an array of objects that describe a parameter, its type, and a
 * function that validates the given type.
 * @param {Function} func 
 * @return {Array<Object>}
 */
function getArgumentTypes(func) {
  let argTypes = []
  const list = getArgsList(func.toString())
  if (list) {
    argTypes = list.split(',').map(s=>s.trim()).map(s => {
      let [name, type] = s.split('=')
      if (!type) type = 'Any'
      if (!/^[A-Z]/.test(type)) throw new Error('Default values not permitted.')
      const check = typesMap[type] || instanceOf.bind(null, type)
      return {name, type, check}
    })
  }
  argTypes.list = list
  argTypes.tests = argTypes.map(argType => argType.check)
  return argTypes
}

/**
 * Provides all non-arrow functions with easy declarative type checking.
 * @param {Arguments} values
 */
Function.prototype.check = function(values) {
  if (!this.__argTypes) this.__argTypes = getArgumentTypes(this)
  const tests = this.__argTypes.tests
  const len = tests.length
  if (len != values.length) return showErr(this, this.__argTypes, values)
  let i = 0
  for (i; i < len; i++) {
    if (!tests[i](values[i])) return showErr(this, this.__argTypes, values)
  }
}

module.exports = {}