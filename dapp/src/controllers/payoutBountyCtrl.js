(
  function () {
    angular
      .module("multiSigWeb")
      .controller("payoutBountyCtrl", function ($scope, Wallet, Transaction, Utils, wallet, $uibModal, $uibModalInstance, Web3Service) {

        $scope.wallet = wallet;
        $scope.showWorkerField = false;
        $scope.showReviewerField = false;

        $scope.gardener = {
          address: Web3Service.coinbase,
          amount: 1,
          isRepOnly: false
        };
        $scope.worker = {
          address: Web3Service.coinbase,
          amount: 0,
          isRepOnly: false
        };
        $scope.reviewer = {
          address: Web3Service.coinbase,
          amount: 0,
          isRepOnly: false
        };
        $scope.bountyId = ''

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
          // TODO: Add validations for valid checksum addresses of Worker & Reviewer
          const { stripHexPrefix } = ethereumjs.Util;
          const { toBigNumber, toHex } = new Web3();
          const _getInput = function (_address, _amount, _isRepOnly) {
            const _amountBN = toBigNumber(_amount * 10 ** 18);
            const _amountHex = Utils.leftPad(
              stripHexPrefix(toHex(_isRepOnly ? _amountBN.add(1).toString() : _amountBN.toString())),
              24
            );
            return `0x${stripHexPrefix(_address)}${_amountHex}`
          };

          const _gardener = _getInput($scope.gardener.address, $scope.gardener.amount, $scope.gardener.isRepOnly);
          const _worker = _getInput($scope.worker.address, $scope.worker.amount, $scope.worker.isRepOnly);
          const _reviewer = _getInput($scope.reviewer.address, $scope.reviewer.amount, $scope.reviewer.isRepOnly);
          const _bountyId = toHex($scope.bountyId.replace('github.com/leapdao', ''));

          const contractAddress = '0x8B55748048414b09958398acDbb6021cf8B800D6'; // Rinkeby address
          const contractInstance = Web3Service.web3.eth.contract(abiJSON.payoutBounty.abi).at(contractAddress);
          const walletInstance = Web3Service.web3.eth.contract(Wallet.json.multiSigDailyLimit.abi).at($scope.wallet.address);

          const data = contractInstance.payout.getData(
            _gardener,
            _worker,
            _reviewer,
            _bountyId
          );

          // Get nonce
          Wallet.getTransactionCount($scope.wallet.address, true, true, function (e, count) {
            if (e) {
              Utils.dangerAlert(e);
            } else {
              Web3Service.configureGas(Wallet.txDefaults({ gas: 500000 }), function (gasOptions) {
                walletInstance.submitTransaction(
                  contractAddress,
                  "0x0",
                  data,
                  count,
                  Wallet.txDefaults({
                    gas: gasOptions.gas,
                    gasPrice: gasOptions.gasPrice
                  }),
                  function (e, tx) {
                    if (e) {
                      Utils.dangerAlert(e);
                    } else {
                      Utils.notification("Bounty payout transaction was sent.");
                      $uibModalInstance.close();
                      Transaction.add({
                        txHash: tx,
                        callback: function () {
                          Utils.success("Bounty payout transaction was mined.");
                        }
                      });
                    }
                  });
              });
            }
          }).call();
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss();
        };
      });
  }
)();
