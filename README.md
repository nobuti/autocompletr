# Autocompletr

**autocompltr** is a simple autocomplete that does one job well. 
It's slim, 2.6kb gzip and it has a fully customizable look and feel.

## Usage

### Lazy instance with default options

```html
<!-- The data-autocompltr attribute triggers the instantiation -->
<select data-autocompltr>
  <option>Select a language</option>
  <option value="1">Javascript</option>
  <option value="2">PHP</option>
  <option value="3">Ruby</option>
</select>

<!-- Load the lib  -->
<script src="autocompletr.min.js"></script>
```

### Or you can use the manual instance + options

```html
<!-- No data-autocompltr -->
<select id="languages">
  <!-- We are gonna provide a placeholder with the options -->
  <option value="1">Javascript</option>
  <option value="2">PHP</option>
  <option value="3">Ruby</option>
</select>

<!-- Load the library -->
<script src="autocompletr.min.js"></script>

<script>
  var select = document.querySelector('#languages');

  var autocompletr = new Autocompletr(select, {
      enablePagination: false,
      fitList: false,
      removeFirstOptionFromSearch: false,
      useFirstOptionTextAsPlaceholder: false,
      placeholderText: 'Select a programming language',
      noResultsMessage: 'No results, pal :(',
      onchange: function() {
          alert('You selected the ' + this.text + ' model.');
      }
  }).init();
</script>
```

### License

Released under the MIT License, Copyright (c) 2015 Buti.
