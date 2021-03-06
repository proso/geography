/* Filters */
angular.module('proso.geography.filters', [])

  .filter('percent', function() {
    return function(n) {
      n = n || 0;
      return Math.round(100 * n) + '%';
    };
  })

  .filter('StatesFromPlaces', function() {
    return function(data) {
      var places = {};
      if (data && data[0]) {
        angular.forEach(data, function(category) {
          if (!category.haveMaps && category.places) {
            angular.forEach(category.places, function(place) {
              places[place.description] = place;
            });
          }
        });
      }
      return places;
    };
  })

  .filter('colNum', function() {
    return function(colsCount) {
      return Math.floor(12 / colsCount);
    };
  })

  .filter('isActive',['$location', function($location) {
    return function(path) {
      if ($location.path() == path) {
        return 'active';
      } else {
        return '';
      }
    };
  }])

  .filter('isFindOnMapType', function() {
    return function(question) {
      return question && question.question_type == "t2d";
    };
  })

  .filter('isPickNameOfType', function() {
    return function(question) {
      return question && question.question_type == "d2t";
    };
  })

  .filter('isAllowedOption', function() {
    return function(question, code) {
      return !question.options ||
        0 === question.options.length || 
        1 === question.options.filter(function(option) {
          return option.description == code;
        }).length;
    };
  })

  .filter('questionText', ['gettextCatalog', function(gettextCatalog) {
    return function(question) {
      if (question && question.question_type == "t2d") {
        return gettextCatalog.getString("Vyber na mapě");
      } else if (question && question.question_type == "d2t") {
        return gettextCatalog.getString("Co je zvýrazněno?");
      }
      return "Error: unknown question type: " + (question && question.question_type);
    };
  }])

  .filter('isTypeCategory', function() {
    return function(types, category) {
      types = types && types.filter(function(t){
        return category.types.filter(function(slug){
          return slug == t.identifier;
        }).length == 1;
      });
      return types;
    };
  })

  .filter('codeToTerm',['flashcardService', 'gettextCatalog',
      function(flashcardService, gettextCatalog) {
    return function(code) {
      var fc = flashcardService.getFlashcardByDescription(code);
      return fc ? fc.term : {
        name: gettextCatalog.getString("Neznámý"),
      };
    };
  }])

  .filter('probColor', ['colorScale', function(colorScale) {
    return function(probability) {
      return colorScale(probability).hex();
    };
  }])

  .filter('sumCounts', [ function() {
    return function(layers) {
      if (!layers || layers.length === 0) {
        return 0;
      }
      var sum = layers.map(function(p){
        return p.count;
      }).reduce(function(a, b) {
        return a + b;
      });
      return sum;
    };
  }])

  .filter('stripedStyle', [function () {
    return function (goal, isLearnedBar) {
      var barWidth =  isLearnedBar ? goal.progress : goal.progress_diff;
      var deg = isLearnedBar ? "90" : "270";
      var noOfDays = (new Date(goal.finish_date) - new Date(goal.start_date)) /
        (24 * 60 * 60 * 1000);
      var dayWidth = 1 / noOfDays;
      var relDayWidth = dayWidth / barWidth;
      var dayPercent = relDayWidth * 100 + '%';
      var startPercent = (relDayWidth * 100) - (0.5 / barWidth) + '%';
      var style = {
        "background-image" :
        "repeating-linear-gradient( " + deg + "deg, transparent, transparent " +
          startPercent + ", rgba(0,0,0,0.2) " + startPercent + ", rgba(0,0,0,0.2) " + dayPercent + ")"
      };
      return style;
    };
  }])

  .filter('cookieExists', ["$cookies", function ($cookies) {
      return function(name) {
        return $cookies[name];
      };
  }]);
