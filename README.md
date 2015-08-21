# Autocompletr

**autocompltr** is a simple autocomplete that does one job well.

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

<!-- No additional JS needed - just load the lib and you're set -->
<script src="autocompletr.min.js"></script>
```

### Manual instance + custom options
```html
<!-- No data-autocompltr -->
<select id="guitars">
  <!-- We are gonna provide a placeholder with the options -->
  <option value="1">Javascript</option>
  <option value="2">PHP</option>
  <option value="3">Ruby</option>
</select>

<!-- No additional JS needed - just load the lib and you're set -->
<script src="autocompletr.min.js"></script>

<script>
    var select = document.querySelector('#guitars');

    var barq = new Autocompletr(select, {
        enablePagination: false,
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
