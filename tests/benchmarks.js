'use strict'

const Benchmark = require('benchmark')
require('..')

const suite = new Benchmark.Suite

const str = ''
function primitives(arg=String) {
	primitives.check(arguments)
}

const arr = []
function arrays(arg=Array) {
	arrays.check(arguments)
}

const obj = {}
function objects(arg=Object) {
	objects.check(arguments)
}

function unions(arg=String|Number) {
	unions.check(arguments)
}

class SomeType {}
const someTypeInstance = new SomeType
function customClass(arg=SomeType) {
	customClass.check(arguments)
}

const strArr = ['']
function generics(arg=Array[String]) {
	generics.check(arguments)
}

const duck = {prop:''}
function ducktypes(arg={prop:String}) {
	ducktypes.check(arguments)
}

suite.add('primitives', function() {
  	primitives(str)
})
.add('arrays', function() {
	arrays(arr)
})
.add('objects', function() {
	objects(obj)
})
.add('unions', function() {
	unions(str)
})
.add('classes', function() {
	customClass(someTypeInstance)
})
.add('generics', function() {
	generics(strArr)
})
.add('ducktypes', function() {
	ducktypes(duck)
})
.on('cycle', function(event) {
  	console.log(String(event.target))
})
.on('complete', function() {
  	console.log('Fastest is ' + this.filter('fastest').map('name'))
})
.run()