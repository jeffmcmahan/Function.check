<img src="https://raw.githubusercontent.com/jeffmcmahan/Function.check/master/function-check.png" width="244.5" height="261">

![travis status](https://travis-ci.org/jeffmcmahan/Function.check.svg?branch=master)

A simple and performant way of declaring and checking types at runtime in javascript---without a transpile step.

```sh
npm install function.check
```

## Example
Include the library with `require('function.check')`, and it will define a `Function#check` method, which can be used to check argument arity and types. Declare types using the existing javascript default value syntax, and pass `arguments` to `<function-name>.check` as shown here:

```js
function newUser(name = String, email = String, age = Number) {
	
	newUser.check(arguments)
	
	// Do stuff.
}
```

Under the hood, the type declarations are compiled to a stack of type check statements, which are invoked by the `.check()` call. Failures are clearly indicated:

```
TypeError: newUser(name = String, email = String, age = Number) {...

     - name was not of type String. Boolean provided: false

     - email was not of type String. Function provided: function find(query=String) ...

     - age was not provided.

     at newUser (.../index.js:46:14)
     at Object.<anonymous> (.../index.js:85:1)
     at Module._compile (module.js:624:30)
     at Object.Module._extensions..js (module.js:635:10)
     at Module.load (module.js:545:32)
     at tryModuleLoad (module.js:508:12)
     at Function.Module._load (module.js:500:3)
     at Function.Module.runMain (module.js:665:10)
```

## Performance
Benchmark.js indicates that Function.check is *quite* fast (see /tests/benchmark.js):

```
unions 			x 154,604,016 ops/sec 	±0.75% 	(93 runs sampled)
arrays 			x 151,521,044 ops/sec 	±0.67% 	(90 runs sampled)
primitives 		x 150,545,643 ops/sec 	±0.56% 	(92 runs sampled)
objects 		x 105,305,880 ops/sec 	±0.75% 	(86 runs sampled)
duck types 		x  95,785,643 ops/sec 	±0.71% 	(89 runs sampled)
custom classes 	x  30,297,449 ops/sec 	±0.70% 	(91 runs sampled)
generics 		x   6,280,304 ops/sec 	±0.73% 	(93 runs sampled)

Mid-2014 15" MacBook Pro
Node 9.0.0
```

## Supports named and anonymous functions.
Ordinary functions and methods as well as async functions, generator functions, and async generator functions are all supported:

```js
function newUser(name=String, email=String, zipcode=Number) {
	newUser.check(arguments)
	//...
}

async function newUser(name=String, email=String, zipcode=Number) {
	newUser.check(arguments)
	//...
}

function* newUser(name=String, email=String, zipcode=Number) {
	newUser.check(arguments)
	//...
}

async function* newUser(name=String, email=String, zipcode=Number) {
	newUser.check(arguments)
	//...
}
```

Anonymous functions:
```js
const newUser = async function*(name=String, email=String, zipcode=Number) {
	newUser.check(arguments)
	//...
}
```

To check a method's arguments, use `<namespace>.<method-name>` to check arguments: 

```js
class User {
	promote(newRole=String, promotedBy=User) {
		this.promote.check(arguments)
		//...
	}
}

const ns = {
	newUser: function (name=String, email=String, zipcode=Number) {
		ns.newUser.check(arguments)
		//...
	}
}
```

**Notice:** Arrow functions are not supported because they do not bind an `arguments` object.

## Type Support
All types available to your function declaration are supported automatically.

```js
class User {}

async function authorize(user = User, password = String) {
	authorize.check(arguments)
	// ...
}
```

Superclass/subclass relationships are supported as well:

```js
class User {}
class Administrator extends User {}

async function authorize(user = User, password = String) {
	authorize.check(arguments)
	// ...
}

authorize(new Administrator, 'password1') // Pass.
```

## "Any" is implicit.
To allow any type, don't specify a type, as in the case of the "age" parameter, below:

```js
function newUser(name=String, age, phone=String) {
	newUser.check(arguments)
	//...
} 
```

## Disjoint/Union Types
Use the bitwise single bar operator to describe union types, as in: `Number|Boolean`.

```js
function newUser(name=String, age=Number|String) {
	newUser.check(arguments)
	//...
}
```

You can use `null` as well, as in: `data=Object|null`, to permit a falsy value. It's probably best to have the calling function pass a type-consistent falsy value (*i.e.,* an empty string for `String`, or 0 for `Number`), and use `null` only as a disjunct for non-primitive values, since cannot not have falsy values.

## Duck Types
Duck types are object literals. They can be nested indefinitely, and each propery can be disjoint, generic, or a duck type itself.

```js
function newUser(conf={name:String, age:Number|String}) {
	newUser.check(arguments)
	//...
}
```

## Generics
Generic array and object types can be specified, by altering the standard angle bracket notation to use square brackets instead. An array of strings would thus be expressed: `Array[String]` instead of `Array<String>`.

```js
function newUser(name=String, friends=Array[User]) {
	newUser.check(arguments)
	//...
}
```

Generic types can be nested indefinitely and can use disjoint and duck types. For instance, here's an array of objects having a string property "name" and a number-or-string property "age":

```js
Array[{name:String, age:Number|String}]
```

## Arity is strict.
Functions containing a `.check` call will always throw when invoked with more or fewer arguments than appear in the function declaration, whether the arguments have a defined type or not.

## Default values are not supported.
Javascript's default values feature cannot be used in combination with a type checker that requires correct arity; that is, if a value isn't provided for a particular parameter, the type checker will throw, so the default value will never be usable (even though it would be syntactically valid to specify one).

The reason for requiring correct arity is simple: it prevents client code from misunderstanding the API it's using. Default values can cause confusion when refactoring, because they tend to make it appear as though client code is more in sync with the API than is actually the case.

## How it works
The first time a checked function runs, the list of types is compiled to optimized runtime type check logic, which is cached for use on all subsequent function invocations. The generated logic is assembly-like, and executes within a single closure, with no context, as a non-configurable/non-writable method. The thinking goes that the JIT compiler will translate the check logic into machine code exactly once, and then the checks run as if they were written in C.

You can use `require('function.check').compile(myFunc.toString()).code` to examine the check logic generated, cached, and used at runtime.

## Gotchas
Because javascript is bizarre about types, some decisions must be made by a type declaration mechanism: should an `Array` instance qualify as on `Object`? In javascript it does, but we all know that's a shame. Is `null` an object or a primitive? Is `NaN` a `Number`? Function.check decides in favor of common sense.

Decisions made by Function.check:

1. Declare `Number` and pass `NaN` 		-> throws
1. Declare `Object` and pass `null` 	-> throws
1. Declare `object` and pass `null`		-> pass
1. Declare `Object` and pass `Array` 	-> throws
1. Declare `object` and pass `Array`	-> pass

### `Object.create(null)` & the `object` type
Welcome to the type system house of mirrors. The `Object` constructor's `.create` method can be used to create objects that are not `Object` instances, and have no prototype. These are actually a primitive dictionary/map, but javascript's `typeof` operator doesn't recognize the difference. In many situations this is useful, but it inhibits plain reasoning about the type system.

1. Declare `Object` and pass `Object.create(null)` 	-> throws
1. Declare `object` and pass `Object` 				-> throws

So, if you don't know whether you'll be getting an Object or an object, the correct way to check it is `arg=Object|object`. That may seem silly, but it is quite correct.
