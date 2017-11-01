'use strict'

const assert = require('assert')
require('..')

function simple(name=String, age=Number, data=Object, getMoreInfo=Function) {
	simple.check(arguments)
}

assert.throws(
	()=>simple(1, '2', false),
	e => {
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

// @todo Union type errors.
// @todo Duck type errors.
// @todo Generic type errors.

console.log('Error tests passed.')
