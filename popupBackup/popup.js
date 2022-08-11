// Initialize butotn with users's prefered color
let recordButton = document.getElementById("record");
let stopButton = document.getElementById("stop");
let xPath = document.getElementById("xPath");
let tbody = document.getElementById("tbody");
// When the button is clicked, inject setPageBackgroundColor into current page
// recordButton.addEventListener("click", async () => {
//   let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//   chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     function: () => {},
//   });
// });

// The body of this function will be execuetd as a content script inside the
// current page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type == "addAction") {
    // console.log("!@###########################");
    // console.log(request.data[0].rectext);
    // console.log(request.data[0].key);
    // console.log(request.data[0].type);
    // console.log(request.data[0].url);
    // console.log(request.data[0].xpath);
    // console.log(request.data[0].locators);
    let tr = document.createElement("tr");

    let actionTd = document.createElement("td");
    let locatorTypeTd = document.createElement("td");
    let locatorTd = document.createElement("td");
    let valueTd = document.createElement("td");
    let locatorsTd = document.createElement("td");

    let actionInput = document.createElement("input");
    let locatorTypeInput = document.createElement("input");
    let locatorInput = document.createElement("input");
    let valueInput = document.createElement("input");
    let locatorsSelect = document.createElement("select");
    let defaultOption = document.createElement("option");
    defaultOption.text = "선택";
    locatorsSelect.append(defaultOption);
    request.data[0].locators.map((locator) => {
      let option = document.createElement("option");
      option.text = locator.locatorType;
      option.value = locator.locator;
      locatorsSelect.append(option);
      if (locator.locator == request.data[0].xpath) {
        locatorTypeInput.value = locator.locatorType;
      }
    });

    actionInput.value = request.data[0].type;
    locatorInput.value = request.data[0].xpath;
    valueInput.value = request.data[0].key;
    actionTd.appendChild(actionInput);
    locatorTypeTd.appendChild(locatorTypeInput);
    locatorTd.appendChild(locatorInput);
    valueTd.appendChild(valueInput);
    locatorsTd.appendChild(locatorsSelect);
    tr.appendChild(actionTd);
    tr.appendChild(locatorTypeTd);
    tr.appendChild(locatorTd);
    tr.appendChild(valueTd);
    tr.appendChild(locatorsTd);
    tbody.appendChild(tr);

    //event add
    let selectTags = document.getElementsByTagName("select");
    for (let i = 0; i < selectTags.length; i++) {
      selectTags[i].addEventListener("change", (e) => {
        e.target.parentElement.parentElement.children[1].firstChild.value =
          e.target.selectedOptions[0].text;
        e.target.parentElement.parentElement.children[2].firstChild.value =
          e.target.value;
      });
    }
  }
});
const toggleActivate = (e) => {
  chrome.runtime.sendMessage({ type: "toggleActivate" });
};

recordButton.addEventListener("click", toggleActivate);

window.addEventListener("beforeunload", (event) => {
  // Cancel the event as stated by the standard.
  event.preventDefault();
  // Chrome requires returnValue to be set.
  event.returnValue = "";
});
