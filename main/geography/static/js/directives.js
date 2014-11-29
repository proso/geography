(function() {
  'use strict';
  /* Directives */
  angular.module('blindMaps.directives', [])

  .directive('placeLabel', ['colorScale', 'gettext', function(colorScale, gettext) {
    return {
      restrict : 'A',
      template : '<i class="flag-{{place.code}}"></i> {{place.name}}',
      link : function($scope, elem) {
        elem.addClass('label');
        elem.addClass('label-default');
        elem.tooltip({
          html : true,
          placement: 'bottom',
          container: 'body',
          title : '<div class="skill-tooltip">' +
                gettext('Odhad znalosti') + 
                ' <span class="badge badge-default">' +
                  '<i class="color-indicator" style="background-color :' +
                  colorScale($scope.place.probability).hex() + '"></i>' +
                  10 * $scope.place.probability + ' / 10 ' +
                '</span>' +
               '</div>'
        });
      }
    };
  }])

  .directive('blindMap', ['mapControler', 'places', 'singleWindowResizeFn', 
        'getMapResizeFunction', '$parse',
      function(mapControler, places, singleWindowResizeFn, 
        getMapResizeFunction, $parse) {
    return {
      restrict : 'E',
      templateUrl : 'static/tpl/map_tpl.html',
      link : function($scope, elem, attrs) {
        $scope.loading = true;
        $scope.name = places.getName($scope.part);
        $scope.practice = !attrs.showTooltips;
        var showTooltips = attrs.showTooltips !== undefined;

        var map = mapControler($scope.part, showTooltips, elem, function(m) {
          $scope.loading = false;
          var resize = getMapResizeFunction(m, elem, $scope.practice);
          singleWindowResizeFn(resize);
          resize();
          $scope.$eval(attrs.callback);
          $scope.$digest();
        });
        var model = $parse(attrs.map);
        //Set scope variable for the map
        model.assign($scope, map);
      },
      replace : true
    };
  }])

  .directive('email', function() {
    return {
      restrict : 'C',
      compile : function(elem) {
        var emailAddress = elem.html();
        emailAddress = emailAddress.replace('{zavinac}', '@');
        emailAddress = '<a href="mailto:' + emailAddress + 
  '">' + emailAddress + 
  '</a>';
        elem.html(emailAddress);
      }
    };
  })

  .directive('atooltip', function() {
    return {
      restrict : 'C',
      link : function($scope, elem, attrs) {
        elem.tooltip({ 
          'placement' : attrs.placement || 'bottom',
          'container' : attrs.container,
        });
      }
    };
  })

  .directive('dropLogin', function() {
    return {
      restrict : 'C',
      compile : function(elem) {
        elem.bind('click', function() {
          elem.tooltip('destroy');
          elem.parent().find('.tooltip').remove();
        });
      }
    };
  })

  .directive('points', ['$timeout', 'events', function($timeout, events) {
    return {
      scope : true,
      restrict : 'C',
      link : function($scope, elem) {
        events.on('userUpdated', function(user) {
          $scope.user = user;
          if (user.points == 1) {
            $timeout(function() {
              elem.tooltip('show');
            }, 0);
          }
        });
      }
    };
  }])

  .directive('dropLogin',['$timeout', 'events', function($timeout, events) {
    return {
      restrict : 'C',
      link : function($scope, elem) {
        events.on('questionSetFinished', function(answered_count) {
          if (10 < answered_count && answered_count == 20) {
            $timeout(function() {
              elem.tooltip('show');
            }, 0);
          }
        });
      }
    };
  }])

  .directive('mapProgress', ['gettext', function(gettext) {
    return {
      restrict : 'C',
      template : '<div class="progress overview-progress">' +
                    '<div class="progress-bar progress-bar-learned" style="' +
                        'width: {{100 * skills.learned / count}}%;">' +
                    '</div>' +
                    '<div class="progress-bar progress-bar-practiced" style="' +
                        'width: {{100 * skills.practiced / count}}%;">' +
                    '</div>' +
                  '</div>',
      link : function($scope, elem, attrs) {
        $scope.count = attrs.count;
        attrs.$observe('skills', function(skills) {
          if(skills !== '') {
            $scope.skills = angular.fromJson(skills);
            elem.tooltip({
              html : true,
              placement: 'bottom',
              container: 'body',
              title : '<div class="skill-tooltip">' +
                     gettext('Naučeno') + ' ' +
                     '<span class="badge badge-default">' +
                       '<i class="color-indicator learned"></i>' +
                       ($scope.skills.learned || 0) + ' / ' + $scope.count +
                     '</span>' +
                   '</div>' +
                   '<div class="skill-tooltip">' +
                     gettext('Procvičováno') + ' ' +
                     '<span class="badge badge-default">' +
                       '<i class="color-indicator practiced"></i>' +
                       ($scope.skills.practiced || 0) + ' / ' + $scope.count +
                     '</span>' +
                   '</div>'
            });
          }
        });
      }
    };
  }])

  .directive('levelProgressBar',['user', '$timeout', 'gettext',
      function(user, $timeout, gettext) {
    return {
      restrict : 'C',
      template : '<span class="badge level-start" ' +
                   'tooltip-append-to-body="true" ' +
                   'ng-bind="level.level" tooltip="' + gettext('Aktuální úroveň') + '">' +
                 '</span>' +
                 '<div class="progress level-progress" ' +
                     'tooltip-append-to-body="true" ' +
                     'tooltip="{{level.points}} / {{level.range}} ' + 
                     gettext('bodů do příští úrovně') + '">' +
                   '<div class="progress-bar progress-bar-warning" ' +
                        'style="width: {{(level.points/level.range)|percent}};">' +
                   '</div>' +
                 '</div>' +
                 '<span class="badge level-goal" ' +
                     'tooltip-append-to-body="true" ' +
                     'ng-bind="level.level+1" tooltip="' + gettext('Příští úroveň') + '">' +
                 '</span>',
      link : function($scope, elem, attrs) {
        elem.addClass('level-wrapper');
        if (attrs.username) {
          user.getPromiseByName(attrs.username).success(function(data){
            $scope.level = user.getLevelInfo(data);
          });
        } else {
          $scope.level = user.getUser().getLevelInfo();
        }
      }
    };
  }])

  .directive('myGooglePlus', ['$window', function ($window) {
    return {
      restrict: 'A',
      link: function (scope, element) {
        element.addClass('g-plus');
        scope.$watch(function () { return !!$window.gapi; },
          function (gapiIsReady) {
            if (gapiIsReady) {
              $window.gapi.plus.go(element.parent()[0]);
            }
          });
      }
    };
  }])

  .directive('myFbShare', ['$window', function ($window) {
    return {
      restrict: 'A',
      link: function (scope, element) {
        element.addClass('fb-share-button');
        scope.$watch(function () { return !!$window.FB; },
          function (fbIsReady) {
            if (fbIsReady) {
              $window.FB.XFBML.parse(element.parent()[0]);
            }
          });
      }
    };
  }])

  .directive('locationAppend', ['$rootScope', '$location', 
      function ($rootScope, $location) {
    return {
      restrict: 'A',
      link: function ($scope, element, attrs) {
        var url = attrs.href.substring(0, 3);
        $rootScope.$on("$routeChangeSuccess", function() {
          element.attr('href', url + $location.path());
        });
      }
    };
  }])

  .directive('goalProgress', ['goal', function (goal) {
    return {
      restrict: 'A',
      templateUrl : 'static/tpl/goal-progress_tpl.html',
      link: function ($scope, element, attrs) {
        if(attrs.map && attrs.placeType) {
          $scope.goal = goal.getForMap(attrs.map, attrs.placeType);
        }
      }
    };
  }])

  .directive('personalGoals', ['$modal', 'goal', function ($modal, goal) {
    return {
      restrict: 'A',
      templateUrl : 'static/tpl/personal-goals_tpl.html',
      link: function ($scope) {
        $scope.deleteGoal = goal.remove;
        
        goal.get().success(function(goals) {
          $scope.loaded = true;
          $scope.goals = goals;
        });

        $scope.addGoal = function () {
          $modal.open({
            templateUrl: 'add_goal_modal.html',
            controller: ModalAddGoalCtrl,
            resolve: {
              goals: function () {
                return $scope.goals;
              }
            }
          });
        };

        var ModalAddGoalCtrl = ['$scope', '$modalInstance', 
              '$location', 'goals', 'gettext', 'places', 'goal',
            function ($scope, $modalInstance, 
              $location, goals, gettext, places, goal) {

          $scope.goal = {
            finish_date: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 14),
          };
          $scope.minFinish = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7);
          $scope.alerts = [];
          $scope.datePopup = {};

          function filterGoals(maps, goals) {
            maps.forEach(function(map){
              var disabledCounter = 0;
              map.placesTypes.forEach(function(l) {
                goals.forEach(function(g){
                  if (l.slug == g.type.slug && map.slug == g.map.code) {
                    l.disabled = true;
                    disabledCounter++;
                  }
                });
              });
              map.disabled = disabledCounter == map.placesTypes.length;
            });
          }

          function firstGoal(maps) {
            for (var i = 0; i < maps.length; i++) {
              var map = maps[i];
              for (var j = 0; j < map.placesTypes.length; j++) {
                if (!map.placesTypes[j].disabled) {
                  return {
                    finish_date : new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 14),
                    map : map.slug,
                    layer : map.placesTypes[j].slug,
                  };
                }
              }
            }
          }

          function getMaps(mapCategories) {
            var maps = [];
            mapCategories.forEach(function(cat){
              maps = maps.concat(cat.maps);
            });
            return maps;
          }

          places.getOverview().success(function(data){
            $scope.maps = getMaps(data);
            filterGoals($scope.maps, goals);
            $scope.mapCategories = data;
            $scope.goal = firstGoal($scope.maps);
          });

          $scope.openDatePopup = function($event) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.datePopup.isOpen = true;
          };

          $scope.send = function() {
            goal.add($scope.goal).success(function(){
              $scope.alerts.push({
                type : 'success',
                msg : gettext("Cíl byl vytvořen"),
              });
              $scope.sending = false;
              $scope.cancel();
            }).error(function(){
              $scope.alerts.push({
                type : 'danger',
                msg : gettext("V aplikaci bohužel nastala chyba."),
              });
              $scope.sending = false;
            });
            $scope.sending = true;
          };

          $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
          };

          $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
          };
        }];

      }
    };
  }])

  .directive('trackClick', ['$analytics', function ($analytics) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.click(function(){
          $analytics.eventTrack('click', {
            category: attrs.trackClick,
            label: attrs.href,
          });
        });
      }
    };
  }]);
}());
