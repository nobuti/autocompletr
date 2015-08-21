;(function(w, d, undefined) {
  'use strict';

  var Autocompletr = function(target, options) {

    var _self = this;
    var opts = options || {};

    _self.target = target;
    _self.visible = false;
    _self.options = {
      removeFirstOptionFromSearch: opts.removeFirstOptionFromSearch || true,
      useFirstOptionTextAsPlaceholder: opts.useFirstOptionTextAsPlaceholder || true,
      placeholderText: opts.placeholderText || null,
      noResultsMessage: opts.noResultsMessage || 'No results found.',
      fitList: opts.fitList || false,
      // Callback for instantiation.
      onload: opts.onload || function() {},
      // Callback for item selected
      onchange: opts.onchange || function() {}
    };

    var classNames = {
      dropdownList: 'Autocompletr-list',
      textInput: 'Autocompletr-textInput',
      listItem: 'Autocompletr-listItem',
      textInputWithList: 'Autocompletr-textInput--expanded',
      hidden: 'Autocompletr-hidden',
      visible: 'Autocompletr-visible',
      activeItem: 'Autocompletr-activeItem',
      noResults: 'Autocompletr-noResults',
      match: 'Autocompletr-match'
    };

    var KEYCODES = {
      ENTER: 13,
      ESC: 27,
      UP: 38,
      DOWN: 40
    };

    var ERRORS = {
      OPTION_MISSING: 'Missing option elements.',
      SELECT_MISSING: 'Missing select element.'
    };

    // DOM utilities
    var utils = {
      addEventListener: function(el, eventName, handler) {
        if (el.addEventListener) {
          el.addEventListener(eventName, handler);
        } else {
          el.attachEvent('on' + eventName, handler);
        }
      },

      addClass: function(el, className) {
        if (el.classList) {
          el.classList.add(className);
        } else {
          el.className += ' ' + className;
        }
      },

      hasClass: function(el, className) {
        var result;
        if (el.classList) {
          result = el.classList.contains(className);
        } else {
          result = new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
        }
        return result;
      },

      removeClass: function(el, className) {
        if (el.classList) {
          el.classList.remove(className);
        } else {
          var regex = new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi');
          el.className = el.className.replace(regex, ' ');
        }
      },

      getTextNode: function(node) {
        return (node && (node.innerText || node.textContent || node.innerHTML));
      },

      escapeString: function(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      },

      throttle: function (fn, wait) {
        var context, args, result,
            timeout = null,
            previous = 0;

        var later = function () {
          previous = new Date().getTime();
          timeout = null;
          result = fn.apply(context, args);
          context = null;
          args = null;
        };
        
        return function() {
          var now = new Date().getTime();
          var remaining = wait - (now - previous);
          context = this;
          args = arguments;
          
          if (remaining <= 0) {
            clearTimeout(timeout);
            timeout = null;
            previous = now;
            result = fn.apply(context, args);
            context = args = null;
          } else if (!timeout) {
            timeout = setTimeout(later, remaining);
          }
          
          return result;
        };
      }
    };

    var highlightMatches = function(query, matches) {
      query = utils.escapeString(query);
      var highlightRegex = new RegExp('(<li[^>]*>[^<]*)(' + query + ')([^<]*<\/li>)', 'gi');
      var formattedMatch = '$1<em class="' + classNames.match + '">$2</em>$3';
      return matches.replace(highlightRegex, formattedMatch);
    };

    var createTextInput = function() {
      var input = d.createElement('input'),
          firstOptionText;

      // Match the width with the base field
      input.style.width = _self.width + 'px';

      input.setAttribute('class', classNames.textInput);
      input.setAttribute('autocapitalize', 'off');
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('autocorrect', 'off');
      input.setAttribute('spellcheck', 'false');

      input.setAttribute('tabindex', _self.target.tabIndex);
      _self.target.setAttribute('tabindex', '-1');

      if (_self.options.placeholderText) {
        input.setAttribute('placeholder', _self.options.placeholderText);
      } else if (_self.options.useFirstOptionTextAsPlaceholder) {
        try {
          firstOptionText = utils.getTextNode(_self.target.options[0]);
          input.setAttribute('placeholder', firstOptionText);
        } catch (e) {
          console.error(ERRORS.OPTION_MISSING);
        }
      }

      _self.target.insertAdjacentHTML('afterend', input.outerHTML);
      return _self.target.nextElementSibling;
    };

    var initialSelection = function() {
      var option = _self.target.querySelector('[selected]');

      if (option) {
        _self.selectItem(option);
      }

      return option;
    };

    var createItemsFromBaseField = function() {
      var items, regex, li;

      // Removes the first option if needed (DOM is faster than regex in this case)
      if (_self.options.removeFirstOptionFromSearch) {
        try {
          _self.target.removeChild(_self.target.options[0]);
        } catch (e) {
          console.error(ERRORS.OPTION_MISSING);
        }
      }

      // Clean up comments and whitespace
      items = _self.target.innerHTML.replace(/<!--([^\[|(<!)].*)/g, '')
        .replace(/\s{2,}/g, '')
        .replace(/(\r?\n)/g, '');

      // Transforms all the <option> elements in <li> elements.
      // The data-value attribute carries the original <option> value.
      regex = /<option(?:[^>]*?value="([^"]*?)"|)[^>](?:[^>]*?data-value="([^"]*?)"|)[^>]*?>(.*?)<\/option>\n?/gi;
      li = '<li class="' + classNames.listItem + '" data-value="$1" data-label="$2">$3</li>';
      items = items.replace(regex, li);

      return items;
    };

    var getTextFieldValue = function(item) {
      var value = "";
      if (item.getAttribute('data-label')) {
        value = item.getAttribute('data-label');
      } else {
        value = item.getAttribute('data-value') ? item.getAttribute('data-value') : utils.getTextNode(item);
      }
      return value;
    }

    var createEmptyList = function() {
      var list = d.createElement('ul');
      list.setAttribute('class', classNames.dropdownList);
      _self.textInput.insertAdjacentHTML('afterend', list.outerHTML);
      return _self.textInput.nextElementSibling;
    };

    var populateListWithItems = function(data) {
      _self.list.innerHTML = data;
      _self.currentItemsDOM = _self.list.childNodes;
    };

    var noResultsFound = function() {
      var template = '<li class="0">1</li>',
          item = template.replace('0', classNames.noResults)
                    .replace('1', _self.options.noResultsMessage);
      populateListWithItems(item);
    };

    var keyboardNavigate = function(keyPressed) {
      var items, activeItem, itemToActivate;

      items = _self.currentItemsDOM;

      // No need to navigate if there's only one item in the list
      if (items.length <= 1) {
        return;
      }

      // Stores the currently active item
      activeItem = _self.getActiveListItem();

      // Prevent looping from first to last / last to first
      if (keyPressed === KEYCODES.UP) {
        // Actives the previous item only if it's not the first item of the list
        if (activeItem.previousElementSibling) {
          itemToActivate = activeItem.previousElementSibling;
        }
      } else {
        // Don't activate the next item if it's the last one
        if (activeItem.nextElementSibling) {
          itemToActivate = activeItem.nextElementSibling;
        }
      }

      if (itemToActivate) {
        utils.removeClass(activeItem, classNames.activeItem);
        utils.addClass(itemToActivate, classNames.activeItem);
        _self.scrollListItemIntoView(itemToActivate);
      }
    };

    var keyUpHandler = function(e) {
      e = e || w.event;

      var keyPressed = e.keyCode || e.which,
          activeItem, matches, 
          isNavigationKey = false;

      for (var key in KEYCODES) {
        if (keyPressed === KEYCODES[key]) {
          isNavigationKey = true;
          break;
        }
      }

      // Any key, except navigation keys
      if (!isNavigationKey) {
        _self.list.scrollTop = 0;
        // this is the text field
        _self.open(this.value);
        return;
      }

      if (keyPressed === KEYCODES.ENTER) {

        if (_self.visible) {
          activeItem = _self.getActiveListItem();
          if (activeItem && !utils.hasClass(activeItem, classNames.noResults)) {
            _self.selectItem(activeItem);
          }
        } else {
          _self.open();
        }

        return;
      }

      if (keyPressed === KEYCODES.ESC) {
        _self.hideList();
        return;
      }
    };

    var keyDownHanlder = function(e) {
      e = e || w.event;
      var keyPressed = e.keyCode || e.which;

      if (keyPressed === KEYCODES.UP || keyPressed === KEYCODES.DOWN) {
        // Navigate only if there are results
        if (_self.currentItemsDOM) {
          if (!_self.visible) {
            _self.open();
          }
          keyboardNavigate(keyPressed);
        }
      }
    };

    var focusHandler = function(e) {
      _self.open();
    };

    var blurHandler = function(e) {
      if (!_self.preventBlurTrigger && _self.getActiveListItem()) {
        _self.selectItem(_self.getActiveListItem());
      }
    };

    var mouseDownHandler = function(e) {
      var item, activeItem;

      _self.preventBlurTrigger = true;
      w.setTimeout(function() {
        _self.preventBlurTrigger = false;
      }, 1);

      item = e.target.className === classNames.match ? e.target.parentNode : e.target;

      if (item !== _self.list) {
        activeItem = _self.getActiveListItem();
        if (activeItem  && !utils.hasClass(activeItem, classNames.noResults)) {
          _self.selectItem(activeItem);
        }
      }
    };

    var mouseOverHandler = function(e) {
      var target = e.target;
      if (target.tagName.toUpperCase() !== 'LI') {
        return;
      }

      _self.toggleActiveItem();
      utils.addClass(target, classNames.activeItem);
    }

    var resizeHandler = function(e) {
      _self.repositionList();
    }

    var setupEvents = function() {
      utils.addEventListener(_self.textInput, 'keyup', keyUpHandler);
      utils.addEventListener(_self.textInput, 'keydown', keyDownHanlder);
      utils.addEventListener(_self.textInput, 'focus', focusHandler);
      utils.addEventListener(_self.textInput, 'blur', blurHandler);
      utils.addEventListener(_self.list, 'mousedown', mouseDownHandler);
      utils.addEventListener(_self.list, 'mouseover', mouseOverHandler);
      utils.addEventListener(w, 'resize', utils.throttle(resizeHandler, 50));
    };

    _self.init = function() {

      if (target.getAttribute('data-autocompletr-instantiated')) {
        return;
      }

      if (target.tagName.toUpperCase() !== 'SELECT') {
        console.error(ERRORS.SELECT_MISSING);
      }

      target.setAttribute('data-autocompletr-instantiated', 'true');
      _self.width = _self.target.offsetWidth;

      utils.addClass(_self.target, classNames.hidden);

      _self.textInput = createTextInput();
      _self.list = createEmptyList();
      _self.itemsHTML = createItemsFromBaseField();

      // Fills the list element with the items
      populateListWithItems(_self.itemsHTML);

      // DOM representation of the items, useful for programatic selection
      _self.items = _self.list.childNodes;

      setupEvents();
      initialSelection();

      _self.options.onload.call(_self);

      return _self;
    };

    _self.open = function(value) {

      var val = value,
          matches;

      // To avoid falsy emtpy string value
      if (val == null) {
        val = _self.value || "";
      }

      matches = _self.search(val);

      if (matches.length < 1) {
        noResultsFound();
        _self.currentItemsDOM = null;
      }

      _self.showList();
    };

    _self.showList = function() {
      _self.visible = true;
      utils.addClass(_self.list, classNames.visible);
      _self.repositionList();
      utils.addClass(_self.textInput, classNames.textInputWithList);

      // Sets the first item as active, so we can start our navigation from there
      if (_self.list.firstChild.className !== classNames.noResults) {
        utils.addClass(_self.list.firstChild, classNames.activeItem);
      }
    };

    _self.hideList = function() {
      _self.visible = false;
      utils.removeClass(_self.list, classNames.visible);
      utils.removeClass(_self.textInput, classNames.textInputWithList);
    };

    _self.selectItem = function(item) {
      var selectedText, val;

      selectedText = getTextFieldValue(item);
      _self.textInput.value = selectedText;
      _self.hideList();
      val = item.getAttribute('data-value') ? item.getAttribute('data-value') : item.value;
      _self.target.value = val;
      _self.value = val;

      // onchange user callback
      _self.options.onchange.call(_self);
    };

    _self.repositionList = function() {
      var aboveInputOffset = _self.textInput.offsetTop,
          belowInputOffset = Math.floor((_self.textInput.offsetTop + parseInt(_self.textInput.offsetHeight, 10))),
          viewportHeight = w.innerHeight || d.documentElement.clientHeight,
          topPosition = 0;

      if ((belowInputOffset + _self.list.offsetHeight) > viewportHeight) {
        // Show above
        topPosition = aboveInputOffset - _self.list.offsetHeight;
      } else {
        // Show below
        topPosition = belowInputOffset;
      }

      // Reposition the list accordingly
      _self.list.style.top = topPosition + 'px';
      _self.list.style.left = _self.textInput.offsetLeft + 'px';

      if (_self.options.fitList) {
        _self.list.style.width = _self.textInput.offsetWidth + 'px';
      }
    };

    _self.search = function(query) {
      var matchingRegex = '',
          matches;

      if (query !== '') {
        query = utils.escapeString(query);
        matchingRegex = new RegExp('<li[^>]*>[^<]*' + query + '[^<]*<\/li>', 'gi');
      } else {
        matchingRegex = /<li[^<]*<\/li>/gi;
      }

      matches = _self.itemsHTML.match(matchingRegex) || [];

      if (matches.length) {
        matches = matches.join('');
        if (query) {
          matches = highlightMatches(query, matches);
        }

        populateListWithItems(matches);
        utils.addClass(_self.list.firstChild, classNames.activeItem);
      }

      return matches;
    };

    _self.getActiveListItem = function() {
      return _self.list.querySelector('.' + classNames.activeItem);
    };

    _self.toggleActiveItem = function() {
      var node = _self.list.querySelector('.' + classNames.activeItem);
      node && utils.removeClass(node, classNames.activeItem);
    };

    _self.scrollListItemIntoView = function(item) {
      var itemTop = item.offsetTop,
          itemHeight = item.offsetHeight,
          listHeight = _self.list.offsetHeight,
          listScroll = _self.list.scrollTop,
          itemIsBeforeScrollArea, itemIsAfterScrollArea;

      // Check if the item is BEFORE the list scroll area (visible elements)
      itemIsBeforeScrollArea = itemTop <= listScroll;

      // Check if the item is AFTER the list scroll area (visible elements)
      itemIsAfterScrollArea = itemTop >= ((listScroll + listHeight) - itemHeight);

      if (itemIsBeforeScrollArea) {
        _self.list.scrollTop = itemTop;
      } else if (itemIsAfterScrollArea) {
        _self.list.scrollTop = (itemTop - listHeight) + itemHeight;
      }
    };
  };

  w.Autocompletr = Autocompletr;

  ;(function() {
    var lazyLoadBaseFields = d.querySelectorAll('[data-autocompletr]');
    [].forEach.call(lazyLoadBaseFields, function(target) {
      new w.Autocompletr(target).init();
    });
  })();

})(window, document);