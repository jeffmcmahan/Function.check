'use strict'

const error = require('./error')
const g = typeof window !== 'undefined' ? window : global

const typesMap = {
	ANY_TYPE: 	'',
	Array: 		'if(!Array.isArray(v))e++;',
	'~Array': 	'if(typeof v!=="object"||v===null||typeof v.length!=="number")e++;',
	Boolean: 	'if(typeof v!=="boolean")e++;',
	Function: 	'if(typeof v!=="function")e++;',
	null: 		'if(v!==null)e++;',
	NaN:		'if(typeof v==="number"&&!isNaN(v))e++;',
	Number: 	'if(typeof v!=="number"||v+""==="NaN")e++;',
	Object: 	'if(Array.isArray(v)||!(v instanceof Object))e++;',
	'~Object':	'if(typeof v!=="object"||v===null||v.constructor)e++;',
	String: 	'if(typeof v!=="string")e++;',
	undefined: 	'if(typeof v!=="undefined")e++;'
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
	return src.slice(start, pos)
}

/*
Generates a function which resursively checks the type of a single value,
ensuring that it matches the semantics of the given generic type.
- param typeName: String
- param counters: Array
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
	return superCheck+
		'var '+i+','+len+','+keys+','+copy+';'+
		keys+'=Object.keys(v);'+ 
		len+'='+keys+'.length;'+ 
		copy+'=v;'+
		'for('+i+'=0;'+i+'<'+len+';'+i+'++){v='+copy+'['+keys+'['+i+']];'+subCheck+'}'
}

/*
Generates a function which resursively checks the type of a single value,
ensuring that it matches the semantics of the given duck type.
- param typeName: String
- param counters: Array
- returns: Function
 */
function duckTypeCheck(typeName, counters) {
	const propsList = splitBy(',', typeName.slice(1, -1))
	const copy = 'v' + ++counters.length
	const checks = [typesMap.Object, 'var '+copy+'=v;']
	propsList.forEach(function (prop) {
		const [name, subType] = splitBy(':', prop)
		checks.push(
			'v=v["'+name+'"];',
			getTypeChecks(subType, counters).join(''),
			'v='+copy+';'
		)
	})
	return checks.join('')
}

/*
Generates a nominal type check: the value's constructor name, or one of the
value's prototype ancestor's name must match the given type string.
- param type: String
- returns: String
*/
function namedTypeCheck(type) {
	if (type in g) return 'if (!(v instanceof '+type+'))e++;'
	return (
		'f=1;'+
		'if(v!==undefined&&v!==null) {'+
			'c=v.constructor;'+
			'while(c){'+
				'if(c.name==="'+type+'"){f=0;break};'+
				'if(c.constructor===c){e++;break};'+
				'c=c.__proto__;'+
			'}'+
		'}'+
		'if(f)e++;'
	)
}

/*
Generates a function which resursively checks the type of a single value,
ensuring that it matches the semantics of the given typeName.
- param typeName: String
- param counters: Array
- returns: Function
*/
function getTypeCheck(typeName, counters) {
	if (typeName in typesMap) return typesMap[typeName]
	if (typeName.slice(-1)[0] === ']') return genericTypeCheck(typeName, counters)
	if (typeName[0] === '{') return duckTypeCheck(typeName, counters)
	return namedTypeCheck(typeName)
}

/*
Generates a single function that recursively checks the type of a value to
ensure that it matches the semantics of the given typeName.
- param typeName: String
- param counters: Array
- returns: Array<String>
*/
function getTypeChecks(typeName, counters) {
	const disjuncts = splitBy('|', typeName).map(function (type) {
		return getTypeCheck(type, counters)
	})
	if (disjuncts.length > 1) {
		disjuncts.push('if(e<'+disjuncts.length+')e=0;') // If not all disjuncts failed, all's well.
	}
	return disjuncts
}

/*
Splits a string by the given delimiter, but respects curly bracket scope.
- param delimiter: String
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
		.map(function (bound, pos) {
			const prevBound = pos ? bounds[pos-1] + 1 : 0
			return list.slice(prevBound, bound).trim()
		})
		.filter(function (s) {return s})
	return split
}

/*
Removes both single-line and enclosed comments from the list.
- param list: String --- the parameters list
- returns: String
*/
function removeComments(list) {
	let pos = 0
	let inComment = false
	let commentStart = null
	let commentOpen = null
	const open = ['//', '/*']
	while(pos < list.length) {
		const current = list[pos]
		const peek = current + list[pos+1]
		if (!inComment && ~open.indexOf(peek)) {
			inComment = true
			commentStart = pos
			commentOpen = peek
		}
		if (inComment) {
			if (commentOpen === '/*' && peek === '*/') {
				list = list.slice(0, commentStart) + list.slice(pos + 2)
				pos = commentStart
				inComment = false
			}
			if (commentOpen === '//' && current === '\n') {
				list = list.slice(0, commentStart) + list.slice(pos)
				pos = commentStart
				inComment = false
			}
		}
		pos++
	}
	return list
}

/*
Compiles a set of type check statements for type declarations given in the
function source string.
- param src: String
- returns: Object
*/
function compile(src) {
	const list = getArgsList(src)
	let types = splitBy(',', removeComments(list))
	const counters = []
	const checks = [
		'var c,f,k,v,e=0,err=this.check.e;'+
		'if(__args.length!=='+types.length+')err(__args);',
	]
	const names = types.map(function (type) {
		return type.split('=')[0].trim()
	})
	types = types.map(function (type) {
		return (type.split('=')[1] || 'ANY_TYPE').split(".").pop()
	})
	types.forEach(function (type, i) {
		checks.push('v=__args['+i+'];'+ getTypeChecks(type, counters).join('') +'if(e)err(__args);')
	})
	return {checks, list, names, types, code:checks.join('')}
}

/*
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

// Make the .check property non-configurable and non-writable.
Object.defineProperty(Function.prototype, 'check', {
	configurable: false,
	enumerable: false,
	writable: false,
	value: compileCheck
})

module.exports = {compile}