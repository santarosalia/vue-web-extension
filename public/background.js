const browserAppData = this.browser || this.chrome;
const tabs = {};
const inspectFile = "inspect.js";
const jqueryFile = "jquery.js";
const activeIcon = "EdenXpath_active.png";
const defaultIcon = "EdenXpath_default.png";
let popupId = "";
let tabList = [];
let lastXpath;
let lastType;
let chrome_storage_lock = false;
let image_save_lock = false;
let nextPageData = {};
let recList = [];
let removeRecList = false; //backspace를 눌러 지운 키보드입력인지 확인하는 변수

const storage = browserAppData.storage && browserAppData.storage.local;

chrome.storage.local.set({
  //처음 로드될 때 모든 데이터 초기화
  data: [],
  scrapeData: [],
});

let started = false;
let tabsUrl = {};

const inspect = {
  toggleActivate: (id, type, icon, url) => {
    started = type === "activate" ? true : false;
    this.id = id;

    browserAppData.tabs.executeScript(null, { file: jqueryFile }, function () {
      browserAppData.tabs.executeScript(id, { file: inspectFile }, function () {
        removeDatascrape();

        if (id == popupId) {
          browserAppData.tabs.sendMessage(id, { action: type });
        } else {
          browserAppData.tabs.sendMessage(id, {
            action: type,
            recList: recList,
          });
        }
      });
    });
    browserAppData.browserAction.setIcon({
      tabId: id,
      path: { 19: "icons/" + icon },
    });
    tabsUrl[id] = url;
  },
};

/**
 * chrome extension을 눌렀을 때 아이콘상태변경 및 contextmenu를 생성
 *
 * @param {*} tab
 */
function toggle(tab) {
  console.log("ok");
  if (tab.title.includes("Worktronics") || tab.title.includes("WORKTRONICS")) {
    alert(
      "디자인캔버스에서는 웹레코딩을 실행할 수 없습니다.\n다른탭으로 이동한 후 웹레코딩을 실행해주세요."
    );
  }
  if (tab.status === "complete") {
    chrome.tabs.setZoom(1);
    var wdTab = !(
      tab.title === undefined ||
      tab.title.includes("Worktronics") ||
      tab.title.includes("WORKTRONICS")
    );
    if (isSupportedProtocolAndFileType(tab.url) && wdTab) {
      if (!tabs[tab.id]) {
        tabs[tab.id] = Object.create(inspect);
        inspect.toggleActivate(tab.id, "activate", activeIcon, tab.url);
        chrome.contextMenus.create({
          id: "readText",
          title: "텍스트 읽기",
          contexts: ["all"],
          onclick: contextClick,
        });
        chrome.contextMenus.create({
          id: "dataScrapping",
          title: "데이터스크래핑",
          contexts: ["all"],
          onclick: contextClick,
        });
        chrome.contextMenus.create({
          id: "readAttribute",
          title: "속성값 읽기",
          contexts: ["all"],
          onclick: contextClick,
        });
        chrome.contextMenus.create({
          id: "href",
          title: "href",
          contexts: ["all"],
          parentId: "readAttribute",
          onclick: contextClick,
        });
        chrome.contextMenus.create({
          id: "value",
          title: "value",
          contexts: ["all"],
          parentId: "readAttribute",
          onclick: contextClick,
        });
        chrome.contextMenus.create({
          id: "class",
          title: "class",
          contexts: ["all"],
          parentId: "readAttribute",
          onclick: contextClick,
        });
        chrome.contextMenus.create({
          id: "hover",
          title: "hover 클릭",
          contexts: ["all"],
          onclick: contextClick,
        });

        let data = [
          {
            //웹레코더 실행한 페이지를 레코딩
            url: tab.url || tab.pendingUrl,
            type: "newTab",
            xpath: "",
            key: "",
          },
        ];

        addAction(data);
        checkTab("start", tab.id, tab.index); // 시작할 때 탭리스트를 담아서 이후 꺼지거나 생성되는 탭을 구별함
      } else {
        chrome.contextMenus.removeAll();
        tabList = [];
        browserAppData.tabs.query({}, (tabs) => {
          tabs.forEach((t) => {
            if (
              !(t.title === undefined) &&
              !t.title.includes("Worktronics") &&
              !t.title.includes("WORKTRONICS")
            ) {
              recList = [];
              inspect.toggleActivate(t.id, "deactivate", defaultIcon, tab.url);
            }
          });
        });

        for (const tabId in tabs) {
          delete tabs[tabId];
          if (tabId == tab.id) {
            browserAppData.tabs.sendMessage(tab.id, {
              action: "record",
              tabId: tab.id,
            });
          }
        }
      }
    }
  }
}

