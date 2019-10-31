(
  function () {
    angular
      .module("multiSigWeb")
      .controller("payoutBountyCtrl", function ($scope, Wallet, Token, Transaction, Utils, wallet, $uibModal, $uibModalInstance, Web3Service) {

        $scope.wallet = wallet;
        $scope.showWorkerField = false;
        $scope.showReviewerField = false;

        $scope.gardener = {
          address: Web3Service.coinbase,
          amount: 1,
        };
        $scope.worker = {
          address: Web3Service.coinbase,
          amount: 0,
        };$scope.reviewer = {
          address: Web3Service.coinbase,
          amount: 0,
        };

        // console.log(abiJSON.payoutBounty.abi);

        /**
         * Opens the address book modal
         */
        $scope.openAddressBook = function (recipient) {
          $uibModal.open({
            templateUrl: 'partials/modals/selectAddressFromBook.html',
            size: 'lg',
            controller: function ($scope, $uibModalInstance) {
              // Load address book
              $scope.addressBook = JSON.parse(localStorage.getItem('addressBook') || '{}');
              // Sort addresses alphabetically
              $scope.addressArray = Object.keys($scope.addressBook).reduce(function (acc, value) {
                acc.push($scope.addressBook[value]);
                return acc;
              }, [])
                .sort(function (a, b) {
                  if (a.name < b.name) {
                    return -1;
                  }
                  if (a.name > b.name) {
                    return 1;
                  }
                  return 0;
                });

              $scope.choose = function (item) {
                $uibModalInstance.close({
                  item: item
                });
              };

              $scope.cancel = function () {
                $uibModalInstance.dismiss();
              };
            }
          })
            .result
            .then(function (returnData) {
              // Set transaction's recipient
              if (returnData && returnData.item) {
                switch (recipient) {
                  case 'gardener':
                    $scope.gardener.address = returnData.item.address;
                    break;

                  case 'worker':
                    $scope.worker.address = returnData.item.address;
                    break;

                  case 'reviewer':
                    $scope.reviewer.address = returnData.item.address;
                    break;

                  default:
                    break;
                }
              }
            });
        };

        $scope.toggleWorkerField = function () {
          $scope.showWorkerField = !$scope.showWorkerField;
        }

        $scope.toggleReviewerField = function () {
          $scope.showReviewerField = !$scope.showReviewerField;
        }

        $scope.payout = function () {
          console.log('Payout', $scope.gardener);
        };

        $scope.getNonce = function () {
          var value = new Web3().toBigNumber($scope.amount).mul('1e' + $scope.token.decimals);
          var data = Token.withdrawData(
            $scope.token.address,
            $scope.to,
            new Web3().toBigNumber($scope.amount).mul('1e' + $scope.token.decimals)
          );
          Wallet.getNonce($scope.wallet.address, $scope.token.address, "0x0", data, function (e, nonce) {
            if (e) {
              Utils.dangerAlert(e);
            } else {
              $uibModalInstance.close();
              Utils.nonce(nonce);
            }
          }).call();
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss();
        };
      });
  }
)();
