'use strict'

const assert = require('assert')
require('../')

//==================================================================== Error Messages ==============

function simple(name=String, age=Number, data=Object, getMoreInfo=Function) {
	simple.check(arguments)
}

assert.throws(
	()=>simple(1, '2', false),
	e=>{
		const m = e.message
		return (
			m.includes('Bad arity: 4 parameters required; 3 passed.') &&
			m.includes('name was not of type String. Number passed: 1') &&
			m.includes('age was not of type Number. String passed: "2"') &&
			m.includes('data was not of type Object. Boolean passed: false') &&
			m.includes('getMoreInfo was not provided.')
		)
	},
	'Should describe 5 faults.'
)

assert.throws(
	()=>simple('', 2, {}, ''),
	e=>{
		const m = e.message
		return (
			!m.includes('name was not of type String. Number passed: 1') &&
			!m.includes('age was not of type Number. String passed: "2"') &&
			!m.includes('data was not of type Object. Boolean passed: false') &&
			m.includes('getMoreInfo was not of type Function')
		)
	},
	'Should not describe errors that did not occur (#1).'
)

assert.throws(
	()=>simple(1, 2, {}, ()=>{}),
	e=>{
		const m = e.message
		return (
			m.includes('name was not of type String. Number passed: 1') &&
			!m.includes('age was not of type Number. String passed: "2"') &&
			!m.includes('data was not of type Object. Boolean passed: false') &&
			!m.includes('getMoreInfo was not of type Function')
		)
	},
	'Should not describe errors that did not occur (#2).'
)

//==================================================================== Stack Trace =================

const obj = {
	cleanStack: function (arg=String) {
		obj.cleanStack.check(arguments)
	}
}

assert.throws(
	()=>obj.cleanStack(1),
	e=>{
		const msg = e.message.toLowerCase()
		return (
			!msg.includes('function.compilecheck') &&
			!msg.includes('function.eval') &&
			!msg.includes('printerror') &&
			!msg.includes('function.module.exports')
		)
	},
	'Should not print stack information about the type checker itself.'
)

//=============================================================== Declaration ======================

function declaration(
	a=String, // in-line comment
	/* Enclosed comment */ b=Number
) {
	declaration.check(arguments)
}

assert.throws(()=>declaration(5, ''), e=>e.message.includes(`
	a=String, // in-line comment
	/* Enclosed comment */ b=Number
`), 'The declaration should not be altered; leave comments, whitespace, as is.')

//============================================================= Non-redundant "passed" =============

function nonRedundant(a=String) {
	nonRedundant.check(arguments)
}

assert.throws(
	()=>nonRedundant(undefined),
	e=>e.message.includes('undefined passed.'),
	'Should not say "undefined passed: undefined".'
)

assert.throws(
	()=>nonRedundant(null),
	e=>e.message.includes('null passed.'),
	'Should not say "null passed: null".'
)

// @todo Union type errors.
// @todo Duck type errors.
// @todo Generis need generic-style type names: "... Array[Mixed] passed: [1, 'Joe', ..."

console.log('Error tests passed.')
