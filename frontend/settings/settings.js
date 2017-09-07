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

    vm.loadCategories = () => {
      $http({
        url: apiUrl + "/categories",
        method: "GET"
      }).then((response) => {
        console.log(response.data);
        vm.categories = response.data.data;
      }).catch((error) => {showError(error);})
    }

    vm.loadServices = () => {
      $http({
        url: apiUrl + "/services",
        method: "GET"
      }).then((response) => {
        console.log(response.data);
        vm.services = response.data.data;
      }).catch((error) => {showError(error);})
    }

    vm.saveCategory = (category) => {
      $http({
        url: apiUrl + "/categories/" + category.code,
        method: 'PUT',
        data: category
      }).then((response) => {
        showSuccess("Changes saved successfully");
      }).catch((error) => {
        showError(error);
      });
    }

    vm.loadServices();
    vm.loadCategories();
  }

  angular
    .module('app.notification_settings', [])
    .config(config)
    .controller('NotificationSettingController', NotificationSettingController);
})();

