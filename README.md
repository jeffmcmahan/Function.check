# Function#check

![travis status](https://travis-ci.org/jeffmcmahan/Function.check.svg?branch=master)

Declare types in javascript without a transpile step.

## Install
```sh
npm install function.check
```

Include at the top of your program:

```js
require('function.check')
```

## Example
Declare argument types using ES6 default value syntax and pass `arguments` to `<function-name>.check` as shown:

```js
function newUser(name = String, email = String, age = Number) {
    newUser.check(arguments)
    
    // Do stuff.
}
```

Failures are clearly indicated:

```
TypeError: 

newUser(name = String, email = String, age = Number) {...

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
primitives 		x 224,658,906 ops/sec 	±0.56% 	(92 runs sampled)
arrays 			x 130,952,997 ops/sec 	±0.67% 	(90 runs sampled)
objects 		x 125,843,530 ops/sec 	±0.75% 	(86 runs sampled)
unions 			x 107,427,725 ops/sec 	±0.75% 	(93 runs sampled)
duck types 		x  91,229,897 ops/sec 	±0.71% 	(89 runs sampled)
custom classes 	x  34,945,957 ops/sec 	±0.70% 	(91 runs sampled)
generics 		x   8,502,684 ops/sec 	±0.73% 	(93 runs sampled)

Mid-2014 15" MacBook Pro
Node.js 10.3.0
```

## Supports named and anonymous functions.
Ordinary functions and methods as well as async functions, generator functions, and async generator functions are all supported:

```js
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

Constructors are supported, too:
```js
class User {
    constructor(name=String, email=String, zipcode=Number) {
        User.check(arguments)

        //...
    }
}
```

Arrow functions are not supported because they do not bind an `arguments` object.

## Type Support
All types available to your function declaration are supported automatically, with sole exception of `undefined` (which is always invalid).

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

You can use `null` as well, as in: `data=Object|null`.

## Duck Types
Duck types are object literals. They can be nested indefinitely, and each propery can be disjoint, generic, or a duck type itself.

```js
function newUser(conf={name:String, age:Number|String}) {
    newUser.check(arguments)

    //...
}
```

## Generics
Generic array, object, and promise types can be specified, by altering the standard angle bracket notation to use square brackets instead. An array of strings would thus be expressed: `Array[String]` instead of `Array<String>`.

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

Promise generics indicate the type of value resolved, as follows:

```js
Promise[String]
```

If a promise is passed which resolves the number 5 instead of a string, for example, the following error message will appear:

```
TypeError:

foo(bar=Promise[String]) { ...

    - bar was not of type Promise[String]. The promise resolved Number: 5

    at process._tickCallback (internal/process/next_tick.js:68:7)
    at Function.Module.runMain (internal/modules/cjs/loader.js:746:11)
    at startup (internal/bootstrap/node.js:238:19)
    ...
```

## Arity is strict.
Functions containing a `.check` call will always throw when invoked with more or fewer arguments than appear in the function declaration, whether the arguments have a defined type or not.

## Default values are not supported.
Javascript's default values feature cannot be used in combination with a type checker that requires correct arity; that is, if a value isn't provided for a particular parameter, the type checker will throw, so the default value will never be usable (even though it would be syntactically valid to specify one).

The reason for requiring correct arity is simple: it prevents client code from misunderstanding the API it's using. Default values can cause confusion when refactoring, because they tend to make it appear as though client code is more in sync with the API than is actually the case.

## How it works
The first time a checked function runs, the list of types is compiled to optimized runtime type check logic, which is cached for use on all subsequent function invocations. The generated logic is low-level, and executes within a single closure as a non-configurable/non-writable method.

Use `require('function.check').compile(myFunc.toString()).code` to examine the check logic. The following type declarations generate the code shown below:

```js
function foo(name=String, age=Number, data=Object|null) {...
```

Generated type check code (beautified):

```js
// __args is an alias for arguments
var v, e = 0, err = this.check.e;
if (__args.length !== 3) err(__args);
v = __args[0];
if (typeof v !== "string") e++;
if (e) err(__args);
v = __args[1];
if (typeof v !== "number" || v + "" === "NaN") e++;
if (e) err(__args);
v = __args[2];
if (Array.isArray(v) || !(v instanceof Object)) e++;
if (v !== null) e++;
if (e < 2) e = 0;
if (e) err(__args);
```