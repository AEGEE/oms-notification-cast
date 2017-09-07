(() => {
  'use strict';
  const baseUrl = baseUrlRepository['oms-notification-cast'];
  const apiUrl = `${baseUrl}api/`;

  const showError = (err) => {
    console.log(err);
    let message = 'Unknown cause';

    if (err && err.message) {
      message = err.message;
    } else if (err && err.data && err.data.message) {
      message = err.data.message;
    }

    $.gritter.add({
      title: 'Error',
      text: `Could not process action: ${message}`,
      sticky: false,
      time: 8000,
      class_name: 'my-sticky-class',
    });
  };

  /** @ngInject */
  function config($stateProvider) {
    // State
    $stateProvider
      .state('app.notification_cast', {
        url: '/notification_cast',
        data: { pageTitle: 'Cast a notification' },
        views: {
          'pageContent@app': {
            templateUrl: `${baseUrl}cast/cast.html`,
            controller: 'NotificationCastController as vm',
          },
        },
      });
  }

  function NotificationCastController($http, $scope) {
    var vm = this;
    vm.cast = {
      audience_params_unprocessed: [],
      service: "manual-notification"
    }

    vm.resetAudience = () => {
      $scope.$broadcast('angucomplete-alt:clearInput', 'audienceAutocomplete');
      vm.cast.audience_params_unprocessed=[];
    }

    vm.addToAudience = (item) => {
      vm.cast.audience_params_unprocessed.push(item.originalObject);
      $scope.$broadcast('angucomplete-alt:clearInput', 'audienceAutocomplete');
    }

    vm.fetchAudience = (query, timeout) => {
      // Copied from the angular tutorial on how to add transformations
      function appendTransform(defaults, transform) {
        // We can't guarantee that the default transformation is an array
        defaults = angular.isArray(defaults) ? defaults : [defaults];

        // Append the new transformation to the defaults
        return defaults.concat(transform);
      }

      var url;
      switch (vm.cast.audience_type) {
        case 'user':
          url = '/api/users';
          break;
        case 'circle':
          url = '/api/circles';
          break;
        case 'body':
          url = '/api/bodies';
          break;
      }

      return $http({
        url: url,
        method: 'GET',
        params: {
          limit: 8,
          name: query
        },
        transformResponse: appendTransform($http.defaults.transformResponse, function (res) {
          if(res && res.data) {
            if(vm.cast.audience_type == 'user') {
              return res.data.map((user) => {
                user.name = user.first_name + ' ' + user.last_name;
                user.description = '';
                return user;
              })
            }
            return res.data;
          }
          else
            return [];
        }),
        timeout: timeout,
      });
    }


    vm.submitForm = () => {
      if(confirm("Do you really want to cast this notification")) {
        vm.cast.audience_params = vm.cast.audience_params_unprocessed.map((item) => {return '' + item.id});
        vm.cast.time = (new Date()).toISOString();
        $http({
          url: apiUrl + 'cast',
          method: 'POST',
          data: vm.cast
        }).then((res) => {
          showSuccess("Notification cast successfully");
        }).catch((err) => {
          showError(err);
        });
      }
    }
  }

  angular
    .module('app.notification_cast', [])
    .config(config)
    .controller('NotificationCastController', NotificationCastController);
})();

