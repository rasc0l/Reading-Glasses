/*
 * Functions for adding necessary HTML to the DOM
 */
function injectHTML() {
  injectHeadHTML();
  injectBodyHTML();
}

function injectHeadHTML() {
  var cssLink = document.createElement("link");
  cssLink.rel = "stylesheet"
  cssLink.href = `${chrome.runtime.getURL("dialog.css")}`
  document.head.appendChild(cssLink);
}

function injectBodyHTML() {
  var dialog = document.createElement("dialog");
  dialog.id = "reading-dialog";
  var iframe = document.createElement("iframe");
  iframe.id = "parsed-page";
  dialog.appendChild(iframe);
  document.body.appendChild(dialog);
}


// Callback for document.onclick listener
function dismissDialog(event) {
  var dialog = document.getElementById("reading-dialog")
  if (event.target == dialog) {
    dialog.close()
  }
}

// Callback for window.resize listener
function resizeDialog() {
  var dialog = document.getElementById("reading-dialog")
  dialog.style.height = `${document.documentElement.clientHeight * 0.85}px`;
  dialog.style.marginTop = `${document.documentElement.clientHeight * 0.075}px`;
  dialog.style.width = `${document.documentElement.clientWidth * 0.6}px`;
  dialog.style.marginLeft = `${document.documentElement.clientWidth * 0.2}px`;
}

function cleanHTML(element) {
  if (element.children) {
    element.innerHTML = "";
  }
}

// Depth first search to retrieve the intended reading content
function skimPage(roots) {
  var leaves = [];
  var stack = [];
  for (var i = roots.length - 1; i >= 0; i--) {
    stack.push(roots[i]);
  }
  while (stack.length > 0) {
    var currentNode = stack.pop();
    if (currentNode.tagName == "P" || currentNode.tagName == "H1" || currentNode.tagName == "H2" || currentNode.tagName == "H3") {
      leaves.push(currentNode.cloneNode(true));
    } else {
      for (var i = currentNode.children.length - 1; i >= 0; i--) {
        stack.push(currentNode.children[i]);
      }
    }
  }
  return leaves;
}

// Gets the 1st level divs from the element, mostly for pulling first level divs from the <body>
function getChildDivs(element) {
  return Array.prototype.filter.call(element.children, child => child.tagName == "DIV");
}

function getStyleSheets() {
  var links = document.getElementsByTagName("link");
  return Array.prototype.filter.call(links, link => link.rel == "stylesheet");
}


/* Function driving the background.js browseraction.onclick listener
 * Logic:
 * Initialize dialog and listeners if needed
 * Scrape stylesheets and p/h{n} tags for text data
 * Add that data to the iframe inside the dialog's DOM
 * Show modal
 */
(function() {
  var DIALOG_ID = "reading-dialog";
  var dialog = document.getElementById(DIALOG_ID);
  if (!dialog) {
    injectHTML();
    dialog = document.getElementById(DIALOG_ID);
    document.onclick = dismissDialog;
    window.onresize = resizeDialog;
  }
  if (dialog.open) {
    dialog.close();
  } else {
    resizeDialog();
    var iframeDoc = document.getElementById("parsed-page").contentDocument;
    var iframeHead = iframeDoc.head;
    var iframeBody = iframeDoc.body;
    cleanHTML(iframeHead);
    cleanHTML(iframeBody);

    var styleSheets = getStyleSheets();
    var firstLevelDivs = getChildDivs(document.getElementsByTagName("body")[0]);
    var parsed = skimPage(firstLevelDivs);
    styleSheets.map(sheet => iframeHead.appendChild(sheet.cloneNode(true)))
    parsed.map(docEle => iframeBody.appendChild(docEle.cloneNode(true)))
    dialog.showModal();
  }
})();
