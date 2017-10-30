'use strict'

require('..')
const assert = require('assert')

//================================================================ Arity ===========================

function arityVoid() {
  	arityVoid.check(arguments)
}

assert.throws(
	()=>arityVoid(1),
	'Should throw when arguments are passed to void function.'
)

assert.doesNotThrow(
	()=>arityVoid(),
	'Should not throw when no arguments are passed to void function.'
)

function arity(a=Number, b=Number) {
  	arity.check(arguments)
}

assert.doesNotThrow(
	()=>arity(1, 2),
	'Should not throw when correct number of arguments are passed.'
)

assert.throws(
	()=>arity(1),
	'Should throw when too few arguments are passed.'
)

assert.throws(
	()=>arity(1, 2, 3),
	'Should throw when too many arguments are passed.',
	err => err.message.includes('Too many arguments')
)

//================================================================ Primitives ======================

function primitives(a=Boolean, b=String, c=Number, d=Array, e=Object, f=Function) {
  	primitives.check(arguments)
}

assert.doesNotThrow(
	()=>primitives(false, '', 0, [], {}, ()=>{}),
	'Primitives: Should not throw when all type requirements are satisfied.'
)

assert.throws(
	()=>primitives('false', '', 0, [], {}, ()=>{}),
	'Primitives: Should throw when Boolean is required, but String passed.'
)

assert.throws(
	()=>primitives(false, 0, 0, [], {}, ()=>{}),
	'Primitives: Should throw when String is required, but Number passed.'
)

assert.throws(
	()=>primitives(false, '', NaN, [], {}, ()=>{}),
	'Primitives: Should throw when Number is required, but NaN is passed.',
	err => err.message.includes('NaN')
)

assert.throws(
	()=>primitives(false, '', 0, {}, {}, ()=>{}),
	'Primitives: Should throw when Array is required, but Object is passed.'
)

assert.throws(
	()=>primitives(false, '', 0, [], [], ()=>{}),
	'Primitives: Should throw when Object is required, but Array is passed.'
)

assert.throws(
	()=>primitives(false, '', 0, [], {}, true),
	'Primitives: Should throw when Function is required, but Boolean is passed.'
)

//================================================================= Non-checking ===================

function nonChecking(a, b, c) {
  	nonChecking.check(arguments)
}

assert.throws(
	()=>nonChecking(),
	'Should throw when arity is wrong, even when not checking types.'
)

assert.doesNotThrow(
	()=>nonChecking(1, 2, 3),
	'Should not throw when nothing is checked (#1).'
)

assert.doesNotThrow(
	()=>nonChecking('1', [], false),
	'Should not throw when nothing is checked (#2).'
)

//================================================================== Mixed RQs =====================

function mixed(a=String, b, c=Number, d, e=Object) {
	mixed.check(arguments)
}

assert.doesNotThrow(
	()=>mixed('', false, 0, ()=>{}, {}),
	'Should not throw when the required types are satisfied.'
)

assert.throws(
	()=>mixed('', false, 0, ()=>{}, []),
	'Should throw when any of the required types is not satisfied.'
)

//=================================================================== Custom classes ===============

class Custom {}

function customClasses(a=Custom) {
  	customClasses.check(arguments)
}

assert.doesNotThrow(
	()=>customClasses(new Custom),
	'Should not throw when the correct custom class is passed.'
)

assert.throws(
	()=>customClasses({}),
	'Should throw when Custom is required, but a plain Object is passed.'
)

//==================================================================== Superclasses ================

class CustomObject extends Object {}
class VeryCustomObject extends CustomObject {}

function superclass(a=Object) {
  	superclass.check(arguments)
}

function superclass2(a=CustomObject) {
  	superclass2.check(arguments)
}

assert.doesNotThrow(
	()=>superclass(new CustomObject),
	'Should not throw when a subclass is passed. (#1)'
)

assert.doesNotThrow(
	()=>superclass(new VeryCustomObject),
	'Should not throw when a subclass is passed. (#2)'
)

assert.doesNotThrow(
	()=>superclass2(new VeryCustomObject),
	'Should not throw when a subclass is passed. (#3)'
)

//===================================================================== Methods ====================

class ClassWithMethods {
	methodFunc(a=Number) {
		this.methodFunc.check(arguments)
	}
}

assert.doesNotThrow(
	()=>new ClassWithMethods().methodFunc(0),
	'Should not throw when a method is called with correct types.'
)

assert.throws(
	()=> new ClassWithMethods().methodFunc(false),
	'Should throw when a method is called with an incorrect type.'
)

//====================================================================== Disjoint Types ============

function disj(arg=Array|Object|String) {
	disj.check(arguments)
}

assert.doesNotThrow(
	()=>disj([]),
	'Should not throw when disjoint type requirement is met.'
)

assert.throws(
	()=>disj(5),
	'Should throw when a disjoint type requirement is not met.'
)

//======================================================================= Lookups ==================

const http = require('http')

function lookup(req=http.ClientRequest) {
	genericObj.check(arguments)
}

assert.throws(
	()=>genericObj({}),
	'Should throw when the lookup type requirement is not satisfied.'
)

assert.throws(
	()=>genericObj(new http.ClientRequest),
	'Should not throw when the lookup type requirement is satisfied.'
)

//======================================================================= Generics =================

function genericArr(names=Array[String]) {
	genericArr.check(arguments)
}

assert.doesNotThrow(
	()=>genericArr(['John']),
	'Should not throw when the generic type is satisfied.'
)

assert.throws(
	()=>genericArr([5]),
	'Should throw when the generic type is not satisfied.'
)

function genericMultArr(names=Array[Array[String]]) {
	genericMultArr.check(arguments)
}

assert.doesNotThrow(
	()=>genericMultArr([['foo', 'bar'], ['baz'], []]),
	'Should not throw when the nested generic type is satisfied.'
)

assert.throws(
	()=>genericMultArr([['foo', 'bar'], ['baz'], [3]]),
	'Should throw when the nested generic type is not satisfied.'
)

//======================================================================= Duck =====================

function duck(arg={prop:Array[String], prop2:Number}) {
	duck.check(arguments)
}

assert.doesNotThrow(
	()=>duck({prop:['5'], prop2:3}),
	'Should not throw when duck type is satisfied.'
)

assert.throws(
	()=>duck({prop:[5], prop2:'3'}),
	'Should not throw when duck type is satisfied.'
)

console.log('Tests passed.\n')
