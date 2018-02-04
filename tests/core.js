'use strict'

const {compile} = require('..')
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

//==================================================================== Any =========================

function anyType(a) {
	anyType.check(arguments)
}

assert.doesNotThrow(
	()=>anyType(0),
	'Should not throw when any is declared and arity is correct.'
)

assert.throws(
	()=>anyType(),
	'Should throw when any is declared and arity is incorrect.'
)

//==================================================================== ~Object =====================

function anonymousType(a=~Object) {
	anonymousType.check(arguments)
}

assert.doesNotThrow(
	()=>anonymousType(Object.create(null)),
	'Should not throw when Any is declared and arity is correct.'
)

assert.throws(
	()=>anonymousType({}),
	'Should throw when Any is declared and arity is incorrect.'
)

assert.throws(
	()=>anonymousType(null),
	'Should throw when Any is declared and arity is incorrect.'
)

//==================================================================== null ========================

function nullType(arg=null) {
	nullType.check(arguments)
}

assert.doesNotThrow(
	()=>nullType(null),
	'Should not throw when null matches the type declaration.'
)

assert.throws(
	()=>nullType(undefined),
	'Should throw when null is required but undefined passed.'
)

//==================================================================== undefined ===================

function undefType(arg=undefined) {
	undefType.check(arguments)
}

assert.doesNotThrow(
	()=>undefType(undefined),
	'Should not throw when undefined matches the type declaration.'
)

assert.throws(
	()=>undefType(null),
	'Should throw when undefined is required but null passed.'
)

assert.throws(
	()=>undefType(),
	'Should throw when undefined is required but nothing is passed.'
)

//================================================================ arguments =======================

const argsObj = (function () {return arguments})()

function argsObject(args=~Array) {
	argsObject.check(arguments)
}

assert.throws(
	()=>argsObject({}),
	'Should throw when non-arguments object is passed to func requiring arguments.'
)

assert.doesNotThrow(
	()=>argsObject(argsObj),
	'Should not throw when arguments passed and arguments required.'
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

class Custom2 {
	constructor(a=Number) {
		Custom2.check(arguments)
	}
}

assert.doesNotThrow(
	()=> new Custom2(5),
	'Should not throw when constructor declaration matches passed parameter.'
)

assert.throws(
	()=> new Custom2('5'),
	'Should throw when constructor declaration does not match the passed parameter.'
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

function nullFunc(arg=Object|null) {
	nullFunc.check(arguments)
}

assert.doesNotThrow(
	()=>nullFunc({}),
	'Should not throw when the non-falsy values are given in disjunctive type checks.'
)

assert.doesNotThrow(
	()=>nullFunc(null),
	'Should not throw when a falsy value is given in disjunctively falsy type check. (#1)'
)

assert.throws(
	()=>nullFunc(''),
	'Should throw when neither null nor object is passed as Object|null argument.'
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

function genericArrDisjunct(names=String|Array[String]) {
	genericArrDisjunct.check(arguments)
}

assert.doesNotThrow(
	()=>genericArrDisjunct(['foo', 'bar']),
	'Should not throw when iterable properties satisfy generic type.'
)

assert.doesNotThrow(
	()=>genericArrDisjunct('foo'),
	'Should not throw when primitive disjunct type is satisfied.'
)

function objGeneric(data=Object[String]) {
	objGeneric.check(arguments)
}

assert.doesNotThrow(
	()=>objGeneric({prop1:'', prop2:'Yo'}),
	'Should not throw when iterable properties satisfy generic type.'
)

assert.throws(
	()=>objGeneric({prop1:'', prop2:4}),
	'Should throw when iterable properties do not satisfy generic type.'
)

class MyGenericClass {
	constructor() {
		this.prop1 = ''
		this.prop2 = ''
	}
}

const goodValue = new MyGenericClass
const badValue = new MyGenericClass
badValue.prop1 = 0

function customGeneric(data=MyGenericClass[String]) {
	customGeneric.check(arguments)
}

assert.doesNotThrow(
	()=>customGeneric(goodValue),
	'Should not throw when iterable properties satisfy generic type.'
)

assert.throws(
	()=>customGeneric(badValue),
	'Should throw when iterable properties do not satisfy generic type.'
)

assert.throws(
	()=>customGeneric({prop1:'', prop2:4}),
	'Should throw when iterable properties do not satisfy generic type.'
)

//======================================================================= Duck =====================

function duck(arg={prop:Array[String], prop2:Number}) {
	duck.check(arguments)
}

assert.doesNotThrow(
	()=>duck({prop:['5'], prop2:3}),
	'Should not throw when duck type is satisfied (#1).'
)

assert.throws(
	()=>duck({prop:[5], prop2:'3'}),
	'Should throw when duck type is not satisfied.'
)

function duckNested(conf={user:{name:String}, friends:Array[Object]}) {
	duckNested.check(arguments)
}

assert.doesNotThrow(
	()=>duckNested({user:{name:''}, friends:[{}]}),
	'Should not throw when duck type is satisfied (#2).'
)

//======================================================================= Function Types ===========

const anonFunc = function (arg=String) {
	anonFunc.check(arguments)
}

assert.doesNotThrow(
	()=>anonFunc(''),
	'Should not throw when anonymous function has correct types passed.'
)

assert.throws(
	()=>anonFunc(1),
	'Should throw when anonymous function has incorrect types passed.'
)

const ns = {
	anonMethod: function (arg=String) {
		ns.anonMethod.check(arguments)
	}
}

assert.doesNotThrow(
	()=>ns.anonMethod(''),
	'Should not throw when anonymous method has correct types passed.'
)

assert.throws(
	()=>ns.anonMethod(1),
	'Should throw when anonymous method has incorrect types passed.'
)

//====================================================================== Commented =================

function comments(
	a= /* hi there */ Number, 	// comment 1
	b=String // comment 2
	// /* Yo. */
	/* // Yo. */
) {
	comments.check(arguments)
}

assert.doesNotThrow(
	()=>comments(5, ''),
	'Should not throw when commented declaration types match values passed.'
)

assert.throws(
	()=>comments('', 5),
	'Should throw when commented declaration types do not match values passed.'
)

console.log('Core tests passed.')