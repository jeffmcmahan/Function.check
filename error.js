'use strict'

/**
 Prints a string representing the value.
 - param value: *  
 - returns: String
 */
function printValueType(value) {
	if (value === null) return 'null'
	if (typeof value === 'undefined') return 'undefined'
	if (typeof value === 'number' && isNaN(value)) return 'NaN'
	if (value.toString && '' + value === '[object Arguments]') return 'arguments'
	if (value.constructor) return value.constructor.name

	// values created with Object.create(null) are of type 'dictionary'
	if (typeof value === 'object' && !value.constructor) return 'dictionary'

	// Should never happen, but just in case...
	return typeof value
}

/**
 Pretty prints a concise representation of an object or array.
 - param obj: Array|Object
 - returns: String
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
 Pretty prints a concise representation of any value.
 - param value: *
 - returns: String
 */
function printValue(value) {
	if (value === null) return 'null'
	if (typeof value === 'string') return `"${value}"`
	if (typeof value === 'undefined') return 'undefined'
	if (typeof value === 'object') return printObject(value)
	if (typeof value === 'function') {
		return `function ${value.name}(...) ...`
	}
	return value.toString().slice(0,50)
}

function printError(funcName, declaration, messages) {
	const error = new TypeError('') // We'll totally rework this.
	let stack = error.stack.toString().split('\n')
	let start = 0
	for (let i = 0; i < stack.length; i++) {
		if (stack[i].includes('compileCheck')) start = i + 1
	}
	stack = stack.slice(start)
	error.message = `${declaration}\n\n    ${messages.join('\n\n    ')}\n\n${stack.join('\n')}\n`
	error.stack = ''
	throw error
}

/**
 Create error messages/descriptions for each failing parameter.
 - param __args: Arguments
 - param checkLogic: Object
 - param failures: Array
 - returns: Array<String> 
 */
function getMessages(checkLogic, __args, failures) {
	const count = checkLogic.names.length
	return failures.map(f => {
		if (f === -1) return `- Bad arity: ${count} parameters required; ${__args.length} passed.`
		if (f > __args.length-1) return `- ${checkLogic.names[f]} was not provided.`
		const problem = `- ${checkLogic.names[f]} was not of type ${checkLogic.types[f]}. `
		const passed = __args[f] === undefined || __args[f] === null
			? printValueType(__args[f]) + ' passed.'
			: `${printValueType(__args[f])} passed: ${printValue(__args[f])}`
		return problem + passed
	})
}

/**
 Run the checks argument by argument, and find the mismatches.
 - param checkLogic: String
 - param __args: Arguments
 - returns: Array<Number>
 */
function findFailures(checkLogic, __args) {
	const failures = []
	const counters = []
	const checks = checkLogic.checks.map((chk, i) => (
		chk.split('err(__args)').join(`failures.push(${i-1})`)
	))
	for (let i = 0; i <= checkLogic.types.length; i++) {
		let c,f,k,v,e=0
		try {
			eval(checks[i] || '"// No check defined.";')
		} catch (err) {
			console.log(err)
		}
	}
	return failures
}

/**
 Re-checks the arguments to produce an argument-by-argument description of what went wrong.
 - param func: Function
 - param checkLogic: String
 - param __args: Arguments
 */
module.exports = function (func, checkLogic, __args) {
	const failures = findFailures.call(this, checkLogic, __args) // Provide this for eval() calls.
	const messages = getMessages(checkLogic, __args, failures)
	const declaration = `\n\n${func.name || 'anonymous'}(${checkLogic.list}) { ...`
	printError(func.name, declaration, messages)
}
