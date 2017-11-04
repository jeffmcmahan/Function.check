'use strict'

const error = require('./error')
const g = typeof window !== 'undefined' ? window : global
const typesMap = {
	undefined: 'throw new SyntaxError("Function.check: undefined is not a valid type declaration.");',
	Any: '',
	null: 'if(v!==null)e++;',
	Function: 'if(typeof v!=="function")e++;',
	Boolean: 'if(typeof v!=="boolean")e++;',
	String: 'if(typeof v!=="string")e++;',
	Number: 'if(typeof v!=="number"||v+""==="NaN")e++;',
	Object: 'if(v instanceof Array||!(v instanceof Object))e++;',
	object: 'if(typeof v!=="object"||v===null||v instanceof Object)e++;'
}

/**
 Returns the portion of a function source string that lists the arguments.
 - param src: String --- A function source string
 - returns: String
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
 Generates a function which resursively checks the type of a single value,
 ensuring that it matches the semantics of the given generic type.
 - param typeName: String
 - returns: Function
 */
function genericTypeCheck(typeName, counters) {
	const superName = typeName.slice(0, typeName.indexOf('['))
	const superCheck = getTypeChecks(superName, counters).join('')
	const subType = typeName.slice(superName.length+1, -1)
	const subCheck = getTypeChecks(subType, counters)
	const id = ++counters.length
	const i = 'i' + id
	const len = 'l' + id
	const copy = 'v' + id
	const keys = 'k' + id
	return [
		superCheck,
		'if(e)err(__args);',
		`var ${i},${len},${keys},${copy};`,
		`${keys}=Object.keys(v);`,
		`${len}=${keys}.length;`,
		`${copy}=v;`,
		`for(${i}=0;${i}<${len};${i}++){v=${copy}[${keys}[${i}]];${subCheck}}`
	].join('')
}

/**
 Generates a function which resursively checks the type of a single value,
 ensuring that it matches the semantics of the given duck type.
 - param typeName: String
 - returns: Function
 */
function duckTypeCheck(typeName, counters) {
	const propsList = splitBy(',', typeName.slice(1, -1))
	const copy = 'v' + ++counters.length
	const checks = [typesMap.Object, `var ${copy}=v;`]
	propsList.forEach(prop => {
		const [name, subType] = splitBy(':', prop)
		checks.push(
			`v=v["${name}"];`,
			getTypeChecks(subType, counters).join(''),
			`v=${copy};`
		)
	})
	return checks.join('')
}

function namedTypeCheck(type) {
	if (type in g) return `if (!(v instanceof ${type}))e++;`
	return (
		'c=v.constructor;'+
		'f=1;'+
		'while(c){'+
			`if(c.name==='${type}'){f=0;break};`+
			'if(c.constructor===c){e++;break};'+
			'c=c.__proto__;'+
		'}'+
		'if(f)e++;'
	)
}

/**
 Generates a function which resursively checks the type of a single value,
 ensuring that it matches the semantics of the given typeName.
 - param typeName: String
 - returns: Function
 */
function getTypeCheck(typeName, counters) {
	if (typeName in typesMap) return typesMap[typeName]
	if (typeName.slice(-1)[0] === ']') return genericTypeCheck(typeName, counters)
	if (typeName[0] === '{') return duckTypeCheck(typeName, counters)
	return namedTypeCheck(typeName)
}

/**
 Generates a single function that recursively checks the type of a value to
 ensure that it matches the semantics of the given typeName.
 - param typeName: String
 - returns: Array<String>
 */
function getTypeChecks(typeName, counters) {
	const disjuncts = splitBy('|', typeName).map(type => getTypeCheck(type, counters))
	if (disjuncts.length > 1) {
		disjuncts.push(`if(e<${disjuncts.length})e=0;`) // If not all disjuncts failed, all's well.
	}
	return disjuncts
}

/**
 Segments the arguments list, without messing with embedded objects.
 - param list: String
 - returns: Array<String>
 */
function splitBy(delimiter, list) {
	let depth = 0
	let pos = 0
	const bounds = []
	while (pos < list.length) {
		if (list[pos] === delimiter && !depth) bounds.push(pos)
		if (list[pos] === '{') depth++
		if (list[pos] === '}') depth--
		pos++
	}
	bounds.push(list.length)
	const split = bounds
		.map((bound, pos) => {
			const prevBound = pos ? bounds[pos - 1] + 1 : 0
			return list.slice(prevBound, bound).trim()
		})
		.filter(s=>s)
	return split
}

/**
 Compiles a set of type check statements for type declarations given in the
 function source string.
 - param src: String
 - returns: Object
 */
function compile(src) {
	const list = getArgsList(src)
	let types = splitBy(',', list)
	const counters = []
	const checks = [
		'var c,f,k,v,e=0,err=this.check.e;' +
		`if(__args.length!==${types.length})err(__args);`,
	]
	const names = types.map(type => type.split('=')[0])
	types = types.map(type => (type.split('=')[1] || 'Any').split(".").pop())
	types.forEach((type, i) => (
		checks.push(
			`v=__args[${i}];` +
			getTypeChecks(type, counters).join('') + 
			'if(e)err(__args);'
		)
	))
	return {checks, list, names, types, code:checks.join('')}
}

/**
 Replaces this.check with a new function which is a compiled set of type
 check statemnets (no function calls).
 - param __args: Object<Arguments>
 */
function compileCheck(__args) {
	const logic = compile(this.toString())
	const check = Function('__args', logic.code).bind(this)
	check.e = error.bind(this, this, logic)
	Object.defineProperty(this, 'check', {
		configurable: false,
		enumerable: false,
		writable: false,
		value: check
	})
	check(__args)
}

// Making property non-configurable/writable may help the JIT compiler.
Object.defineProperty(Function.prototype, 'check', {
	configurable: false,
	enumerable: false,
	writable: false,
	value: compileCheck
})

module.exports = {compile, types:{}}