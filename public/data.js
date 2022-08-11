/**data.js
 * 데이터스크래핑 내역을 확인, 수정, 다음 액션 지정하는 부분
 * data.html에 <button>, <table> 형태를 만들어준 뒤
 * 들어오는 데이터에 따라 tr과 td를 append해 테이블을 그려준다.
 */

let confirmBtn = document.getElementsByTagName('BUTTON');
let tbody = document.getElementsByTagName('TBODY');

let xpathArr = []; //데이터추가 된 후 xpath 스크래핑 내역
let textArr = []; //데이터추가 된 후 innerText 스크래핑 내역
let typeArr = []; // 스크래핑된 엘리먼트 최상위 태그 이름
let originArr = []; // 데이터추가 되기 전 xpath 스크래핑 내역
let originTextArr = []; // 데이터추가 되기 전 innerText 스크래핑 내역
let secondElementArr = [];
let image;
let scrapeData =[];

//버튼에 리스터 추가 storage의 데이터를 가져옴
function getData(){
  console.log(confirmBtn);
  confirmBtn[0].addEventListener('click', add);
  confirmBtn[1].addEventListener('click', resetTable);
  confirmBtn[2].addEventListener('click', save);
  confirmBtn[3].addEventListener('click', nextPage);
  confirmBtn[4].addEventListener('click', addSecondEle);

  chrome_storage_lock = false;
      chrome.storage.local.get({
        scrapeData:[]}, function(result){
          scrapeData = result.scrapeData;
          textArr = scrapeData[0].textData;
          typeArr = scrapeData[0].typeArr;
          originArr = scrapeData[0].originData;
          originTextArr = scrapeData[0].originTextData;
          image = scrapeData[0].image;
          xpathArr = scrapeData[0].xpathData;
          makeTable(textArr);
      });
}
 
function makeTable(textArr){
  console.log(secondElementArr);
  console.log(typeArr);
  for(var i = 0 ; i< textArr.length; i++){
    let tr_01 = document.createElement('tr');
    if(typeof(textArr[i]) != 'string'){
      for(var j = 0 ; j< textArr[i].length; j++){
        let td_01 = document.createElement('td');
            td_01.textContent = textArr[i][j];
            // 툴팁 추가
            td_01.setAttribute('title', textArr[i][j]);
            tr_01.appendChild(td_01);
          }
        }else{
          let td_01 = document.createElement('td');
          td_01.textContent = textArr[i];
          // 툴팁 추가
          td_01.setAttribute('title', textArr[i]);
          tr_01.appendChild(td_01);
    }
    tbody[0].appendChild(tr_01);
  }
  // 테이블 생성 후, 삭제버튼 추가
  addDeleteBtn();
  // 삭제버튼 추가 후, 마우스 액션 추가
  let deleteBtn = document.querySelectorAll('#result_data tr:first-child > td');
  if(deleteBtn.length > 0) {
    for(let i=1; i<deleteBtn.length; i++) {
      deleteBtn[i].addEventListener("mouseover", columnHover);
      deleteBtn[i].children[0].addEventListener("mouseover", columnHover);
      deleteBtn[i].addEventListener("mouseout", removeStyle);
    }
  }
}

function addDeleteBtn() {
  tbody[0].insertBefore(document.createElement('tr'), tbody[0].firstChild);
  let trTags = document.getElementsByTagName('tr');
  let colCnt = trTags[1].childElementCount;
    for(let i=0; i<colCnt; i++) {
      trTags[0].insertBefore(document.createElement('td'), trTags[0].firstChild);
    }
    for(let i=0; i<colCnt; i++) {
      document.querySelector('#result_data>tbody>tr').children[i].innerHTML = '<i class="far fa-trash-alt"></i>';
      document.querySelector('#result_data>tbody>tr').children[i].classList.add('deleteCol');
    }
    for(let i=0; i<trTags.length; i++) {
      let tdTags =trTags[i].getElementsByTagName('td');
      trTags[i].insertBefore(document.createElement('td'), tdTags[0]);
      if(i !=0){
        tdTags[0].classList.add('deleteRow');
        tdTags[0].innerHTML = '<i class="far fa-trash-alt"></i>';
      }
    }
  addListener();
}

//데이터 추가버튼 클릭시 현재 데이터를 저장한 후 window.close()
function add(){
  let scrapeData = {
    xpathData: xpathArr,
    textData: textArr,
    originData:[],
    originTextData:[],
    secondElementData : [],
    image : []
  };

  chrome.storage.local.set({
    scrapeData : scrapeData
  });

  window.close();
}