/**
 * contextmenu 하위메뉴를 클릭했을 때, 어떤메뉴를 클릭했을지 알수없음으로 클릭하는 시점에 어떤메뉴를 클릭했는지 메세지를 보내줌
 *
 * @param {*} info
 * @param {*} tab
 */
function contextClick(info, tab) {
  var req = { cmd: info.menuItemId, url: tab.url, command: "contextMenu" };
  browserAppData.tabs.sendMessage(tab.id, req);
}

/**
 * activetab에 대한 속성을 읽어와서 지원되는 형식의 사이트인지 확인
 *
 * @param {*} urlString
 * @returns
 */
function isSupportedProtocolAndFileType(urlString) {
  if (!urlString) {
    return false;
  }
  const supportedProtocols = ["https:", "http:", "file:"];
  const notSupportedFiles = ["xml", "pdf", "rss"];
  const extension = urlString.split(".").pop().split(/\#|\?/)[0];
  const url = document.createElement("a");
  url.href = urlString;
  return (
    supportedProtocols.indexOf(url.protocol) !== -1 &&
    notSupportedFiles.indexOf(extension) === -1
  );
}

/**
 * 새탭이 생겼을 때 몇번째 탭이 생기고 닫혔는지 확인해 탭의 위치를 리턴
 *
 * @param {*} type
 * @param {*} tbId
 * @param {*} tbIdx
 * @returns
 */
function checkTab(type, tbId, tbIdx) {
  var idx;
  if (type == "start") {
    tempList = { tbId, tbIdx };
    tabList.push(tempList);
  } else if (type == "new") {
    tempList = { tbId, tbIdx };
    tabList.push(tempList);
    idx = tabList.length - 1;
  } else if (type == "close") {
    for (var i = 0; i < tabList.length; i++) {
      if (tabList[i].tbId == tbId) {
        tabList.splice(i, 1);
        idx = i - 1;
        break;
      }
    }
  }
  return idx;
}

function getActiveTab(tabId, changeInfo, tab) {
  console.log("get");
  if (changeInfo.favIconUrl) {
  }
  if (changeInfo.status === "complete" && tab.title != undefined) {
    if (
      started &&
      tab.title &&
      !(tab.title.includes("Worktronics") || tab.title.includes("WORKTRONICS"))
    ) {
      tabs[tab.id] = Object.create(inspect);
      inspect.toggleActivate(tab.id, "activate", activeIcon, tab.url);
      //   browserAppData.tabs.sendMessage(tabId, {
      //     action: 'addViewDiv'
      //    ,recList : recList
      //  });
    }
  }
}

browserAppData.commands.onCommand.addListener((command) => {
  if (command === "toggle-xpath") {
    browserAppData.tabs.query({ active: true, currentWindow: true }, (tab) => {
      toggle(tab[0]);
    });
  }
});

/**
 * Message handler function for adding a action to action list.
 * Action list should be solely managed by background.js, content.js should not handle chrome.storage directly.
 * Because of handling multiple tabs safely & avoiding race conditions for chrome.storage.
 *
 * @param {*} action
 * @returns
 */
function addAction(action) {
  if (chrome_storage_lock == true) {
    // wait 1 ms
    setTimeout(addAction, 1, action);
    return;
  }

  if (image_save_lock == true) {
    // wait 5 ms
    setTimeout(addAction, 10, action);
    return;
  }

  chrome_storage_lock = true; // get chrome storage lock

  storage.get(
    {
      data: [],
    },
    function (result) {
      if (result.data.length !== 0) {
        let actionList = result.data;
        if (lastType === "none") {
          actionList.pop();
        } else if (
          action[0].type === "keyboard" &&
          action[0].type === lastType &&
          action[0].xpath === lastXpath &&
          action[0].key.length != 0
        ) {
          action[0].image = actionList[actionList.length - 1][0].image;
          actionList.pop();
          recList.pop();
        } else if (
          lastType === "Enter" &&
          action[0].xpath === lastXpath &&
          action[0].type != "keyboard"
        ) {
          actionList.pop();
          recList.pop();
        } else if (
          action[0].type === "hover" &&
          action[0].type === lastType &&
          action[0].xpath === lastXpath
        ) {
          actionList.pop();
          recList.pop();
        }

        if (
          !removeRecList &&
          !(action[0].type === "keyboard" && action[0].key.length == 0)
        ) {
          actionList.push(action);
        }

        removeRecList = false; // removeRecList 초기화
        if (action[0].rectext != "" && action[0].rectext != null) {
          recList.push(action[0].rectext);
        }
        storage.set({
          data: actionList,
        });
      } else {
        let actionList = [];
        actionList.push(action);

        storage.set({
          data: actionList,
        });
      }
      lastXpath = action[0].xpath;
      lastType = action[0].type;
      chrome_storage_lock = false;
      // release chrome storage lock
    }
  );
}

/**
 * Message handler for requests from multiple content.js tabs.
 *
 * @param {*} request
 * @param {*} sender
 * @param {*} sendResponse
 */
async function recMsg(request, sender, sendResponse) {
  if (request.type == "readTable") {
    removeDatascrape(); //기존 데이터스크래핑내역 초기화
    let data = [
      {
        url: "noPage",
        type: "dataScrapping",
        xpath: request.xpathList,
        key: request.key,
        image: request.image,
      },
    ];
    addAction(data);
  } else if (request.type == "readTableNextPage") {
    removeDatascrape(); //기존 데이터스크래핑내역 초기화
    let pageCnt = nextPageData.pageCnt;
    let pageXpath = request.pageXpath;
    let nextPageList = [pageCnt, pageXpath];
    let data = [
      {
        url: nextPageList,
        type: "dataScrapping",
        xpath: nextPageData.xpathList,
        key: nextPageData.key,
        image: nextPageData.image,
      },
    ];
    addAction(data);
  } else if (request.type == "addAction") {
    if (
      !(
        request.data[0].type === "keyboard" &&
        request.data[0].type === lastType &&
        request.data[0].xpath === lastXpath
      ) &&
      request.coords
    ) {
      request.data[0].image = await capture(request.coords, "normal");
    }
    addAction(request.data);
  } else if (request.type == "createPopup") {
    let image = await capture(request.coords, "scrape");
    request.data[0].image = image;
    chrome.storage.local.set(
      {
        scrapeData: request.data,
      },
      () => {
        chrome.windows.create({
          url: chrome.runtime.getURL("data.html"),
          type: "popup",
          height: 500,
          width: 800,
        });
      }
    );
  } else if (request.type == "recordComplete") {
    browserAppData.tabs.query({}, (tabs2) => {
      tabs2.forEach((tab) => {
        if (tab.title !== undefined) {
          if (
            tab.title.includes("Worktronics") ||
            tab.title.includes("WORKTRONICS")
          ) {
            browserAppData.tabs.sendMessage(tab.id, {
              action: "createRecord",
              data: request.data,
            });
            delete tabs[request.tabId];
          }
        }
      });
    }); // tabs.query 끝.
  } else if (request.type == "selectNextPage") {
    nextPageData = request;
    var last = tabList.length - 1;

    browserAppData.tabs.sendMessage(tabList[last].tbId, {
      action: "selectNextPage",
      pageCnt: nextPageData.pageCnt,
    });
  } else if (request.type == "removeRecList") {
    removeRecList = true;
    lastType = "removeRecList";
    recList.pop();
  }
}

/**
 *
 * @param {*} coords //엘리먼트 좌표
 * @param {*} type //데이터스크래핑 || others
 * @returns
 */
function capture(coords, type) {
  if (image_save_lock == true) {
    // wait 1 ms
    setTimeout(capture, 1, capture);
    return;
  }
  image_save_lock = true; // get chrome storage lock

  return new Promise(function (resolve, reject) {
    chrome.tabs.captureVisibleTab(null, { format: "jpeg" }, function (dataUrl) {
      if (chrome.runtime.lastError) {
        image_save_lock = false;
        resolve("error");
      } else {
        var img = new Image();

        img.onload = function () {
          var imgCanvas = document.createElement("canvas");

          if (coords.x + coords.w > img.width) {
            coords.w = img.width - coords.x;
          }
          if (coords.y + coords.h > img.height) {
            coords.h = img.height - coords.y;
          }
          //220315 그림제외버전
          // imgCanvas.width = coords.w;
          // imgCanvas.height = coords.h;
          // var ctx_ = imgCanvas.getContext('2d');
          // ctx_.fillStyle = 'rgba(0,0,0,0.5)';
          // ctx_.drawImage(img, coords.x, coords.y, coords.w, coords.h, 0, 0, coords.w, coords.h);
          // ctx_.fillStyle = 'rgba(0,0,0,0.5)';
          // imageData = imgCanvas.toDataURL('image/jpeg', 1.0);

          //그림그리는 버전
          imgCanvas.width = img.width;
          imgCanvas.height = img.height;

          var ctx = imgCanvas.getContext("2d");
          ctx.drawImage(img, 0, 0, img.width, img.height);
          imageData = imgCanvas.toDataURL("image/jpeg", 1.0);
          if (type == "normal") {
            ctx.lineWidth = 5;
            ctx.strokeStyle = "rgba(255,108,108)";
            ctx.strokeRect(coords.x, coords.y, coords.w - 200, coords.h - 200);
          }
          imageData = imgCanvas.toDataURL("image/jpeg", 1.0);

          var drawImg = new Image();
          drawImg.src = imageData;
          drawImg.onload = function () {
            var canvas = document.createElement("canvas");
            canvas.width = coords.w;
            canvas.height = coords.h;

            var ctx_ = canvas.getContext("2d");
            ctx_.fillStyle = "#fff";
            ctx_.fillRect(0, 0, canvas.width, canvas.height);

            if (type == "scrape") {
              ctx_.drawImage(
                drawImg,
                coords.x,
                coords.y,
                coords.w,
                coords.h,
                0,
                0,
                coords.w,
                coords.h
              );
            } else {
              ctx_.drawImage(
                drawImg,
                coords.x - 100,
                coords.y - 100,
                coords.w,
                coords.h,
                0,
                0,
                coords.w,
                coords.h
              );
            }

            imageData = canvas.toDataURL("image/jpeg", 1.0);
            image_save_lock = false;
            resolve(imageData);
          };
        };
        img.src = dataUrl;
      }
    });
  });
}

function removeTab(tabId, tab) {
  let data = [];
  console.dir(tabList);
  if (started) {
    if (tabId == popupId) {
      data = [
        {
          url: tabsUrl[tabId],
          type: "closePopup",
          xpath: "",
          key: "",
        },
      ];
    } else {
      var idx = checkTab("close", tabId, "");
      if (idx != undefined && idx > -1) {
        data = [
          {
            url: tabsUrl[tabId],
            type: "moveTab",
            xpath: "",
            key: idx,
          },
        ];
      } else {
        return;
      }
    }
    addAction(data);
  }
}

function movedTab(tabId, moveInfo) {
  if (started) {
    let data = [
      {
        url: tabsUrl[tabId],
        type: "closeTab",
        xpath: "",
        key: "",
      },
    ];

    addAction(data);
  }
}

function createTab(tab) {
  if (started) {
    console.log("createTab");
    let data = [];
    browserAppData.tabs.query({ active: true, currentWindow: true }, (t) => {
      console.log(t[0]);
      if (
        t[0].pendingUrl != null &&
        t[0].pendingUrl.includes("chrome-extension://")
      ) {
        return;
      }
      console.log("popup");
      if (t[0].pendingUrl != undefined && t[0].incognito != true) {
        let tempUrl = t[0].pendingUrl;
        if (t[0].index == 0) {
          console.log("pop업!");
          popupId = t[0].id;
          data = [
            {
              url: tempUrl,
              type: "popup",
              xpath: "",
              key: "",
            },
          ];
        } else {
          var idx = checkTab("new", t[0].id, t[0].index);
          data = [
            {
              url: tempUrl,
              type: "moveTab",
              xpath: "",
              key: idx,
            },
          ];
        }
        addAction(data);
      }
    });
  }
}

function removeDatascrape() {
  // 데이터스크래핑내역 초기화
  chrome.storage.local.set({
    xpathData: [],
    textData: [],
    typeArr: [],
    originData: [],
    originTextData: [],
    secondElementData: [],
  });
}

//manifest.json의 content_scripts에 맞는 url 일때 inspect.js 삽입
chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
  chrome.tabs.executeScript(null, { file: inspectFile });
});

//storage changes 감지하는 부분
// chrome.storage.onChanged.addListener(function(changes, namespace) {
//   console.log('cahnges;');
//   console.log(changes);
// });
const popupToggle = () => {
  chrome.windows.create({
    url: chrome.runtime.getURL("index.html"),
    type: "popup",
    height: 600,
    width: 1000,
  });
};
const toggleMessage = (request, sender, sendResponse) => {
  if (request.type == "toggleActivate") {
    let queryOptions = { active: true };
    chrome.tabs.query(queryOptions, ([tab]) => {
      if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
      // `tab` will either be a `tabs.Tab` instance or `undefined`.

      toggle(tab);
    });
  }
};
browserAppData.tabs.onUpdated.addListener(getActiveTab);
browserAppData.tabs.onRemoved.addListener(removeTab);
browserAppData.tabs.onCreated.addListener(createTab);
browserAppData.tabs.onMoved.addListener(movedTab);
browserAppData.browserAction.onClicked.addListener(popupToggle);
browserAppData.runtime.onMessage.addListener(recMsg);
browserAppData.runtime.onMessage.addListener(toggleMessage);
