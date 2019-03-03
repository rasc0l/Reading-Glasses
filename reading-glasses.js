function injectDialogHTML() {
  document.body.innerHTML +=`<dialog id="reading-dialog">
           <iframe id="parsed-page"></iframe>
           </dialog>`;
}

// Callback for document.onclick listener
function dismissDialog(event) {
  var dialog = document.getElementById("reading-dialog")
  if (event.target == dialog) {
    dialog.close();
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
  element.innerHTML = "";
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
  var result = [];
  for (var i = 0; i < element.children.length; i++) {
    if (element.children[i].tagName == "DIV") {
      result.push(element.children[i]);
    }
  }
  return result;
}


/* Function driving the background.js browseraction.onclick listener
 * Logic:
 * Initialize dialog if needed
 * Scrape stylesheets and p/h{n} tags for text data
 * Add that data to the iframe inside the dialog's DOM
 * Show modal
 */
(function() {
  var DIALOG_ID = "reading-dialog";
  var dialog = document.getElementById(DIALOG_ID);
  if (!dialog) {
    injectDialogHTML();
    document.head.innerHTML += `<link rel="stylesheet" href=${chrome.runtime.getURL("dialog.css")}>`;
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
    if (iframeHead.children) {
      cleanHTML(iframeHead);
    }
    var styleSheets = document.getElementsByTagName("link");
    for (var i = 0; i < styleSheets.length; i++) {
      if (styleSheets[i].rel == "stylesheet") {
        iframeHead.appendChild(styleSheets[i].cloneNode(true));
      }
    }
    var iframeBody = iframeDoc.body;
    if (iframeBody.children) {
      cleanHTML(iframeBody);
    }
    var firstLevelDivs = getChildDivs(document.getElementsByTagName("body")[0]);
    var parsed = skimPage(firstLevelDivs);
    for (var i = 0; i < parsed.length; i++) {
      iframeBody.appendChild(parsed[i]);
    }
    dialog.showModal();
  }
})();
