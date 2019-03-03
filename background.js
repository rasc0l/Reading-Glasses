
// Listen for browser icon being clicked
chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.executeScript(tab.id, {
    file: 'reading-glasses.js'
  });
});
