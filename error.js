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

	// values created with Object.create(null) are of type '~Object'
	if (typeof value === 'object' && !value.constructor) return '~Object'

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
		Object.keys(obj).forEach(function (key) {
			output += '\n  '+key+': '+printValueType(obj[key])+','
		})
		output = '{\n  '+output.slice(0,-1).trim()+'\n}'
	} else {
		obj.forEach(function (num, i) {
			output += '\n  '+printValueType(obj[i])+','
		})
		output = '[\n  '+output.slice(0,-1).trim()+'\n]'
	}
	if (output.length < 50) output = output.replace(/\s+/g, ' ')
	return output
		.split('\n')
		.map(function (s) {return ind + s})
		.join('\n')
		.trim()
}

/**
 Pretty prints a concise representation of any value.
 - param value: *
 - returns: String
 */
function printValue(value) {
	if (value === null) return 'null'
	if (typeof value === 'string') return '"'+value+'"'
	if (typeof value === 'undefined') return 'undefined'
	if (typeof value === 'object') return printObject(value)
	if (typeof value === 'function') {
		return 'function '+value.name+'(...) ...' // Does not handle function* or async function.
	}
	return value.toString().slice(0,50)
}

function printError(funcName, declaration, messages, async=false) {
	const error = new TypeError('') // We'll totally rework this.
	let stack = error.stack.toString().split('\n')
	let start = 0
	for (let i = 0; i < stack.length; i++) {
		if (~stack[i].indexOf('compileCheck')) start = i + 1
	}
	stack = stack.slice(start)
	error.message = declaration+'\n\n    '+messages.join('\n\n    ')+'\n\n'+stack.join('\n')+'\n'
	error.stack = ''
	if (async && typeof process === 'object') {
		if (!__IS_TESTING) {
			process.emitWarning(error)
		}
	}
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
	return failures.map(function (f) {
		if (f === -1) return '- Bad arity: '+count+' parameters required; '+__args.length+' passed.'
		if (f > __args.length-1) return '- '+checkLogic.names[f]+' was not provided.'
		const problem = '- '+checkLogic.names[f]+' was not of type '+checkLogic.types[f]+'. '
		const passed = __args[f] === undefined || __args[f] === null
			? printValueType(__args[f]) + ' passed.'
			: printValueType(__args[f]) + ' passed: ' + printValue(__args[f])
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
	const checks = checkLogic.checks.map(function (chk, i) {
		return chk.split('err(__args)').join('failures.push('+ (i-1) +')')
	})
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
exports.sync = function (func, checkLogic, __args) {
	const failures = findFailures.call(this, checkLogic, __args) // Provide this for eval() calls.
	const messages = getMessages(checkLogic, __args, failures)
	const declaration = `\n\n${func.name || 'anonymous'}(${checkLogic.list}) { ...`
	printError(func.name, declaration, messages)
}

// Converts a native arguments object to an array.
function toArray(args) {
	const arr = []
	for (let i = 0; i < args.length; i++) {
		arr[i] = args[i]
	}
	return arr
}

/*
Reports that the given promise resolved a value not permitted by the type declaration.
 - param func: Function
 - param checkLogic: String
 - param __args: Arguments
 - param promise: Promise
 - param badValue: *
*/
exports.async = function (func, checkLogic, __args, promise, badValue) {
	const declaration = `\n\n${func.name || 'anonymous'}(${checkLogic.list}) { ...`
	const argNum = toArray(__args).indexOf(promise)
	const resolved = 'The promise resolved '+ printValueType(badValue) + ': ' + printValue(badValue)
	const messages = [
		'- ' + 
		checkLogic.names[argNum] + ' was not of type ' + 
		checkLogic.types[argNum] + '. ' + resolved
	]
	printError(func.name, declaration, messages, true)
}
