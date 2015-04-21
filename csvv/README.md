# Webshop

##### v1.0.0

Description to go here

### Initialize

```js
csvValidation(target, options, callback, debugMode);
```

**target** - [string] - selector where you want csvValidation to be run (usually an id or class)

**options** - [array] - options used by csvValidation (see below)

**callback** - [function] - callback function to run when csvValidation has finished

**debugMode** - [boolean] - used to turn debug mode on 

### Options

###### Key

[type] = variable type
{default} = variable default
(possibilities) = variable possibilities

**options** - [array] - options used by csvValidation

###### Header options

**options.columns** - [array] - list of headers objects

**options.columns.[]** - [object] - header object

**options.columns.[].name** - [string] - header name

**options.columns.[].keywords** - [string] - comma seperated list of keywords used for automatic header matching

**options.columns.[].required** - [boolean] {false} - if the column is required to be filled out

**options.columns.[].type** - [string] {'text'} ('text', 'email', 'number', 'date') - type of column content

**options.columns.[].minLength** - [integer] {0} - min length of column content

###### Other options

**options.classes.** - [object] - object of classes for csvValidation to add to components

**options.classes.btn.** - [string] - class to use on buttons

**options.classes.notify.** - [string] - class to use on alerts

**options.classes.confirm.** - [string] - class to use on confirmation dialogs

**options.classes.input.** - [string] - class to use on inputs

**options.dateFormat** - [string] {'dd/mm/yyyy'} ('dd/mm/yyyy', 'dd-mm-yyyy', 'mm/dd/yyyy', 'mm-dd-yyyy', 'yyyy/mm/dd', 'yyyy-mm-dd') - date format to use on date columns

###### Example

```
var options = {
    columns: [
        {
            name: 'Name',
            required: true,
            type: 'date'
        },
        {
            name: 'Email',
            required: true,
            type: 'email',
            keywords: 'email address'
        },
        {
            name: 'ID'
            type: 'number',
            minLength: 4,
            keywords: 'id number'
        }
    ],
    classes: {
        btn: 'btn btn-default',
        notify: 'alert',
        confirm: 'confirm',
        input: 'form-control'
    },
    dateFormat: 'dd/mm/yyyy'
};
```

### Callback

The first argument of the callback will be an object than contains the final data as an object, an array, and a csv.

```
function callback(data) {
    console.log(data.object);
    console.log(data.array);
    console.log(data.csv);
}
```