//두번째 엘리먼트 선택 시 두번째 엘리먼트 선택 키워드와 이전 스크래핑 내역을 저장 후 window.close()
function addSecondEle(){
  if(typeArr == 'TABLE'){
    alert('테이블은 두번째 엘리먼트를 추가할 수 없습니다.');
    return;
  }
  secondElementArr.push("second");
console.log(originTextArr);
  let scrapeData = {
    xpathData: originArr,
    textData: originTextArr,
    secondElementData : secondElementArr
  };
  
  chrome.storage.local.set({
    scrapeData : scrapeData
  });
console.log(scrapeData);
  setTimeout(() => {
   window.close();
   }, 500);
}

function save(){
  let row = xpathArr.length;
  let col = xpathArr[0].length;
  if(confirm('저장하시겠습니까?')){
    chrome.storage.local.set({
      scrapeData : []
    });
    console.log(image);
    chrome.runtime.sendMessage({xpathList:xpathArr ,textList:textArr, type:'readTable', key:[col,row], image:image});
    window.close();
  }
}

function deleteCol(e) {

  let ele = e.target;
  let table = document.getElementById('result_data');
  let idx = 0;
  if(e.target.tagName == 'I') {
    ele = ele.parentNode;
  }
    while((ele = ele.previousSibling) != null ) {
      idx++;
    }
    for(let i = 0; i < table.rows.length; i++)  {
      table.rows[i].deleteCell(idx);
    }
    for(let i = 0; i < xpathArr.length; i ++){
      xpathArr[i].splice(idx-1,1);
      textArr[i].splice(idx-1,1);
    }
}

function deleteRow(e) {

  let ele = e.target.parentNode;
  let table = document.getElementById('result_data');
  let idx = -1;
  if(e.target.tagName == 'I') {
    ele = ele.parentNode;
  }
    while((ele = ele.previousSibling) != null ) {
      idx++;      
    }
      xpathArr.splice(idx-1,1);
      textArr.splice(idx-1,1);
      table.deleteRow(idx);
}

function addListener(){
  let deleteBtn =  document.querySelectorAll('.deleteCol');
  for(var i = 0  ; i < deleteBtn.length; i++){
    deleteBtn[i].addEventListener('click', deleteCol);
  }
  deleteBtn =  document.querySelectorAll('.deleteRow');
  for(var i = 0  ; i < deleteBtn.length; i++){
    deleteBtn[i].addEventListener('click', deleteRow);
  }
}

function resetTable(){
  if(confirm('데이터를 초기화 하시겠습니까?')){
    chrome.storage.local.set({
      scrapeData : []
    });
    setTimeout(() => {
      window.close();
    }, 500);
  }
}

function columnHover(e) {
  let table = document.getElementById("result_data");
  let ele = e.target;
  let idx = 0; // 현재 선택한 컬럼 index
  
  // 내부 휴지통 아이콘일 경우 현재 Elem을 부모노드로 변경
  if(e.target.tagName == 'I') {
    ele = ele.parentNode;
  }
  while((ele = ele.previousSibling) != null ) {
    idx++;
  }
  if(idx > 0) {
    let select = document.querySelectorAll('tr td:nth-child('+(idx+1)+')');
    for(let i=0; i<select.length; i++) {
      select[i].classList.add('selectCol');
    }     
  }
}

function removeStyle(e) {
  let table = document.getElementById("result_data");
  let ele = e.target;
  let idx = 0; // 현재 선택한 컬럼 index
  while((ele = ele.previousSibling) != null ) {
    idx++;
  }
  if(idx > 0) {
    let select = document.querySelectorAll('tr td:nth-child('+(idx+1)+')');
    select[0].children[0].classList.remove('selectCol');
    for(let i=0; i<select.length; i++) {
      select[i].classList.remove('selectCol');
    }
  }
}

function nextPage(){
    let row = xpathArr.length;
    let col = xpathArr[0].length;
    var comment = '스크래핑할 페이지수를 지정해 주세요. \r\n';
    var pageCnt = window.prompt(comment);
    
    if(pageCnt){
      comment = '웹 페이지에서 다음페이지로 이동하는 버튼을 클릭해 주세요. \r* 숫자가 아닌 페이지 이동버튼을 눌러주세요.';
    }
    if(alert(comment)){
        chrome.storage.local.set({
          scrapeData : []
        });
    }
    chrome.runtime.sendMessage({xpathList:xpathArr ,textList:textArr, type:'selectNextPage', key:[col,row], image:image, pageCnt : pageCnt});
    window.close();

}

document.addEventListener('DOMContentLoaded', getData);