/**
 Prints a string representing the value.
 - param value: *  
 - returns: String
 */
function printValueType(value) {
	if (value === null) return 'null'
	if (typeof value === 'undefined') return 'undefined'
	if (typeof value === 'number' && isNaN(value)) return 'NaN'
	return value.constructor.name
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
		return `function ${value.name}(${getArgsList(value.toString())}) ...`
	}
	return value.toString().slice(0,50)
}

function printError(funcName, declaration, messages) {
	const error = new TypeError('') // We'll totally rework this.
	const stack = []
	error.stack.toString().split('\n').forEach(s=> {
		if (stack.length || s.includes(funcName)) stack.push(s)
	})
	error.message = `${declaration}\n\n    ${messages.join('\n\n    ')}\n\n${stack.join('\n')}\n`
	error.stack = ''
	throw error
}

/**
 Run the checks argument by argument, and find the mismatches.
 - param func: Function
 - param checkLogic: String
 - param __args: Arguments
 */
module.exports = function (func, checkLogic, __args) {

	// Run the checks, one-by-one, to fine the offending parameters.
	const failures = []
	const counters = []
	checks = checkLogic.checks.map((chk, i) => chk.split('err(__args)').join(`failures.push(${i-1})`))
	for (let i = 0; i <= checkLogic.types.length; i++) {
		try {
			eval(checks[i] || '"// No check defined.";')
		} catch (err) {
			console.log(err)
		}
	}

	// Create Error messages for each failing parameter.
	const argCount = checkLogic.names.length
	const messages = failures.map(f => {
		if (f === -1) {
			return `- Bad arity: ${argCount} parameters required; ${__args.length} passed.`
		}
		if (f > __args.length - 1) {
			return `- ${checkLogic.names[f]} was not provided.`
		}
		return (
			`- ${checkLogic.names[f]} was not of type ${checkLogic.types[f]}. `+
			`${printValueType(__args[f])} passed: ${printValue(__args[f])}`
		)
	})

	// Print a recognizable portion of the function declaration.
	const declaration = `${func.name}(${checkLogic.list}) {...`

	// Throw an error with the stack altered for readability.
	printError(func.name, declaration, messages)
}
