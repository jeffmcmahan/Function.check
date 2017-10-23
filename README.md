# Function#check
A simple way of declaring and checking types at runtime in javascript.

```sh
npm install function.check
```

## Example
Include the library with `require('function.check')`, and it will define a `Function#check` method. which can then be used anywhere in your program, to check argument arity and types. Declare types using the existing javascript default value syntax, and then pass `arguments` to `<function-name>.check` as shown here:

```js
function newUser(name=String, email=String, age=Number, zipcode=Number) {
  
  newUser.check(arguments)

  // Your function body.
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

## Supports all methods and named functions.
Ordinary named functions (shown above) as well as async functions, generator functions, and async generator functions are all supported:

```js
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

Or, in a class definition, use `this.<method-name>` to check arguments: 

```js
class User {

  promote(newRole=String, promotedBy=User, ) {

    this.promote.check(arguments)

    //...
  }

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
Functions containing a `.check` call will always throw when invoked with more or fewer arguments than appear in the function declaration, whether the arguments have a defined type or not.

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

## Default values are not supported.
Javascript's default values feature cannot be used in combination with a type checker that required correct arity; that is, if a value isn't provided for a particular parameter, the type checker will throw, so the default value will never be usable (even though it would be syntactically valid to specify one).

The reason for requiring correct arity is simple: it prevents client code from misunderstanding the API it's using. Default values can cause confusion when refactoring, because they tend to make it appear as though client code is more in sync with the API than is actually the case.

To use default values in a function declaration, don't call `&lt;function-name>.check()` within the body.
