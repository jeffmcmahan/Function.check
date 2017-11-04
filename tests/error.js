'use strict'

const assert = require('assert')
require('..')

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

// @todo Union type errors.
// @todo Duck type errors.
// @todo Generis need generic-style type names: "... Array[Mixed] passed: [1, 'Joe', ..."

console.log('Error tests passed.')
