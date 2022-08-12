/* globals chrome - test */

var contextMenuElement = null; // context menu가 발생된 위치에 있던 DOM element를 저장할 변수
var contextMenuFrame = null; // contextmenu가 발생된 위치가 iframe일 경우 frame을 저장한 변수
var frameNode = null; // iframe이 달라졌는지 판단하는 변수
var currentFrameStack = ["root"];
var mouseXpath = ""; //마우스위치 기록하는 변수
var firstElement = null;
var selectNextPage = false;
var selectNextPageCnt = 0;
var firstEleParent = null;
var clientX;
var clientY;
var lastEventType;
var lastEventXpath;
var lastCoords;
var lastData = {};

var xPathFinder =
  xPathFinder ||
  (() => {
    const storage = chrome.storage && chrome.storage.local;
    class Inspector {
      // class의 생성자 함수
      constructor() {
        this.win = window;
        this.doc = window.document;

        this.draw = this.draw.bind(this);
        this.getData = this.getData.bind(this);
        this.setOptions = this.setOptions.bind(this);

        this.cssNode = "xpath-css";
        this.contentNode = "xpath-content";
        this.overlayElement = "xpath-overlay";
      }

      /**
       * addListener로 들어온 이벤트 구별하여 레코딩
       *
       * 웹 레코더 실시간 레코딩 결과를 우측 상단에 표시해주는 함수
       *
       * @param {* 이벤트 객체} e
       * @param {* 이벤트 구분 명령어} inputType
       * @param {*} iframe
       */
      getData(e, inputType, iframe) {
        var target = "";

        // prevent multiple event handling
        // check if the event is already handled
        if (typeof e !== "string") {
          if (e.edenEventHandled) {
            return;
          } else {
            // set this event as already handled
            e.edenEventHandled = true;
          }
        }

        // console.log(`getData(): e.target ${JSON.stringify(e.target)}, inputType ${inputType}, iframe ${iframe}`)
        console.log(`getData(): inputType ${inputType}, iframe ${iframe}`);
        //STRONG 태그는 스타일을 위한 태그로 STRONG 태그의 부모를 타겟으로 변경한다.
        if (inputType === "contextMenu") {
          target =
            contextMenuElement.nodeName == "STRONG"
              ? contextMenuElement.parentNode
              : contextMenuElement;
          // target = contextMenuElement;
          iframe = contextMenuFrame;
        } else if (inputType === "hover") {
          target = e.nodeName == "STRONG" ? e.parentNode : e.target;
        } else {
          target = target.nodeName == "STRONG" ? e.parentNode : e.target;
        }

        // iframe 위에 엘리먼트인지 확인
        let iframeNode = window.frameElement || iframe;
        let iframeXpath = iframeNode ? this.getXPath(iframeNode) : null;
        console.log(`getData(): iframeXpath ${iframeXpath}`);

        // this.checkFrame(iframe); //iframeXpath가 아니고 frameElement를 보내야 함.
        // root window 부터 frame의 path를 파악해야 함
        // window.frames[i].frameElement.contentWindow는 해당 frameElement를 포함하는 window (== frame)
        // frame.parent를 따라가면 root window에 도달 == window.top

        this.checkFrame(iframeXpath, iframeNode); // 기존 frameStack과 iframe의 frameStack이 다르면 'switchFrame'을 addAction()

        // ***** frame의 위치 파악하하는 부분 - child frame을 고려하여 코드 수정 필요 *****
        // !! SHOULD BE CORRECTED
        var iframeRect = iframeNode ? iframeNode.getBoundingClientRect() : null; //iframe 위치, 크기

        if (target.offsetWidth == 0 || target.offsetHeight == 0) {
          target = target.parentNode;
        }

        var rect = target.getBoundingClientRect(); //target 위치, 크기
        //iframe위 엘리먼트일경우 iframe 위치 더해줌
        if (iframeNode) {
          var coords = {
            w: target.offsetWidth + 200,
            h: target.offsetHeight + 200,
            x: rect.x + iframeRect.x,
            y: rect.y + iframeRect.y,
          };
        } else {
          var coords = {
            w: target.offsetWidth + 200,
            h: target.offsetHeight + 200,
            x: rect.x,
            y: rect.y,
          };
        }

        if (target.id !== this.contentNode) {
          if (target.id) {
            this.XPath = `//*[@id="${target.id}"]`;
          } else if (document.getElementsByName(target.name).length == 1) {
            this.XPath = `//*[@name="${target.name}"`;
          } else if (
            target.tagName == "A" ||
            target.parentElement.tagName == "A"
          ) {
            this.XPath = this.getLinkText(target);
          } else {
            this.XPath = this.getXPath(target);
          }

          //   this.XPath = this.getXPath(target);

          const contentNode = document.getElementById(this.contentNode); // this.contentNode = 'xpath-content'

          let type = "mouse";
          let typeStr = "클릭";
          let key = target.value;
          let removeRecList = false; //키보드 다 지워졌을 때 레코딩내역 삭제판단 변수

          if (inputType === "contextMenu") {
            type = e;
            typeStr = e;
            key = target.value;
          } else if (inputType === "hover") {
            type = "hover";
            typeStr = "이동";
            key = target.value;
          } else {
            if (e.key === "Enter" && e.type === "keydown") {
              type = "enter";
              typeStr = "ENTER";
            } else if (
              e.type === "keyup" &&
              e.key !== "Tab" &&
              e.target.type != "password" &&
              e.key !== "Enter"
            ) {
              type = "keyboard";
              typeStr = "키보드";
            } else if (
              e.type === "keyup" &&
              e.key !== "Tab" &&
              e.target.type == "password" &&
              e.key !== "Enter"
            ) {
              type = "keyboard";
              typeStr = "password";
            } else if (
              e.target.nodeName == "SELECT" ||
              e.target.nodeName == "select"
            ) {
              let index = e.target.selectedIndex;
              type = "select";
              typeStr = "옵션";
              key = e.target[index].text;
            } else if (target.style.display == "none") {
              type = "none";
              typeStr = "클릭";
              key = e.target.value;
            } else if (
              e.target.nodeName === "INPUT" &&
              e.target.type != "radio"
            ) {
              type = "input";
              typeStr = "클릭";
              key = e.target.value;
            }
          }

          if (lastEventType == "keyboard" && lastEventType != type) {
            chrome.runtime.sendMessage({
              data: lastData,
              coords: lastCoords,
              type: "addAction",
            });
          }

          let contentString = iframeNode ? `${this.XPath}` : this.XPath;
          const contentInnerTextSkip =
            target.innerText.length >= 9 ? "..." : "";
          let contentInnerText =
            target.innerText.substring(0, 8) + contentInnerTextSkip;
          // 데이터 스크래핑의 경우 target의 innerText 출력 X
          if (type == "dataScrapping") {
            contentInnerText = "";
          }
          let elementName = "";

          if (target.id !== "" && target.id !== undefined) {
            elementName = target.id;
          } else if (target.name !== "" && target.name !== undefined) {
            elementName = target.name;
          }

          let createDiv = false;
          let text = "";
          let contentHtml = document.getElementById("xpath-content");
          if (contentNode) {
            let divChild = contentHtml.children;
            if (typeStr !== "password" && typeStr !== "키보드") {
              text = `[${typeStr}][${elementName}] ${contentInnerText}`;
              // let innerDiv = document.createElement('div');
              // innerDiv.className = 'eden-rec-content-div'; // 웹페이지 클래스와 안 겹치기위해 길고 유니크하게 생성
              // innerDiv.innerHTML = text;
              // contentHtml.appendChild(innerDiv);
              createDiv = true;
            } else {
              // 키보드에 입력된 내용이 길 경우 ... 으로 생략

              if (key) {
                const keySkip = key.length >= 11 ? "..." : "";
                if (typeStr === "password") {
                  text = `[${typeStr}][${elementName}]*******${keySkip}`;
                } else {
                  text = `[${typeStr}][${elementName}]${key.substring(
                    0,
                    10
                  )}${keySkip}`;
                }
              } else if (
                !key &&
                divChild[divChild.length - 1].innerText.includes("키보드")
              ) {
                divChild[divChild.length - 1].remove();
                removeRecList = true;
                createDiv = false;
              } else {
                return;
              }
              //키보드-키보드가 녹화될 경우 하나로 합쳐줌
              if (divChild[divChild.length - 1].innerHTML.includes(typeStr)) {
                divChild[divChild.length - 1].innerText = text;
                createDiv = false;
              } else if (key) {
                createDiv = true;
              }
            }
          } else {
            const contentHtml = document.createElement("div");
            contentHtml.id = this.contentNode;
            document.body.appendChild(contentHtml);

            let innerDiv = document.createElement("div");
            innerDiv.className = "eden-rec-content-div"; // 웹페이지 클래스와 안 겹치기위해 길고 유니크하게 생성
            text = `[${typeStr}][${elementName}]${contentInnerText}`;
            innerDiv.innerHTML = text;
            contentHtml.appendChild(innerDiv);
          }

          if (createDiv) {
            let innerDiv = document.createElement("div");
            innerDiv.className = "eden-rec-content-div"; // 웹페이지 클래스와 안 겹치기위해 길고 유니크하게 생성
            innerDiv.innerHTML = text;
            contentHtml.appendChild(innerDiv);
            contentHtml.scrollTop = contentHtml.scrollHeight;
          }
          let locators = [
            { locatorType: "id", locator: target.id },
            { locatorType: "name", locator: target.name },
            { locatorType: "linkText", locator: this.getLinkText(target) },
            {
              locatorType: "cssSelector",
              locator: this.getCssSelector(target),
            },
            { locatorType: "xpath", locator: this.getXPath(target) },
            { locatorType: "fullXpath", locator: this.getFullXpath(target) },
          ];

          let data = [
            {
              url: this.win.location.href,
              type: type,
              xpath: contentString,
              key: key,
              rectext: text,
              locators: locators,
            },
          ];

          lastData = data;

          if (selectNextPage == true) {
            alert(selectNextPageCnt + "개 페이지의 스크래핑이 완료되었습니다");
            chrome.runtime.sendMessage({
              pageXpath: contentString,
              pageCnt: selectNextPageCnt,
              type: "readTableNextPage",
            });
            selectNextPage = false;
            selectNextPageCnt = 0;
            return;
          }

          if (
            !(
              type === "keyboard" &&
              lastEventType == type &&
              lastEventXpath == contentString &&
              selectNextPage == true
            )
          ) {
            chrome.runtime.sendMessage({
              data: data,
              coords: coords,
              type: "addAction",
            });
            console.log(
              `getData(): send Action - ${JSON.stringify(
                data
              )}, coords ${JSON.stringify(coords)}`
            ); // shjung
          }
          if (removeRecList == true) {
            chrome.runtime.sendMessage({ type: "removeRecList" });
          }
          lastEventType = type;
          lastEventXpath = contentString;
          lastCoords = coords;
          removeRecList = false;
        }
      }

      /**
       * 단일 엘리먼트를 선택해 유관 데이터를 크롤링하는 기능
       *  UL/TABLE/BDOY를 기준으로 엘리먼트의 상위노드 탐색이 멈춘다.
       *  탐색이 멈춰진 엘리먼트가 기준점이되며 기준점의 자식노드를 대상으로 데이터스크래핑을 진행한다.
       *  1. topLvTag 테이블일 경우: 별도의 판단없이 테이블의 (th-td)와 (tr-td)를 이차원배열로 담는다.
       *  2. 테이블 이외의 태그일 경우: 규칙에 따라 연관성이 있는 데이터를 리스트에 담는다.
       *
       * @param {* 두번째 엘리먼트 선택 버튼을 누른 후 선택한 엘리먼트} isSecondTarget
       */
      dataScrapping(scrapeData) {
        inspect.removeOverlay();
        let iframe = contextMenuFrame; //컨텍스트 이벤트가 발생한 iframe
        let target = contextMenuElement; // 컨텍스트 이벤트가 발생한 엘리먼트
        let parent = target; // 부모노드 탐색을 위해 초기 target값 설정
        let xpathList = []; // xpath담은 리스트
        let topLvTag = ""; // 어떤 노드에서 멈췄는지 저장하기 위한 변수
        let textList = []; //innerText 담은 리스트
        let nodeList = []; // 거처간 노드이름 담는 리스트
        let isSecondTarget = scrapeData.secondElementData; // 두번째 엘리먼트찾기인지 판단하는 변수

        let targetIndexInParent = -1; // target 엘리먼트의 부모 엘리먼트에서 target 엘리먼트의 인덱스를 담아두는 변수
        let targetParent = target != null ? target.parentNode : ""; // target 엘리먼트의 parent 엘리먼트를 담아두는 변수
        let targetParentChildren =
          targetParent != null ? targetParent.children : ""; // target 엘리먼트의 parent 엘리먼트의 자식 노드들을 담아두는 변수
        // iframe 위에 엘리먼트인지 확인
        let iframeNode = window.frameElement || iframe;
        let iframeXpath = iframeNode ? this.getXPath(iframeNode) : null;

        //this.checkFrame(iframeXpath);
        this.checkFrame(iframeXpath, iframeNode);

        // target 엘리먼트가 부모 엘리먼트에서 몇 번째에 위치하는지 찾는 로직
        Array.prototype.forEach.call(targetParentChildren, (child, index) => {
          if (child == target) {
            targetIndexInParent = index;
          }
        });

        while (parent.nodeName != "HTML") {
          if (
            parent.nodeName == "UL" ||
            parent.nodeName == "TABLE" ||
            parent.nodeName == "BODY"
          ) {
            let rect =
              parent.nodeName == "BODY"
                ? target.getBoundingClientRect()
                : parent.getBoundingClientRect();

            var iframeRect = iframeNode
              ? iframeNode.getBoundingClientRect()
              : null; //iframe 위치, 크기

            //iframe위 엘리먼트일경우 iframe 위치 더해줌
            if (iframeNode) {
              var coords = {
                w: rect.width,
                h: rect.height,
                x: rect.x + iframeRect.x,
                y: rect.y + iframeRect.y,
              };
            } else {
              var coords = {
                w: rect.width,
                h: rect.height,
                x: rect.x,
                y: rect.y,
              };
            }

            topLvTag = parent.nodeName;

            // 자식노드로 내려가면서 2차원 배열로 xpath와 innerText을 담아준다.
            if (topLvTag == "TABLE") {
              var tableElement = target.closest("TABLE");
              var tableChild = tableElement.childNodes;
              var tempNode = [];

              for (var i = 0; i < tableChild.length; i++) {
                if (
                  tableChild[i].nodeName == "THEAD" ||
                  tableChild[i].nodeName == "TBODY"
                ) {
                  var tr = tableChild[i].childElementCount; // tr cnt
                  tempNode = tableChild[i].children; // tr 엘리먼트들을 리스트에 담음
                  for (var j = 0; j < tr; j++) {
                    let childCount = tempNode[j].children; // td 엘리먼트를 리스트에 담음
                    let tempList = []; // td의 innerText 담는 리스트
                    let tempSelector = []; // td의 xpath 담는 리스트
                    let rowspanCnt = []; // 줄 칸 개수 담는 리스트
                    for (var k = 0; k < childCount.length; k++) {
                      // 현재 엘리먼트 href 값 가져오기
                      if (childCount[k].hasAttribute("href")) {
                        tempList.push(childCount[k].href);
                        tempSelector.push(this.getXPath(childCount[k]));
                      }
                      // 현재 엘리먼트 colspan 값 가져오기
                      if (childCount[k].hasAttribute("colspan")) {
                        var colNum = $(childCount[k]).attr("colspan") - 1;
                        while (colNum > 0) {
                          //colspan수만큼 행삽입
                          tempList.push(childCount[k].innerText + "_" + colNum);
                          var xpath = this.getXPath(childCount[k]);
                          tempSelector.push(xpath);
                          colNum--;
                        }
                      }
                      // 현재 엘리먼트 rowspan 값 가져오기
                      if (childCount[k].hasAttribute("rowspan")) {
                        var rowNum = $(childCount[k]).attr("rowspan") - 1;
                        rowspanCnt.push(rowNum);
                      }

                      tempList.push(childCount[k].innerText);
                      var xpath = this.getXPath(childCount[k]);
                      tempSelector.push(xpath);
                    }

                    //가장 큰 rowspan 수만큼 tr 스킵
                    if (rowspanCnt.length > 0) {
                      rowspanCnt.sort(function (a, b) {
                        return b - a;
                      });
                      j = j + rowspanCnt[0];
                    }

                    textList.push(tempList); //완성된 한 줄의 innerText
                    xpathList.push(tempSelector); //완성된 한 줄의 xpath
                  }
                }
              }
              break;
            } else {
              let selectorList = []; // 스크래핑 엘리먼트 담는 리스트

              //두번째 엘리먼트 선택인지 확인 ( 두번째 엘리먼트 선택인 경우 )
              if (
                isSecondTarget != undefined &&
                isSecondTarget[0] != null &&
                isSecondTarget[0] != "" &&
                firstElement != undefined
              ) {
                //var firstElementParent = firstElement.parentNode;
                // var firstElementParent =$(firstElement).parent();

                // var targetElementParent = target.parentNode;

                var firstElementIdx = $(firstElement).index();
                var targetElementIdx = $(target).index();

                //첫번째 엘리먼트의 클래스를 담아줌
                var targetClass = "";
                target.classList.forEach((classStr, index) => {
                  if (!classStr.includes("(") && classStr != "") {
                    if (targetClass.length > 0) {
                      targetClass += "." + classStr;
                    } else {
                      targetClass += classStr;
                    }
                  }
                });

                //두번째 엘리먼트의 클래스를 담아줌
                var firstElementClass = "";
                firstElement.classList.forEach((classStr, index) => {
                  if (!classStr.includes("(") && classStr != "") {
                    if (firstElementClass.length > 0) {
                      firstElementClass += "." + classStr;
                    } else {
                      firstElementClass += classStr;
                    }
                  }
                });

                //클래스, 노드이름, nth-child 비교
                var sameClass =
                  firstElementClass == targetClass && targetClass.length > 0;
                var sameNodeName = firstElement.nodeName == target.nodeName;
                var sameIdx = firstElementIdx == targetElementIdx;

                // for(var i in nodeList){// 부모노드가 같아질때까지 기준점 노드리스트 중 다른 노드이름 삭제
                //     console.log(firstElement);
                //     console.log(firstElementParent);
                //     console.log(targetElementParent);
                //     if(firstElementParent == targetElementParent || !sameNodeName) {
                //         break;
                //     } else if(firstElementParent.nodeName != targetElementParent.nodeName) {
                //         nodeList.splice(nodeList.length-(1+i),i);
                //     }
                // }

                var node;

                if (nodeList.length > 1) {
                  node = nodeList.reverse().join(" ");
                } else {
                  node = nodeList.toString();
                }

                //두번째 선택 엘리먼트의 class를 넣어줌
                let targetParentClass = targetParent.classList[0];
                let firstElementParentClass =
                  firstElement.parentNode.classList[0];
                let targetParnetClassCnt =
                  document.getElementsByClassName(targetParentClass);

                if (
                  targetParentClass == null ||
                  targetParentClass == undefined ||
                  targetParentClass == "" ||
                  targetParnetClassCnt < 1
                ) {
                  node = `${node}`;
                } else if (firstElementParentClass == targetParentClass) {
                  node = `${node}.${targetParentClass}`;
                }

                //  targetParentSiblings = parent.querySelectorAll(node);
                let sameParent = firstEleParent == parent;

                if (!sameParent) {
                  console.log("!sameParent");
                  outer: for (var firstItem of $(firstElement).parents()) {
                    inner: for (var secondItem of $(target).parents()) {
                      console.log(firstItem);
                      console.log(secondItem);
                      if (firstItem == secondItem) {
                        parent = secondItem;
                        console.log("same!");
                        console.log(parent);
                        break outer;
                      }
                    }
                  }
                  // let firstTargetParent = firstElement.parentNode;
                  // let secondTargetParent = target.parentNode;

                  // while(firstTargetParent != secondTargetParent){

                  //     firstTargetParent = firstTargetParent.parentNode;
                  //     secondTargetParent = secondTargetParent.parentNode;
                  // }
                  // parent = secondTargetParent;

                  // console.log(node);
                }

                let targetParentSiblings = parent.querySelectorAll(node);
                console.log(targetParentSiblings);
                // 클래스가 같지 않음 && 같은 위치 && 같은 nodename
                if (!sameClass && sameIdx && sameNodeName) {
                  node = `${node} ${target.nodeName}:nth-child(${
                    targetElementIdx + 1
                  })`;
                } else if (sameClass && !sameIdx && sameNodeName) {
                  // 클래스가 같음 && 다른 위치 && 같은 nodename
                  node = `${node} ${target.nodeName}.${targetClass}`;
                } else if (sameIdx && !sameNodeName) {
                  // 같은 위치 && 다른 nodename
                  node = `${node} ${firstElement.nodeName},${
                    target.nodeName
                  }:nth-child(${targetElementIdx + 1})`;
                } else if (sameClass && sameIdx && sameNodeName) {
                  // 클래스가 같음 && 같은 위치 && 같은 nodename
                  node = `${node} ${target.nodeName}:nth-child(${
                    targetElementIdx + 1
                  })`;
                } else {
                  // 그 외 조건
                  node = `${node} ${target.nodeName}`;
                }

                // target 엘리먼트의 parent 엘리먼트들의 형제노드를 찾는 코드
                console.log(targetParentSiblings);
                // node에 담긴 규칙으로 target과 비슷하다고 생각되는 엘리먼트 스크래핑하는 로직
                targetParentSiblings.forEach((sibling, index) => {
                  let dataScrappingSelectElement = sibling.querySelector(node);
                  let sbilingParents = $(dataScrappingSelectElement).parents();
                  let secondParents = $(target).parents();
                  let sameParentLength =
                    $(firstElement).parents().length ==
                    $(target).parents().length;
                  let sbilingSameParentLength =
                    $(dataScrappingSelectElement).parents().length ==
                    $(target).parents().length;

                  if (sameParentLength != sbilingSameParentLength) {
                    return;
                  }
                  if (dataScrappingSelectElement != null) {
                    if (
                      sameClass &&
                      dataScrappingSelectElement.className == target.className
                    ) {
                      selectorList.push(dataScrappingSelectElement);
                    } else if (!sameClass) {
                      selectorList.push(dataScrappingSelectElement);
                    }
                  }
                });
              } else {
                // 두번째 엘리먼트 선택이 아닌 경우
                var node = nodeList.reverse().join(" ");
                var targetClass = target.className.trim().replaceAll(" ", ".");

                // target 엘리먼트의 클래스가 없는 경우 또는 클래스가 변동이 있는 경우('(' 가 포함된 경우 그 안에 값들이 다를 수 있어 비교 기준으로 사용하기 어려움)
                if (
                  targetClass == null ||
                  targetClass == undefined ||
                  targetClass == "" ||
                  targetClass.includes("(")
                ) {
                  // ========== find target의 parent element와 동일한 element들 찾기
                  let targetParentClass = targetParent.classList[0];
                  let targetParnetClassCnt =
                    document.getElementsByClassName(targetParentClass);

                  // target 엘리먼트의 parent 엘리먼트의 클래스를 사용할 수 없는 경우
                  if (
                    targetParentClass == null ||
                    targetParentClass == undefined ||
                    targetParentClass == "" ||
                    targetParnetClassCnt < 1
                  ) {
                    node = `${node}`;
                  } else {
                    // target 엘리먼트의 parent 엘리먼트의 클래스를 사용할 경우
                    node = `${node}.${targetParentClass}`;
                  }

                  // target 엘리먼트의 parent 엘리먼트들의 형제노드를 찾는 코드
                  let targetParentSiblings = parent.querySelectorAll(node);

                  // 데이터 스크래핑시 사용할 selector를 담는 변수
                  let dataScrappingSelector = node;
                  dataScrappingSelector = `${dataScrappingSelector} ${
                    target.nodeName
                  }:nth-child(${targetIndexInParent + 1})`;

                  let dataScrappingSelectElement = "";

                  // dataScrappingSelector를 사용하여 데이터 스크래핑
                  targetParentSiblings.forEach((sibling, index) => {
                    dataScrappingSelectElement = sibling.querySelector(
                      dataScrappingSelector
                    );

                    if (dataScrappingSelectElement != null) {
                      selectorList.push(dataScrappingSelectElement);
                    }
                  });
                } else {
                  // target 엘리먼트의 클래스를 사용할 수 있는 경우
                  node = node + " " + target.nodeName + "." + targetClass;
                  selectorList = parent.querySelectorAll(node);
                }
                firstElement = target; // target을 이용한 조회가 모두 끝나면 firstElement에 넣어 다음차례에 사용
                firstEleParent = parent;
              }

              // selectorList.length 값이 있는 경우
              if (selectorList.length) {
                for (let i = 0; i < selectorList.length; i++) {
                  const NODENAME_IMG = "IMG";
                  //const ATTRIBUTE_SRC = "src"; IMG 태그일 때 src 내용 가져오는 건 잠시 보류 2021.12.30
                  const ATTRIBUTE_HREF = "href";
                  let tempList = [];
                  let tempSelector = [];
                  let currSelectElement = selectorList[i]; // for문에서 selectorList 중 현재 비교할 element를 담는 변수

                  if ($(currSelectElement).is(":hidden")) {
                    //hidden인 엘리먼트는 웍디자이너에서 사용할 수 없음으로 저장안함
                    continue;
                  }

                  if (currSelectElement.nodeName == NODENAME_IMG) {
                    // currSelectElement 의 nodeName 이 IMG 일 때,
                    // <img> 태그의 alt 값 가져오기
                    const contentInnerTextSkip =
                      currSelectElement.alt.length >= 61 ? "..." : "";
                    const contentInnerText =
                      currSelectElement.alt.substring(0, 60) +
                      contentInnerTextSkip;

                    if (
                      topLvTag != null &&
                      !(topLvTag == "TBODY" || topLvTag == "TABLE")
                    ) {
                      var xpath = this.getXPath(currSelectElement);
                      tempSelector.push(xpath); // currSelectElement의 xpath 를 tempSelector에 넣기
                    }
                    tempList.push(contentInnerText); // <img> 태그의 alt 값을 tempList에 넣기

                    // <img> 태그의 src 값 가져오기 필요한 값인지 추후 판단 필요
                    // if(currSelectElement.hasAttribute(ATTRIBUTE_SRC)) {
                    //     tempList.push(currSelectElement.src);
                    //     tempSelector.push(this.getXPath(currSelectElement));
                    // }

                    // tempList, tempSelector 에 담아둔 값들을 각각 textList, xpathList에 넣기
                    textList.push(tempList);
                    xpathList.push(tempSelector);
                  } else {
                    // currSelectElement 의 nodeName 이 IMG 를 제외한 태그일 때,

                    // currSelectElemnt의 innerText 값 가져오기
                    const contentInnerTextSkip =
                      currSelectElement.innerText.length >= 61 ? "..." : "";
                    const contentInnerText =
                      currSelectElement.innerText.substring(0, 60) +
                      contentInnerTextSkip;

                    tempSelector.push(this.getXPath(currSelectElement));
                    tempList.push(contentInnerText);

                    // currSelectElement에 href 값 가져오기
                    if (currSelectElement.hasAttribute(ATTRIBUTE_HREF)) {
                      tempList.push(currSelectElement.href);
                      tempSelector.push(this.getXPath(currSelectElement));
                    }

                    // tempList, tempSelector 에 담아둔 값들을 각각 textList, xpathList에 넣기
                    textList.push(tempList);
                    xpathList.push(tempSelector);
                    //confirm("이 데이터가 맞습니까? \n\n" + textList.replaceAll(',','\r\n'));
                  }
                }
              }
              //  }
            }
            break;
          } // <UL>, <TABLE>, <DIV> 조건 if 문 끝
          parent = parent.parentNode;
          nodeList.push(parent.nodeName);
        } // 상위노드 탐색 while문 끝

        let oldTextList = scrapeData.textData; // 저장되어 있는 기존 스크래핑 데이터 리스트
        let oldXpathList = scrapeData.xpathData; // 저장되어 있는 기존 스크래핑 xpath 리스트
        let typeArr = []; // 위에서 저장된 topLvTag를 넘겨주는 변수
        let originArr = []; // 기존 스크래핑 xpath 리스트 저장 변수
        let originTextArr = []; // 기존 스크래핑 데이터 리스트 저장 변수
        typeArr.push(topLvTag);

        //기존 스크래핑 텍스트와 합치는 부분
        if (textList.length > 0) {
          if (oldTextList != undefined && oldTextList.length > 0) {
            //기존-새 스크래핑 열 갯수 차이가 있을 경우 긴쪽에 맞춰 빈 arr 삽입
            originTextArr = oldTextList.concat();
            if (textList.length > oldTextList.length) {
              let emptyArr = [];
              oldTextList[0].forEach(function () {
                emptyArr.push("");
              });
              for (var j = 0; j < textList.length - oldTextList.length; j++) {
                oldTextList.push(emptyArr);
              }
            }
            if (oldTextList.length > textList.length) {
              let emptyArr = new Array(textList[0].length);
              for (var j = 0; j < oldTextList.length - textList.length; j++) {
                textList.push(emptyArr);
              }
            }
            for (var i = 0; i < oldTextList.length; i++) {
              //기존데이터와 합쳐줌
              oldTextList[i] = oldTextList[i].concat(textList[i]);
            }
            textList = oldTextList;
          }
          if (oldXpathList != undefined && oldXpathList.length > 0) {
            originArr = oldXpathList.concat();
            if (xpathList.length > oldXpathList.length) {
              let emptyArr = [];
              oldXpathList[0].forEach(function () {
                emptyArr.push("");
              });
              for (var j = 0; j < xpathList.length - oldXpathList.length; j++) {
                oldXpathList.push(emptyArr);
              }
            }
            if (oldXpathList.length > xpathList.length) {
              let emptyArr = new Array(xpathList[0].length);
              for (var j = 0; j < oldXpathList.length - xpathList.length; j++) {
                xpathList.push(emptyArr);
              }
            }
            for (var i = 0; i < oldXpathList.length; i++) {
              oldXpathList[i] = oldXpathList[i].concat(xpathList[i]);
            }
            xpathList = oldXpathList;
          }
          setTimeout(() => {
            let data = [
              {
                textData: textList,
                xpathData: xpathList,
                typeArr: typeArr,
                originData: originArr,
                originTextData: originTextArr,
              },
            ];
            chrome.runtime.sendMessage({
              data: data,
              type: "createPopup",
              cmd: "createPopup",
              coords: coords,
            }); //팝업을 여는 메세지를 background.js에 보내줌
          }, 500);
        } else {
          alert("스크래핑을 할 수 없는 태그입니다.");
        }
      }
      /**
       *
       * @param {*} recList : 레코딩내역을 보여주는 String List
       */
      drawRecList(recList) {
        const contentNode = document.getElementById(this.contentNode); // this.contentNode = 'xpath-content'

        const contentHtml = document.createElement("div");
        contentHtml.id = this.contentNode;
        document.body.appendChild(contentHtml);

        for (var i in recList) {
          console.log(`drawRecList(): ${i}, ${recList[i]}`); // shjung
          let innerDiv = document.createElement("div");
          innerDiv.className = "eden-rec-content-div"; // 웹페이지 클래스와 안 겹치기위해 길고 유니크하게 생성
          innerDiv.innerHTML = `${recList[i]}`;
          contentHtml.appendChild(innerDiv);
        }
        contentHtml.scrollTop = contentHtml.scrollHeight;
      }

      /**
       * iframe에서 녹화되고 있는 것인지 아닌지 확인하는 함수
       * currentFrameStack 에 'root' 값만 들어 있다면 switchFrame 메시지를 보내지 않도록 함
       */
      isIframe() {
        const STR_ROOT = "root";

        if (
          currentFrameStack.length == 1 &&
          currentFrameStack.includes(STR_ROOT)
        ) {
          return false;
        }

        return true;
      }

      /**
       * frame 위의 엘리먼트인지 확인해서 frame 액티비티 추가하는 함수
       */
      // 레코딩하는 프레임이 변경되었는지 확인하고,
      // 변경되었으면 변경된 프레임에 접근할 수 있는 switchFrame 메시지를 추가한다.
      // frameStack: [sub_frame_xpath2, sub_frame_xpath1, 'root']
      //      - switchTo(root)
      //      - switchTo(sub_frame_xpath1);
      //      - switchTo(sub_frame_xpath2)
      //checkFrame(iframeXpath){
      checkFrame(iframeXpath, frameElement) {
        console.log("!@#$% ...? checkFrame");

        let frameSwitched = this.checkFrameSwitch(frameElement);

        if (frameSwitched) {
          let data = [
            {
              url: "",
              xpath: iframeXpath,
              type: "switchFrame",
              frameStack: currentFrameStack,
              key: "",
            },
          ];
          chrome.runtime.sendMessage({ data: data, type: "addAction" });
          console.log(
            `checkFrame(): send Action 'switchFrame' - ${JSON.stringify(data)}`
          );
          //<<frame switch examle>>
          //frame[name='sb_player']
          //driver.switchTo().frame(driver.findElement(By.xpath(".//iframe[@src='https://tssstrpms501.corp.trelleborg.com:12001/teamworks/process.lsw?zWorkflowState=1&zTaskId=4581&zResetContext=true&coachDebugTrace=none']")));
          //possible hints === name, id, src, xpath of frame
        }
      }

      // currentFrameStack = [];
      //
      // 현재 작업중인 프레임과 동일한 frame 위의 엘리먼트인지 확인하고,
      // frame이 달라질 경우 true 리턴
      //  - Return: true, false
      //  - Side effect: set currentFrameStack as recorded element's frameStack
      //
      checkFrameSwitch(frameElement) {
        //console.log(`checkFrameNew(): Xpath stack`)

        // Build frameStack
        let frameStack = [];
        let fe = frameElement;
        while (fe) {
          //console.log(`-- ${this.getXPath(fe)}`)
          frameStack.push(this.getXPath(fe));
          fe = fe.contentWindow.parent.frameElement;
        }
        //console.log(`-- root`)
        frameStack.push("root");

        //console.log(`checkFrameNew(): currentFrameStack ${JSON.stringify(currentFrameStack)}, frameStack ${JSON.stringify(frameStack)}`); // shjung
        if (this.isSameFrameStack(currentFrameStack, frameStack)) {
          console.log(
            `checkFrameNew()): frameStack same frame ${JSON.stringify(
              frameStack
            )}, currentFrameStack: ${JSON.stringify(currentFrameStack)}`
          );
          return false; // frame not switched
        } else {
          console.log(
            `checkFrameNew()): frameStack changed ${JSON.stringify(
              currentFrameStack
            )} -> ${JSON.stringify(frameStack)}`
          );
          currentFrameStack = frameStack;
          return true; // frame switched
        }
      }

      // Compare two frameStacks
      isSameFrameStack(xStack1, xStack2) {
        // If length is not equal
        if (xStack1.length != xStack2.length) {
          return false;
        } else {
          // Comparing each element of array
          for (var i = 0; i < xStack1.length; i++)
            if (xStack1[i] != xStack2[i]) return false;
          return true;
        }
      }

      /**
       * extension에 설정된 옵션값을 가져온다
       */
      getOptions() {
        const promise = storage.get(
          {
            inspector: true,
            clipboard: true,
            shortid: true,
            position: "tr", // Xpath를 오른쪽 위에 보여줘라
          },
          this.setOptions
        );
        promise && promise.then && promise.then(this.setOptions());
      }

      /**
       * 레코딩내역 보여주는 div style
       */
      setOptions(options) {
        this.options = options;
        let position = "bottom:0;left:0";
        switch (options.position) {
          case "tl":
            position = "top:0;left:0";
            break;
          case "tr":
            position = "top:0;right:0";
            break;
          case "br":
            position = "bottom:0;right:0";
            break;
          default:
            break;
        }
        // this.styles가 화면에 xpath를 씀
        this.styles = `body *{
                            cursor:crosshair!important;
                            }
                            #xpath-content{
                                ${position};
                                border: 1px solid #ccc; /* shjung */
                                cursor:initial!important;
                                padding:10px;
                                position:fixed;
                                width:250px;
                                height:100px;
                                font-size:14px;
                                z-index:10000001;
                                overflow-y:auto;
                                overflow-x:hidden;
                            }
                            .eden-rec-content-div{
                                background:gray;
                                border: 1px solid #ccc; /* shjung */
                                width:250px;
                                height:20px;
                                color:white;
                                opacity:0.9;
                                word-break:break-all;
                            }`;

        this.activate();
      }

      createOverlayElements() {
        const overlayStyles = {
          background: "rgba(120, 170, 210, 0.7)",
          padding: "rgba(77, 200, 0, 0.3)",
          margin: "rgba(255, 155, 0, 0.3)",
          border: "rgba(255, 200, 50, 0.3)",
          // background: 'rgba(120, 170, 210, 0.)',
          // padding: 'rgba(77, 200, 0, 0.)',
          // margin: 'rgba(255, 155, 0, 0.)',
          // border: 'rgba(255, 200, 50, 0.)'
        };

        this.container = this.doc.createElement("div");
        this.node = this.doc.createElement("div");
        this.border = this.doc.createElement("div");
        this.padding = this.doc.createElement("div");
        this.content = this.doc.createElement("div");

        this.border.style.borderColor = overlayStyles.border;
        this.padding.style.borderColor = overlayStyles.padding;
        this.content.style.backgroundColor = overlayStyles.background;

        Object.assign(this.node.style, {
          borderColor: overlayStyles.margin,
          pointerEvents: "none",
          position: "fixed",
        });

        this.container.id = this.overlayElement;
        this.container.style.zIndex = 10000000;
        this.node.style.zIndex = 10000000;

        this.container.appendChild(this.node);
        this.node.appendChild(this.border);
        this.border.appendChild(this.padding);
        this.padding.appendChild(this.content);
      }

      removeOverlay() {
        const overlayHtml = document.getElementById(this.overlayElement);
        overlayHtml && overlayHtml.remove();
      }

      /**
       * clipboard에 XPath copy한다.
       * @param {* 엘리먼트의 XPath} XPath
       */
      copyText(XPath) {
        //
        const hdInp = document.createElement("textarea"); // html tag중에서 textarea라는 것이 있다.
        hdInp.textContent = XPath;
        document.body.appendChild(hdInp);
        hdInp.select();
        document.execCommand("copy");
        hdInp.remove();
      }

      /**
       * 마우스가 가리키는 엘리먼트의 박스를 그려주는 함수
       * @param {*} e
       */
      draw(e) {
        const node = e.target;
        let mainNode = e.target;
        mouseXpath = e.target;

        if (node.id !== this.contentNode) {
          this.removeOverlay();

          const box = this.getNestedBoundingClientRect(node, this.win);
          const dimensions = this.getElementDimensions(node);

          this.boxWrap(dimensions, "margin", this.node);
          this.boxWrap(dimensions, "border", this.border);
          this.boxWrap(dimensions, "padding", this.padding);

          Object.assign(this.content.style, {
            height:
              box.height -
              dimensions.borderTop -
              dimensions.borderBottom -
              dimensions.paddingTop -
              dimensions.paddingBottom +
              "px",
            width:
              box.width -
              dimensions.borderLeft -
              dimensions.borderRight -
              dimensions.paddingLeft -
              dimensions.paddingRight +
              "px",
          });

          Object.assign(this.node.style, {
            top: box.top - dimensions.marginTop + "px",
            left: box.left - dimensions.marginLeft + "px",
            border: "2px solid #0000ff",
            borderRadius: "5px", // border-radius: 5px
          });
          //this.node.style.cssText += 'border-radius: 5px;';

          if (this.doc.body.nodeName === "FRAMESET") {
            let nodeRect = node.getBoundingClientRect();
            Object.assign(this.node.style, {
              top: `${nodeRect.top}px`,
              left: `${nodeRect.left}px`,
            });
            node.closest("body").appendChild(this.container);
          } else {
            this.doc.body.appendChild(this.container);
          }
          //document.body.appendChild(this.container);
        }
      }

      // Add eventListeners for all child frames
      addEventListenerAllChildren(frame) {
        frame.document.addEventListener(
          "click",
          (e) => this.checkMouseEvent(e, "click", frame.frameElement),
          true
        );
        frame.document.addEventListener(
          "contextmenu",
          (e) => this.checkMouseEvent(e, "contextmenu", frame.frameElement),
          true
        );
        frame.document.addEventListener(
          "keyup",
          (e) => this.checkKeyEvent(e, "keyup", frame.frameElement),
          true
        );
        frame.document.addEventListener(
          "keydown",
          (e) => this.checkKeyEvent(e, "keydown", frame.frameElement),
          true
        );
        this.options.inspector &&
          frame.document.addEventListener("mouseover", this.draw);

        console.log(
          `activate(): addEventListener for deeper frame level, frameLength ${frame.frames.length}`
        );

        let length = frame.frames.length;
        for (let i = 0; i < length; i++) {
          let cframe = frame.frames[i];
          this.addEventListenerAllChildren(cframe);
        }
      }

      // Remove eventListeners for all child frames
      removeEventListenerAllChildren(frame) {
        frame.document.removeEventListener(
          "click",
          (e) => this.checkMouseEvent(e, "click", frame.frameElement),
          true
        );
        frame.document.removeEventListener(
          "contextmenu",
          (e) => this.checkMouseEvent(e, "contextmenu", frame.frameElement),
          true
        );
        frame.document.removeEventListener(
          "keyup",
          (e) => this.checkKeyEvent(e, "keyup", frame.frameElement),
          true
        );
        frame.document.removeEventListener(
          "keydown",
          (e) => this.checkKeyEvent(e, "keydown", frame.frameElement),
          true
        );
        this.options.inspector &&
          frame.document.removeEventListener("mouseover", this.draw);

        frame.document.location.reload(true);

        console.log(
          `deactivate(): removeEventListener for deeper frame level, frameLength ${frame.frames.length}`
        );

        let length = frame.frames.length;
        for (let i = 0; i < length; i++) {
          let cframe = frame.frames[i];
          this.removeEventListenerAllChildren(cframe);
        }
      }

      /**
       * 레코딩 될 리스너추가 및 설정
       */
      activate() {
        document.body.style.zoom = 1.0;
        this.createOverlayElements();
        // add styles
        if (!document.getElementById(this.cssNode)) {
          const styles = document.createElement("style");
          styles.innerText = this.styles;
          styles.id = this.cssNode;
          document.getElementsByTagName("head")[0].appendChild(styles);
        }
        /** contextmenu가 발생할 때마다 DOM element 저장
         * contextmenu를 클릭했을 때 이벤트를 addEventListeer로 감지 할 수 없기때문에
         * 오른쪽 마우스를 클릭했을 때의 이벤트 타겟을 저장한뒤 backgournd.js 에서 contextmenu이벤트 발생했을 때
         * 저장한 contextMenuElement를 가지고 지정된 함수를 실행 */
        document.addEventListener("contextmenu", this.checkMouseEvent, true);

        // create listeners for all frames and root
        document.addEventListener("mouseup", this.checkMouseEvent, true);

        /**엔터키는 keydown, 나머지 키는 keyup으로 addListener추가
         * keydown-keypress-keyup 순서로 작동
         * keydown-keypress일때는 입력이 끝나지 않아 엘리먼트에 입력된 value를 가져올 수 없음
         * (e.key로는 한글을 알 수 없어 target.value로 입력된 값을 가져옴)
         * keyup으로 엔터를 입력받게 되면 동시에 바로 이벤트발생해 페이지 이동되어
         * 엔터를 레코딩할 수 없음
         */
        document.addEventListener("keyup", this.checkKeyEvent, true);
        document.addEventListener("keydown", this.checkKeyEvent, true);

        this.options.inspector &&
          document.addEventListener("mouseover", this.draw);

        const frameLength = window.frames.length;
        for (let i = 0; i < frameLength; i++) {
          let frame = window.frames[i];
          this.addEventListenerAllChildren(frame);
        }

        // JUST for debugging
        // set 'red' for first child frames, 'yellow' for second child frames
        console.log(
          `activate(): window.frames.length is ${window.frames.length}`
        );
        var frames = window.frames; // or // var frames = window.parent.frames;
        for (var i = 0; i < frames.length; i++) {
          // do something with each subframe as frames[i]
          // frames[i].document.body.style.background = "red";
          console.log(
            `activate(): frame - ${i}, ${frames[i].name}, ${frames[i]}, ${frames[i].document}, ${frames[i].frameElement}`
          );
          // go deeper level
          for (let j = 0; j < frames[i].frames.length; j++) {
            let cframe = frames[i];
            // cframe.frames[j].document.body.style.background = "yellow";
            console.log(
              `activate(): grandchild frame - ${j}, ${cframe.frames[j].name}, ${cframe.frames[j]}, ${cframe.frames[j].document}, ${cframe.frames[j].frameElement}`
            );
          }
        }
      }

      checkMouseEvent(e, type, iframe) {
        // Event propagation should not be blocked
        // e.stopImmediatePropagation();
        // e.stopPropagation();
        var target = e.target;

        if (iframe != undefined) {
          console.log(
            `checkMouseEvent(): event ${JSON.stringify(
              e
            )}, type ${type}, frame name ${iframe.name}, id ${iframe.id}, src ${
              iframe.src
            }, Xpath ${this.getXPath(iframe)}`
          );
        }

        //오른쪽마우스와 구별하기위해 왼쪽마우스일때만 click이벤트로 레코딩
        if (target == mouseXpath && (e.button == "0" || e.button == "1")) {
          inspect.removeOverlay();
          inspect.getData(e, "click", iframe);
        } else if (e.button == "2") {
          inspect.removeOverlay();
          var frame = iframe ? iframe : null;
          contextMenuFrame = frame;
          contextMenuElement = e.target;
        }
      }

      checkKeyEvent(e, type, iframe) {
        //mouseXpath위치 초기화
        mouseXpath = "";

        console.log(`checKeyEvent(): event ${JSON.stringify(e)}`);

        if (e.key == "Enter" && e.type == "keydown") {
          inspect.removeOverlay();
          inspect.getData(e, true, iframe);
        } else if (e.key != "Enter" && e.type == "keyup") {
          inspect.removeOverlay();
          inspect.getData(e, true, iframe);
        }
      }

      deactivate() {
        // remove styles
        const cssNode = document.getElementById(this.cssNode);
        cssNode && cssNode.remove();
        // remove overlay
        this.removeOverlay();
        // remove xpath html
        const contentNode = document.getElementById(this.contentNode);
        contentNode && contentNode.remove();
        // remove listeners for all frames and root
        document.removeEventListener("contextMenu", this.checkMouseEvent, true);
        document.removeEventListener("mouseup", this.checkMouseEvent, true);
        document.removeEventListener("keyup", this.checkKeyEvent, true);
        document.removeEventListener("keydown", this.checkKeyEvent, true);
        document.removeEventListener("keyboard", this.checkKeyEvent, true);
        document.removeEventListener("mouse", this.checkMouseEvent, true);
        // document.removeEventListener('click',  e=> this.checkMouseEvent(e, 'click', frame.frameElement),true);

        chrome.storage.local.set({
          scrapeData: [],
        });

        this.options &&
          this.options.inspector &&
          document.removeEventListener("mouseover", this.draw);

        const frameLength = window.frames.length;
        for (let i = 0; i < frameLength; i++) {
          let frame = window.frames[i];
          this.removeEventListenerAllChildren(frame);
        }
      }

      /**
       * 선택된 엘리먼트의 부모를 따라올라가며 nodename을 담아준 뒤 xpath형식으로 가공
       * @param {* 선택된 엘리먼트} el
       * @returns
       */
      getXPath(el) {
        let nodeElem = el;
        let isFlexibleXpath = /^-?\d+$/.test(nodeElem.id.slice(-1)); // 마지막 두자리가 숫자일경우 가변될 xpath라고 판단하기 위한 변수

        if (nodeElem.id && this.options.shortid && !isFlexibleXpath) {
          return `//*[@id="${nodeElem.id}"]`; //선택된 엘리먼트의 id가 있을 경우 id 형식의 xpath를 바로 리턴
        }

        const parts = [];
        while (nodeElem && nodeElem.nodeType === Node.ELEMENT_NODE) {
          let nbOfPreviousSiblings = 0;
          let hasNextSiblings = false;
          let sibling = nodeElem.previousSibling;

          while (sibling) {
            if (
              sibling.nodeType !== Node.DOCUMENT_TYPE_NODE &&
              sibling.nodeName === nodeElem.nodeName
            ) {
              nbOfPreviousSiblings++;
            }
            sibling = sibling.previousSibling;
          }
          sibling = nodeElem.nextSibling;

          while (sibling) {
            if (sibling.nodeName === nodeElem.nodeName) {
              hasNextSiblings = true;
              break;
            }
            sibling = sibling.nextSibling;
          }

          const prefix = nodeElem.prefix ? nodeElem.prefix + ":" : "";
          const nth =
            nbOfPreviousSiblings || hasNextSiblings
              ? `[${nbOfPreviousSiblings + 1}]`
              : "";
          isFlexibleXpath = /^-?\d+$/.test(nodeElem.id.slice(-1));

          if (nodeElem.id && this.options.shortid && !isFlexibleXpath) {
            var nodeCount = document.querySelectorAll(`#${nodeElem.id}`);
            if (nodeCount.length == 1) {
              parts.push(`/*[@id="${nodeElem.id}"]`); //부모노드 중 id가 있을 경우 id를 담아준 후 노드검색을 멈춤
              break;
            } else {
              parts.push(prefix + nodeElem.localName + nth);
            }
          } else {
            parts.push(prefix + nodeElem.localName + nth);
          }

          nodeElem = nodeElem.parentNode;
        }
        return parts.length ? "/" + parts.reverse().join("/") : "";
      }

      getCssSelector(elSrc) {
        if (!(elSrc instanceof Element)) return;
        var sSel,
          aAttr = ["name", "value", "title", "placeholder", "data-*"], // Common attributes
          aSel = [],
          // Derive selector from element
          getSelector = function (el) {
            // 1. Check ID first
            // NOTE: ID must be unique amongst all IDs in an HTML5 document.
            // https://www.w3.org/TR/html5/dom.html#the-id-attribute
            if (el.id) {
              aSel.unshift("#" + el.id);
              return true;
            }
            aSel.unshift((sSel = el.nodeName.toLowerCase()));
            // 2. Try to select by classes
            if (el.className) {
              aSel[0] = sSel += "." + el.className.trim().replace(/ +/g, ".");
              if (uniqueQuery()) return true;
            }
            // 3. Try to select by classes + attributes
            for (var i = 0; i < aAttr.length; ++i) {
              if (aAttr[i] === "data-*") {
                // Build array of data attributes
                var aDataAttr = [].filter.call(el.attributes, function (attr) {
                  return attr.name.indexOf("data-") === 0;
                });
                for (var j = 0; j < aDataAttr.length; ++j) {
                  aSel[0] = sSel +=
                    "[" + aDataAttr[j].name + '="' + aDataAttr[j].value + '"]';
                  if (uniqueQuery()) return true;
                }
              } else if (el[aAttr[i]]) {
                aSel[0] = sSel += "[" + aAttr[i] + '="' + el[aAttr[i]] + '"]';
                if (uniqueQuery()) return true;
              }
            }
            // 4. Try to select by nth-of-type() as a fallback for generic elements
            var elChild = el,
              sChild,
              n = 1;
            while ((elChild = elChild.previousElementSibling)) {
              if (elChild.nodeName === el.nodeName) ++n;
            }
            aSel[0] = sSel += ":nth-of-type(" + n + ")";
            if (uniqueQuery()) return true;
            // 5. Try to select by nth-child() as a last resort
            elChild = el;
            n = 1;
            while ((elChild = elChild.previousElementSibling)) ++n;
            aSel[0] = sSel = sSel.replace(
              /:nth-of-type\(\d+\)/,
              n > 1 ? ":nth-child(" + n + ")" : ":first-child"
            );
            if (uniqueQuery()) return true;
            return false;
          },
          // Test query to see if it returns one element
          uniqueQuery = function () {
            return (
              document.querySelectorAll(aSel.join(">") || null).length === 1
            );
          };
        // Walk up the DOM tree to compile a unique selector
        while (elSrc.parentNode) {
          if (getSelector(elSrc)) return aSel.join(" > ");
          elSrc = elSrc.parentNode;
        }
      }

      getLinkText(el) {
        let count = 1;
        const result = document.evaluate(
          `//*[text()="${el.text}"]`,
          document,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );

        if (result.snapshotLength > 1) {
          for (let i = 0; i < result.snapshotLength; i++) {
            if (
              el ==
              document.evaluate(
                `(//*[text()="${el.text}"])[${i}]`,
                document,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
              )
            ) {
              count = i;
              break;
            }
          }
        }
        return `(//*[text()="${el.text}"])[${count}]`;
      }

      getFullXpath(element) {
        console.log(element);
        if (element.tagName == "html") return "/html[1]";
        if (element === document.body) return "/html[1]/body[1]";

        var ix = 0;
        var siblings = element.parentNode.childNodes;
        for (var i = 0; i < siblings.length; i++) {
          var sibling = siblings[i];
          if (sibling === element)
            return (
              this.getFullXpath(element.parentNode) +
              "/" +
              element.tagName.toLowerCase() +
              "[" +
              (ix + 1) +
              "]"
            );
          if (
            sibling.nodeType === 1 &&
            sibling.tagName.toLowerCase() === element.tagName.toLowerCase()
          )
            ix++;
        }
      }

      getElementDimensions(domElement) {
        const calculatedStyle = window.getComputedStyle(domElement);
        return {
          borderLeft: +calculatedStyle.borderLeftWidth.match(/[0-9]*/)[0],
          borderRight: +calculatedStyle.borderRightWidth.match(/[0-9]*/)[0],
          borderTop: +calculatedStyle.borderTopWidth.match(/[0-9]*/)[0],
          borderBottom: +calculatedStyle.borderBottomWidth.match(/[0-9]*/)[0],
          marginLeft: +calculatedStyle.marginLeft.match(/[0-9]*/)[0],
          marginRight: +calculatedStyle.marginRight.match(/[0-9]*/)[0],
          marginTop: +calculatedStyle.marginTop.match(/[0-9]*/)[0],
          marginBottom: +calculatedStyle.marginBottom.match(/[0-9]*/)[0],
          paddingLeft: +calculatedStyle.paddingLeft.match(/[0-9]*/)[0],
          paddingRight: +calculatedStyle.paddingRight.match(/[0-9]*/)[0],
          paddingTop: +calculatedStyle.paddingTop.match(/[0-9]*/)[0],
          paddingBottom: +calculatedStyle.paddingBottom.match(/[0-9]*/)[0],
        };
      }

      getOwnerWindow(node) {
        if (!node.ownerDocument) {
          return null;
        }
        return node.ownerDocument.defaultView;
      }

      getOwnerIframe(node) {
        const nodeWindow = this.getOwnerWindow(node);
        if (nodeWindow) {
          return nodeWindow.frameElement;
        }
        return null;
      }

      getBoundingClientRectWithBorderOffset(node) {
        const dimensions = this.getElementDimensions(node);
        return this.mergeRectOffsets([
          node.getBoundingClientRect(),
          {
            top: dimensions.borderTop,
            left: dimensions.borderLeft,
            bottom: dimensions.borderBottom,
            right: dimensions.borderRight,
            width: 0,
            height: 0,
          },
        ]);
      }

      mergeRectOffsets(rects) {
        return rects.reduce((previousRect, rect) => {
          if (previousRect === null) {
            return rect;
          }
          return {
            top: previousRect.top + rect.top,
            left: previousRect.left + rect.left,
            width: previousRect.width,
            height: previousRect.height,
            bottom: previousRect.bottom + rect.bottom,
            right: previousRect.right + rect.right,
          };
        });
      }

      getNestedBoundingClientRect(node, boundaryWindow) {
        const ownerIframe = this.getOwnerIframe(node);
        if (ownerIframe && ownerIframe !== boundaryWindow) {
          const rects = [node.getBoundingClientRect()];
          let currentIframe = ownerIframe;
          let onlyOneMore = false;
          while (currentIframe) {
            const rect =
              this.getBoundingClientRectWithBorderOffset(currentIframe);
            rects.push(rect);
            currentIframe = this.getOwnerIframe(currentIframe);
            if (onlyOneMore) {
              break;
            }
            if (
              currentIframe &&
              this.getOwnerWindow(currentIframe) === boundaryWindow
            ) {
              onlyOneMore = true;
            }
          }
          return this.mergeRectOffsets(rects);
        }
        return node.getBoundingClientRect();
      }

      boxWrap(dimensions, parameter, node) {
        Object.assign(node.style, {
          borderTopWidth: dimensions[parameter + "Top"] + "px",
          borderLeftWidth: dimensions[parameter + "Left"] + "px",
          borderRightWidth: dimensions[parameter + "Right"] + "px",
          borderBottomWidth: dimensions[parameter + "Bottom"] + "px",
          borderStyle: "solid",
        });
      }
    }

    const inspect = new Inspector();

    /** onMessage.addListener
     * background.js 에서 보내준 메세지를 판단해 함수 실행
     * activate : 웹레코더가 활성화 되는 경우 (시작하거나 웹레코더 실행 중 새탭이 열릴경우)
     * deactivate : 웹레코더가 비활성화 되는 경우
     * record : 레코딩완료사인 보내줌
     * createRecord : record의 데이터를 웍디자이너형식에 맞게 가공 후 웍디자이너 탭으로 전송
     * dataScrapping : 데이터스크래핑
     * 그 외 : 마우스, 키보드, readAttribute 레코딩
     *  */
    chrome.runtime.onMessage.addListener((request) => {
      console.log("!@#$% request: ", request);
      if (request.action === "activate") {
        setTimeout(function () {
          if (request.recList != undefined && request.recList.length > 1) {
            inspect.drawRecList(request.recList);
          }
          return inspect.getOptions();
        }, 500);
      } else if (request.action === "deactivate") {
        return inspect.deactivate();
      } else if (request.action === "record") {
        let elements;
        storage.get(
          {
            data: [],
          },
          function (result) {
            elements = result.data;
            console.log(result.data);
          }
        );

        chrome.runtime.sendMessage({
          data: elements,
          tabId: request.tabId,
          type: "recordComplete",
        });
        // }
      } else if (request.action === "addViewDiv") {
        console.log("addViewDiv");
        for (var i in request.viewList) {
        }
      } else if (request.cmd == "dataScrapping") {
        chrome.storage.local.get(
          {
            scrapeData: [],
          },
          function (result) {
            // console.dir(result.scrapeData || result.scrapeData.secondElementData == undefined);
            // if(result.scrapeData.length == 0){
            //     inspect.dataScrapping('');
            // } else {
            // isSecondTarget = result.scrapeData.secondElementData;
            inspect.removeOverlay();
            inspect.dataScrapping(result.scrapeData);
            //}
          }
        );
      } else if (
        request.command == "contextMenu" &&
        request.cmd != null &&
        request.cmd != "dataScrapping" &&
        request.cmd != "readAttribute" &&
        request.cmd != "readTable"
      ) {
        inspect.removeOverlay();
        inspect.getData(request.cmd, request.command, null);
      } else if (request.action === "createRecord") {
        let createWebRecActivity = document.getElementById("createWebRecAct");
        if (createWebRecActivity) {
          let data;
          storage.get(
            {
              data: [],
            },
            function (result) {
              data = result.data;
              console.log(data);
              let i = 0;
              data.forEach(function (item, index, array) {
                i++;
                let act = document.createElement("span");
                act.setAttribute("data-url", item[0].url);
                act.setAttribute("data-type", item[0].type);
                act.setAttribute("data-xpath", item[0].xpath);
                act.setAttribute("data-key", item[0].key);
                act.setAttribute("data-image", item[0].image);
                createWebRecActivity.appendChild(act);
                if (i === array.length) {
                  createWebRecActivity.click();
                  setTimeout(function () {
                    while (createWebRecActivity.hasChildNodes()) {
                      createWebRecActivity.removeChild(
                        createWebRecActivity.firstChild
                      );
                    }
                    // storage.set({
                    //     data: [],
                    // });
                    storage.clear();
                  }, 3000);
                }
              });
            }
          );
        }

        return true;
      } else if (request.action === "selectNextPage") {
        selectNextPage = true;
        selectNextPageCnt = request.pageCnt;
        return inspect.getData();
      }
    });
    return true;
  })();
