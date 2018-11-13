# hypermedia-transitions


[![npm version](https://badge.fury.io/js/hypermedia-transitions.svg)](https://badge.fury.io/js/hypermedia-transitions)     [![CircleCI](https://circleci.com/gh/Renaud8469/hypermedia-transitions.svg?style=shield)](https://circleci.com/gh/Renaud8469/hypermedia-transitions)     [![Coverage Status](https://coveralls.io/repos/github/Renaud8469/hypermedia-transitions/badge.svg)](https://coveralls.io/github/Renaud8469/hypermedia-transitions)     [![Dependency Status](https://gemnasium.com/badges/github.com/Renaud8469/hypermedia-transitions.svg)](https://gemnasium.com/github.com/Renaud8469/hypermedia-transitions)

This module is designed to help you to add hypermedia support for you API. 

## Status

**Complete**

## Getting started

1. Install the package with 
```bash
npm install --save hypermedia-transitions
```
2. Describe your transitions in a dedicated file. Short example : 
```javascript
const list_transitions = [
  {
    rel: "resource_list", 
    target: "resource list",
    accessibleFrom: [{ state: "home" }],
    href: "/resources",
    method: "get"
  },
  {
    rel: "resource", 
    target: "resource",
    accessibleFrom: [{ state: "resource list" }],
    href: "/resources/{id}",
    isUrlTemplate: true,
    method: "get"
  },
  {
    rel: "resource_delete", 
    target: "resource",
    accessibleFrom: [{ state: "resource list" }],
    href: "/resources/{id}",
    isUrlTemplate: true,
    method: "delete",
    authRequired: true
  }
]
```

More details on how to describe your transitions below. 

3. Register `hypermedia-transitions` into your API framework, as an Express middleware or as a Hapi plugin (see details below for each framework).
4. You're all set ! 

## Features 

This module consists of : 
- a fixed data structure to store your API state transitions (more details in the next section)
- parsers for many different hypermedia-compliant media types exploiting this data structure to build the response. 

## Use as Express middleware

In your Express file, you need to add a couple lines : 
- setup all your state transitions using the "addTransition" function 
- register the interceptor in your middlewares. 

All set ! If no header is specified, your API responses won't change. But if a client requires a particular format using the "Accept" header, and if you chose to support it, he will receive it in the response ! 

Example : 

```javascript

//
// state_transitions.js 
//

const list_transitions = [
  {
    rel: "resource_list", 
    target: "resource list",
    accessibleFrom: [{ state: "home" }],
    href: "/resources",
    method: "get"
  },
  {
    rel: "resource", 
    target: "resource",
    accessibleFrom: [{ state: "resource list" }],
    href: "/resources/{id}",
    isUrlTemplate: true,
    method: "get"
  },
  {
    rel: "resource_delete", 
    target: "resource",
    accessibleFrom: [{ state: "resource list" }],
    href: "/resources/{id}",
    isUrlTemplate: true,
    method: "delete",
    authRequired: true
  }
]

exports.listTr = { list_transitions }

//
// app.js
//

const express = require('express')
const transitions = require('hypermedia-transitions')
const listTr  = require('./state_transitions').listTr

var app = express()

// add the middleware that need to be set early 

transitions.addTransitionList(listTr)

app.use(transitions.halInterceptor)

// define your routes, your error handlers, and start your server. 

```

## Use as HAPI plugin

```javascript

const hypermediaOptions = {
  mediaTypes: ['hal', 'siren'],
  transitions: require('../list_transitions.json')
}

server.register([{
    register: require('../hypermedia-transitions').hapiRegister,
    options: hypermediaOptions
  }, {
// ...
}
], function (err) {
    if (err) { return console.log(err); }

    server.route(require('./routes'));

    server.start(function () {
      console.log('API up and running at:', server.info.uri);
    });
});
``` 

## Data structure 

The state transitions you define should be objects defining the following properties : 
- **rel** : the name for your transition 

> **Warning** : in some formats, the "rel" attribute becomes a Javascript object key. Hence, using characters such as "." or "-" can cause an error. 

- **target** : the target state of your transition
- **accessibleFrom** : a list of objects describing how your transition can be triggered (more details in next section)
- **href** : the URL to trigger your transition (relative from domain name)
- **isUrlTemplate** : whether the URL written in the previous field can be used "as is" or is a URL template that needs to be filled in 
- **method** : the HTTP method to trigger your transition
- **authRequired** : whether or not the client needs to be authenticated to be able to trigger that transition
- **template** : a template for what kind of data should be sent (POST or PUT methods for example) 

### Example : 

```javascript
{
  rel: "update_task",
  target: "task",
  accessibleFrom: [
    { state: "home" }, 
    { state: "task list" },
    { state: "task", fillTemplateWith: {task_id: "id"} }
  ],
  href: "/tasks/{task_id}",
  isUrlTemplate: true,
  method: "post",
  authRequired: false,
  template: {
    name: "string",
    completed: "bool",
    description: "string"
  }
}

// "id" here is a data element that is included in your API response when displaying a task resource
```

### Objects in "accessibleFrom" list

They can have the following properties:
- **state** : the state from which it can be triggered (required)
- **fillTemplateWith** : a dictionnary describing how to fill the URL template, when the transition is available from this state, using data included in your response. Must be formatted this way : 
```javascript
{ url_template_parameter: "data_corresponding_parameter" }
```
- **eachItem** : set to *true* if your data is a list of elements and the URL template must be filled with a different value for each element. Example :

```javascript
{
// ...
  accessibleFrom: [{state: "resource list", fillTemplateWith: {id: "id"}, eachItem: true}]
// ...
}

// Will result in (HAL for example) : 

[
  { 
    // ...
    _links: {
      resource: {
        href: "http://example.org/resources/1"
      }
    }
  },
  { 
    // ...
    _links: {
      resource: {
        href: "http://example.org/resources/2"
      }
    }
  }
]
  
```

- **withSelfRel** : You can specify this attribute if you want a link to be the "self" relationship, in embedded resources or not. Example : 

```javascript
{
// ...
  accessibleFrom: [{state: "list resources", fillTemplateWith: {id: "id"}, eachItem: true, withSelfRel: true}]
// ...
}

// Will result in (HAL for example) : 

[
  { 
    // ...
    _links: {
      self: {
        href: "http://example.org/resources/1"
      }
    }
  },
  { 
    // ...
    _links: {
      self: {
        href: "http://example.org/resources/2"
      }
    }
  }
]
  
```

### "state" and "target" 

The "state" property from the "accessibleFrom" objects and the "target" property from the transition work together. When a transition is triggered, your "state" become its "target", and this state is used to figure out which other transition are available. 
I advise you to write down a graph representing your API state and transitions to be sure not to have forgotten any. 
Your state names will most of the times consist in resources names. For naming consistency, *put the resource name in first position and before a space or a "_" in the "state" string* since it is used in parsing for naming lists. Example in HAL : 

```javascript
// Current state : "task_list"
// Original API data :
[ 
  //... some objects ... 
]

// Becomes in HAL : 
{ _embedded: {
  task: [
    // objects...
    ]
  }
}
```


## Authentication

To be able to display results that are only visible by authenticated users, you will have to add a req.isAuth property. If it is not set or false, the translators will consider that the user is not authenticated.
> **Warning** : for this to work you must verify if your user is authenticated for EACH request and a client that requires authentication for only some actions MUST authenticate for each request. Otherwise the transitions that are "authentication-protected" won't be visible. 

## Featured media types

- HAL (<http://stateless.co/hal_specification.html>)
- Siren (<https://github.com/kevinswiber/siren>)
- ... more to come ! Don't hesitate to submit pull requests with your own translators for other hypermedia types.

