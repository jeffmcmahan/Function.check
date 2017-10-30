# Function#check
A simple and performant way of declaring and checking types at runtime in javascript.

```sh
npm install function.check
```

## Example
Include the library with `require('function.check')`, and it will define a `Function#check` method, which can be used to check argument arity and types. Declare types using the existing javascript default value syntax, and then pass `arguments` to `<function-name>.check` as shown here:

```js
function newUser(name = String, email = String, age = Number) {
	
	newUser.check(arguments)
	
	// Do stuff.
}
```

When they occur, type check failures are clearly indicated:

```
TypeError: newUser(name = String, email = String, age = Number)

   name was not of type String. Boolean provided: false

   email was not of type String. Function provided: function find(query=String) ...

   age was not provided.

     at newUser (.../index.js:46:14)
     at Object.<anonymous> (.../index.js:85:1)
     at Module._compile (module.js:624:30)
     at Object.Module._extensions..js (module.js:635:10)
     at Module.load (module.js:545:32)
     at tryModuleLoad (module.js:508:12)
     at Function.Module._load (module.js:500:3)
     at Function.Module.runMain (module.js:665:10)
```

## How it works
The first time a type checked function runs, the `.check(arguments)` call compiles the list of types to a set of functions which efficiently check the types of the arguments passed. On each subsequent function call, the compiled set of functions is invoked against the given arguments. For a simple case, like `str = String` the check logic is simply:

```js
val => typeof val === 'string'
```

Whereas more complex union, generic, and duck types require more complex sets of checks that are, correspondingly, more work to execute.

The type declaration syntax is valid javascript. In standard javascript expressions like `Array[String]` are nonsense amounting to `undefined`, but these are assigned different syntax and semantics within Function#check.

## Supports all methods and named functions.
Ordinary named functions as well as async functions, generator functions, and async generator functions are all supported:

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

Or, within a class definition (ES5 or ES6-style), use `this.<method-name>` to check arguments: 

```js
class User {

	promote(newRole=String, promotedBy=User) {
		this.promote.check(arguments)
		//...
	}

}
```

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

To use default values in a function declaration, don't call `<function-name>.check()` within the body.
