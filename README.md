# Function#check
A simple way of declaring and checking types at runtime in javascript.

## Example
Include the library with `require('function.check')`, and it will define a `Function#check` method. which can then be used anywhere in your program, to argument check types, like this:

```js
function newUser(name=String, email=String, age=Number, zipcode=Number) {
  newUser.check(arguments)
  // ...
}
```

When they occur, type check failures are clearly indicated:

```
TypeError: newUser(name=String, email=String, age=Number, zipcode=Number)

   name was not of type Function. Boolean provided.

   email was not of type String. Function provided.

   zipcode was not provided.

    at newUser (.../index.js:46:14)
    at Object.<anonymous> (.../index.js:85:1)
    at Module._compile (module.js:624:30)
    at Object.Module._extensions..js (module.js:635:10)
    at Module.load (module.js:545:32)
    at tryModuleLoad (module.js:508:12)
    at Function.Module._load (module.js:500:3)
    at Function.Module.runMain (module.js:665:10)
```

## Supports all named functions.
Ordinary named functions (shown above) as well as async functions, generator functions, and async generator functions are all supported:

```js
async function newUser(a=String, b=Object) {
  newUser.check(arguments)
  //...
}

function* newUser(a=String, b=Object) {
  newUser.check(arguments)
  //...
}

async function* newUser(a=String, b=Object) {
  newUser.check(arguments)
  //...
}
```

## Type Support
All types are supported automatically.

```js
class User extends Object {
  // ...
}

class Administrator extends User {
  //...
}

async function authorize(user=User, password=String) {
  authorize.check(arguments)
  // ...
}

const jill = new Administrator
authorize(jill, req.body.password) // -> Type check passes.
```

## The "Any" type is implicit.
To allow any type, don't specify a type, as in the case of the "age" parameter, below:

```js
function newUser(name=String, age, phone=String) {
  newUser.check(arguments)
  //...
} 
```

## Arity is strict.
Functions containing a `.check` call will always throw when invoked with more or fewer arguments than appear in the function declaration.

```js
function newUser() {
  newUser.check(arguments)
  //...
}

newUser('Bill') // throws

function newUser(name=String, age) {
  newUser.check(arguments)
  //...
}

newUser('Bill') // throws
```
