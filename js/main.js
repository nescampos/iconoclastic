const IconService = window['icon-sdk-js'];
const provider = new IconService.HttpProvider('https://lisbon.net.solidwallet.io/api/v3');
const iconServiceUtil = new IconService(provider);

function saveAddressInStorage(address, secret, oldaddress, seed) {
  var addresses = JSON.parse(localStorage.getItem("addresses"));
  if(addresses != null) {
    addresses.push({address:address, key: secret, oldaddress:oldaddress, seed:seed});
    
  }
  else {
    addresses = []
    addresses.push({address:address, key: secret, oldaddress:oldaddress, seed:seed});
  }
  localStorage.setItem("addresses", JSON.stringify(addresses));
}



function getFirstAddress() {
  var addresses = JSON.parse(localStorage.getItem("addresses"));
  return addresses[0];
}

async function sendTransaction() {
  const myWallet = JSON.parse(localStorage.getItem("myWallet"));
  var recipient = $('#trx_address').val();
  if(recipient == '') {
    $('#errorTrx').css("display","block");
    $('#errorTrx').text("Recipient is invalid");
    return;
  }
  var amount = $('#trx_amount').val();
  if(amount == '') {
    $('#errorTrx').css("display","block");
    $('#errorTrx').text("Amount is invalid");
    return;
  }

  var trx_password = $('#trx_password').val();
  if(trx_password == '') {
    $('#errorTrx').css("display","block");
    $('#errorTrx').text("You need to enter your password");
    return;
  }

  const txObj = new IconService.IconBuilder.IcxTransactionBuilder()
    .from(myWallet.address)
    .to(recipient)
    .value(IconService.IconAmount.of(amount, IconService.IconAmount.Unit.ICX).toLoop())
    .stepLimit(IconService.IconConverter.toBigNumber(100000))
    .nid(IconService.IconConverter.toBigNumber(3))
    .nonce(IconService.IconConverter.toBigNumber(1))
    .version(IconService.IconConverter.toBigNumber(3))
    .timestamp((new Date()).getTime() * 1000)
    .build();

  var walletFrom = IconService.IconWallet.loadKeystore(myWallet, trx_password);
  

  $('.valid-feedback').css('display','block');
  $('.valid-feedback').text('Executing transaction.');

  const signedTransaction = new IconService.SignedTransaction(txObj, walletFrom)
  

  try {
    const txHash = await iconServiceUtil.sendTransaction(signedTransaction).execute();
    console.log(txHash);
    $('#trx_address').val("");
    $('#trx_amount').val("");
    $('#trx_password').val("");
    $('.valid-feedback').css('display','block');
    $('.valid-feedback').text('Transaction was executed successfully.');
    checkBalance();
    $('.invalid-feedback').css('display','none');
  }
  catch(err) {
    $('.valid-feedback').css('display','none');
    $('.invalid-feedback').css('display','block');
    $('.invalid-feedback').text('Transaction was executed with errors. Try again.');
  }
}


async function generateWallet()
{
  const wallet = IconService.IconWallet.create();
    $('#new_address_generated').show();
    $('#new_wallet_address').text(wallet.getAddress());
    $('#hidden_new_wallet_address').val(wallet.getAddress());
    $('#new_wallet_secret').text(wallet.getPrivateKey());
    $('#hidden_new_wallet_secret').val(wallet.getPrivateKey());
    //saveAddressInStorage(fund_result.wallet.publicKey, fund_result.wallet.privateKey, fund_result.wallet.classicAddress, fund_result.wallet.seed);

}

function saveWallet() {
  const wallet = IconService.IconWallet.loadPrivateKey($('#hidden_new_wallet_secret').val());
  var walletKeyStore = wallet.store($('#passwordRegisterAccount').val());
  localStorage.setItem("myWallet", JSON.stringify(walletKeyStore));
  confirmKeySaved();
}

function confirmKeySaved() {
  localStorage.authenticated = "true";
  location.href = 'index.html';
}

function generateWalletFromPrivateKey()
{
    const privateKey = $('#pvKeyValue').val();
    const password = $('#pvKeyNewPasswordValue').val();
    if(privateKey != '' && password != '') {
      const wallet = IconService.IconWallet.loadPrivateKey(privateKey);
      var walletKeyStore = wallet.store(password);
      localStorage.setItem("myWallet", JSON.stringify(walletKeyStore));
      confirmKeySaved();
    }
    else {
      $('#errorLogin').css("display","block");
      $('#errorLogin').text('The private Key and password must not be empty.');
        
    }
}

function generateWalletFromKeyStore()
{
    const privateKey = $('#pvKeyStoreValue').val();
    const password = $('#pvKeyPasswordValue').val();
    if(privateKey != '' && password != '') {
      try {
        const walletLoadedByKeyStore = IconService.IconWallet.loadKeystore(privateKey, password);
        if(walletLoadedByKeyStore !== null) {
          localStorage.setItem("myWallet", privateKey);
          confirmKeySaved();
        }
      }
      catch(err) {
        $('#errorLogin2').css("display","block");
        $('#errorLogin2').text('The KeyStore or the password is not valid.');
      }
      
    }
    else {
      $('#errorLogin2').css("display","block");
      $('#errorLogin2').text('The KeyStore file and password must not be empty.');
        
    }
}

async function checkBalance()
{
  const myWallet = JSON.parse(localStorage.getItem("myWallet"))
  const balance = await iconServiceUtil.getBalance(myWallet.address).execute();
  $('.view_balance_address').text(IconService.IconAmount.fromLoop(balance));

    //client.disconnect();
}

async function checkCurrentBlock() {
  const totalSupply = await iconServiceUtil.getTotalSupply().execute();
  $('.view_block_number').text(IconService.IconAmount.fromLoop(totalSupply));
}

function showPrivateKey() {
  const myWallet = JSON.parse(localStorage.getItem("myWallet"));
  var password = $('#passwordShowPV').val();
  try {
    var walletFrom = IconService.IconWallet.loadKeystore(myWallet, password);
    var privateKey = walletFrom.getPrivateKey();
    $('#privateKetShowed').text(privateKey);
  }
  catch(err) {
    alert('The password is wrong. Please, enter the right password.')
  }
  $('#passwordShowPV').val('');
  return false;
}

function logout() {
  localStorage.clear();
  location.href = 'login.html';
}

function downloadFile() {

  
}
    

$(function()
{
  if(localStorage.getItem('myWallet') != null) {
    checkBalance();
    checkCurrentBlock();
    const myWallet = JSON.parse(localStorage.getItem("myWallet"))
    $('.current_account').qrcode(myWallet.address);
    $('.current_account_text').text(myWallet.address);
    const blob = new Blob([localStorage.getItem("myWallet")], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    var buttonDownload = document.getElementById('downloadFile');
    buttonDownload.href = url;
    buttonDownload.download = 'ICONKeyStore.json';
  }

  $('#saveWallet').click(
    function() {
    saveWallet()});
  
    $('#generateWalletButton').click(
        function() {
        generateWallet()});

    $('#generateWalletPrivKeyButton').click(
        function() {
            generateWalletFromPrivateKey()});

    $('#generateWalletKeyStoreButton').click(
      function() {
        generateWalletFromKeyStore()});

    $('#confirmKeySavedButton').click(
      function() {
        confirmKeySaved()});

    $('#verifyAddressButton').click(
      function() {
        checkAddress()});
    $('#btnLogout').click(
      function() {
        logout()});

    $('#sendTrxButton').click(
      function() {
        sendTransaction()});


    $('#btnShowPrivateKey').click(
        function() {
          showPrivateKey()});
        
    
}
    
);