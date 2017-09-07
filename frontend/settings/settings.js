(() => {
  'use strict';
  const baseUrl = baseUrlRepository['oms-notification-cast'];
  const apiUrl = `${baseUrl}api`;

  /** @ngInject */
  function config($stateProvider) {
    // State
    $stateProvider
      .state('app.notification_settings', {
        url: '/notification_settings',
        data: { pageTitle: 'Notification Settings' },
        views: {
          'pageContent@app': {
            templateUrl: `${baseUrl}settings/settings.html`,
            controller: 'NotificationSettingController as vm',
          },
        },
      });
  }

  function NotificationSettingController($http) {
    var vm = this;

    $http({
      url: apiUrl + "/test",
      method: "GET"
    }).then((response) => {
      console.log(response.data);
      vm.message = response.data.data;
    }).catch((error) => {showError(error);})
  }

  angular
    .module('app.notification_settings', [])
    .config(config)
    .controller('NotificationSettingController', NotificationSettingController);
})();

